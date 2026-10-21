'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql, inArray } = require('drizzle-orm')
const { getFactores } = require('../utils/factores')

/**
 * Rutas especializadas para la Gestión de Cajas, Turnos y Totales
 * Prefijo: /api/cajas
 * 
 * Tablas involucradas:
 * - schema.caja_turnos
 * - schema.caja_totales
 * - schema.caja_serie_correlativo
 * - schema.ventas
 * - schema.ventas_pagos
 * - schema.compra
 * - schema.compras_pagos
 */
async function cajasRoutes(fastify) {
  // Asegura autenticación y autorización RBAC dinámica
  fastify.addHook('preHandler', fastify.authorize)

  // ═════════════════════════════════════════════════════════════════════
  // 1. SERIES Y CORRELATIVOS DE CAJA (caja_serie_correlativo)
  // ═════════════════════════════════════════════════════════════════════

  // GET /api/cajas - Lista de series/cajas configuradas
  fastify.get('/', async (request, reply) => {
    const branchId = request.user?.branch_id
    const conditions = []

    if (!request.user.es_super_admin && branchId) {
      conditions.push(or(eq(schema.caja_serie_correlativo.branch_id, branchId), sql`${schema.caja_serie_correlativo.branch_id} IS NULL`))
    }

    const series = await db
      .select({
        id: schema.caja_serie_correlativo.id,
        identificador_caja: schema.caja_serie_correlativo.identificador_caja,
        nombre: schema.caja_serie_correlativo.nombre,
        serie: schema.caja_serie_correlativo.serie,
        correlativo: schema.caja_serie_correlativo.correlativo,
        branch_id: schema.caja_serie_correlativo.branch_id,
        tipo_comprobante_id: schema.caja_serie_correlativo.tipo_comprobante_id,
        tipo_comprobante_descripcion: schema.tipo_comprobante.descripcion,
        tipo_caja: schema.caja_serie_correlativo.tipo_caja,
        usuario_id: schema.caja_serie_correlativo.usuario_id,
        activo: schema.caja_serie_correlativo.activo,
        created_at: schema.caja_serie_correlativo.created_at,
        updated_at: schema.caja_serie_correlativo.updated_at,
      })
      .from(schema.caja_serie_correlativo)
      .leftJoin(schema.tipo_comprobante, eq(schema.caja_serie_correlativo.tipo_comprobante_id, schema.tipo_comprobante.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.caja_serie_correlativo.created_at))

    return reply.code(200).send({ success: true, data: series })
  })

  // GET /api/cajas/configuradas - Lista consolidada de cajas físicas para apertura de turno
  fastify.get('/configuradas', async (request, reply) => {
    const branchId = request.user?.branch_id
    const userId = request.user?.id

    const conditions = [
      eq(schema.caja_serie_correlativo.activo, true)
    ]

    if (!request.user.es_super_admin && branchId) {
      conditions.push(or(eq(schema.caja_serie_correlativo.branch_id, branchId), sql`${schema.caja_serie_correlativo.branch_id} IS NULL`))
    }

    // Filtrar si una caja está restringida a un usuario específico
    if (!request.user.es_super_admin && userId) {
      conditions.push(or(eq(schema.caja_serie_correlativo.usuario_id, userId), sql`${schema.caja_serie_correlativo.usuario_id} IS NULL`))
    }

    const series = await db
      .select({
        id: schema.caja_serie_correlativo.id,
        identificador_caja: schema.caja_serie_correlativo.identificador_caja,
        nombre: schema.caja_serie_correlativo.nombre,
        serie: schema.caja_serie_correlativo.serie,
        correlativo: schema.caja_serie_correlativo.correlativo,
        branch_id: schema.caja_serie_correlativo.branch_id,
        tipo_comprobante_id: schema.caja_serie_correlativo.tipo_comprobante_id,
        tipo_comprobante_descripcion: schema.tipo_comprobante.descripcion,
        tipo_caja: schema.caja_serie_correlativo.tipo_caja,
        usuario_id: schema.caja_serie_correlativo.usuario_id,
        activo: schema.caja_serie_correlativo.activo,
      })
      .from(schema.caja_serie_correlativo)
      .leftJoin(schema.tipo_comprobante, eq(schema.caja_serie_correlativo.tipo_comprobante_id, schema.tipo_comprobante.id))
      .where(and(...conditions))
      .orderBy(schema.caja_serie_correlativo.identificador_caja)

    // Agrupar por identificador_caja
    const cajasMap = {}
    series.forEach(item => {
      const iden = item.identificador_caja || 'SIN-IDENTIFICADOR'
      if (!cajasMap[iden]) {
        cajasMap[iden] = {
          identificador_caja: iden,
          nombre: item.nombre,
          tipo_caja: item.tipo_caja || 'ADMINISTRATIVA',
          branch_id: item.branch_id,
          usuario_id: item.usuario_id,
          activo: item.activo,
          series: []
        }
      }
      cajasMap[iden].series.push({
        id: item.id,
        serie: item.serie,
        correlativo: item.correlativo,
        tipo_comprobante_id: item.tipo_comprobante_id,
        tipo_comprobante_descripcion: item.tipo_comprobante_descripcion || item.tipo_comprobante_id
      })
    })

    // Consultar cuáles de estos identificadores tienen actualmente un turno ABIERTO en la sucursal
    const turnosAbiertos = await db
      .select({
        identificador_caja: schema.caja_turnos.identificador_caja,
        usuario_id: schema.caja_turnos.usuario_id,
        usuario_nombre: schema.usuarios.nombre,
        fecha_apertura: schema.caja_turnos.fecha_apertura
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .where(
        and(
          eq(schema.caja_turnos.estado, 'ABIERTA'),
          branchId ? eq(schema.caja_turnos.branch_id, branchId) : undefined
        )
      )

    const mapaOcupadas = {}
    turnosAbiertos.forEach(t => {
      mapaOcupadas[t.identificador_caja] = {
        usuario_id: t.usuario_id,
        usuario_nombre: t.usuario_nombre,
        fecha_apertura: t.fecha_apertura
      }
    })

    const resultado = Object.values(cajasMap).map(c => ({
      ...c,
      disponible: !mapaOcupadas[c.identificador_caja],
      ocupada_por: mapaOcupadas[c.identificador_caja] || null
    }))

    return reply.code(200).send({ success: true, data: resultado })
  })


  // POST /api/cajas - Crea serie/caja
  fastify.post('/', async (request, reply) => {
    const payload = { ...request.body }
    if (!request.user.es_super_admin && request.user.branch_id) {
      payload.branch_id = request.user.branch_id
    }

    const [nueva] = await db
      .insert(schema.caja_serie_correlativo)
      .values({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .returning()

    return reply.code(201).send({ success: true, message: 'Serie de caja registrada', data: nueva })
  })

  // PUT /api/cajas/:id - Actualiza serie/caja
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const payload = { ...request.body }

    const [updated] = await db
      .update(schema.caja_serie_correlativo)
      .set({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .where(eq(schema.caja_serie_correlativo.id, id))
      .returning()

    if (!updated) {
      throw fastify.httpErrors.notFound('Serie de caja no encontrada')
    }

    return reply.code(200).send({ success: true, message: 'Serie de caja actualizada', data: updated })
  })

  // DELETE /api/cajas/:id - Inactiva serie/caja
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const [updated] = await db
      .update(schema.caja_serie_correlativo)
      .set({ activo: false, updated_at: new Date().toISOString() })
      .where(eq(schema.caja_serie_correlativo.id, id))
      .returning()

    if (!updated) {
      throw fastify.httpErrors.notFound('Serie de caja no encontrada')
    }

    return reply.code(200).send({ success: true, message: 'Serie de caja inactivada' })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 2. GESTIÓN DE TURNOS (caja_turnos) Y TOTALES (caja_totales)
  // ═════════════════════════════════════════════════════════════════════

  // GET /api/cajas/turnos - Histórico de turnos con filtros
  fastify.get('/turnos', async (request, reply) => {
    const { estado, fecha, usuario_id, identificador_caja } = request.query
    const branchId = request.user?.branch_id

    const conditions = []
    if (!request.user.es_super_admin && branchId) {
      conditions.push(eq(schema.caja_turnos.branch_id, branchId))
    }
    if (estado) {
      conditions.push(eq(schema.caja_turnos.estado, estado))
    }
    if (usuario_id) {
      conditions.push(eq(schema.caja_turnos.usuario_id, usuario_id))
    }
    if (identificador_caja) {
      conditions.push(eq(schema.caja_turnos.identificador_caja, identificador_caja))
    }
    if (fecha) {
      conditions.push(sql`DATE(${schema.caja_turnos.fecha_apertura}) = ${fecha}`)
    }

    const { factorPrecio } = await getFactores()

    const turnos = await db
      .select({
        id: schema.caja_turnos.id,
        usuario_id: schema.caja_turnos.usuario_id,
        usuario_nombre: schema.usuarios.nombre,
        identificador_caja: schema.caja_turnos.identificador_caja,
        branch_id: schema.caja_turnos.branch_id,
        monto_apertura: schema.caja_turnos_resumen.monto_apertura,
        fecha_apertura: schema.caja_turnos.fecha_apertura,
        fecha_cierre_f: schema.caja_turnos.fecha_cierre_f,
        estado: schema.caja_turnos.estado,
        created_at: schema.caja_turnos.created_at,
        updated_at: schema.caja_turnos.updated_at,
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .leftJoin(schema.caja_turnos_resumen, eq(schema.caja_turnos.id, schema.caja_turnos_resumen.caja_turno_id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.caja_turnos.fecha_apertura))

    const turnosFormateados = turnos.map(t => ({
      ...t,
      monto_apertura: Number(t.monto_apertura || 0) / factorPrecio
    }))

    return reply.code(200).send({ success: true, data: turnosFormateados })
  })

  // GET /api/cajas/turnos/activo - Obtiene el turno actualmente ABIERTO para el usuario en la sucursal
  fastify.get('/turnos/activo', async (request, reply) => {
    const branchId = request.user?.branch_id
    const userId = request.user?.id

    const conditions = [
      eq(schema.caja_turnos.estado, 'ABIERTA')
    ]

    if (!request.user.es_super_admin) {
      if (branchId) conditions.push(eq(schema.caja_turnos.branch_id, branchId))
      if (userId) conditions.push(eq(schema.caja_turnos.usuario_id, userId))
    }

    const [turno] = await db
      .select({
        id: schema.caja_turnos.id,
        usuario_id: schema.caja_turnos.usuario_id,
        usuario_nombre: schema.usuarios.nombre,
        identificador_caja: schema.caja_turnos.identificador_caja,
        branch_id: schema.caja_turnos.branch_id,
        monto_apertura: schema.caja_turnos_resumen.monto_apertura,
        fecha_apertura: schema.caja_turnos.fecha_apertura,
        fecha_cierre_f: schema.caja_turnos.fecha_cierre_f,
        estado: schema.caja_turnos.estado,
        created_at: schema.caja_turnos.created_at,
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .leftJoin(schema.caja_turnos_resumen, eq(schema.caja_turnos.id, schema.caja_turnos_resumen.caja_turno_id))
      .where(and(...conditions))
      .orderBy(desc(schema.caja_turnos.fecha_apertura))

    if (!turno) {
      return reply.code(200).send({ success: true, data: null, message: 'No hay turno abierto' })
    }

    // Obtener los pagos por método asociados al turno desde caja_turno_pagos
    const pagosMetodos = await db
      .select({
        id: schema.caja_turno_pagos.id,
        caja_turno_id: schema.caja_turno_pagos.caja_turno_id,
        metodo_pago_id: schema.caja_turno_pagos.metodo_pago_id,
        metodo_pago_nombre: schema.tipo_metodo_pago.nombre,
        monto_sistema: schema.caja_turno_pagos.monto_sistema,
        monto_declarado: schema.caja_turno_pagos.monto_declarado,
        diferencia: schema.caja_turno_pagos.diferencia,
        observacion: schema.caja_turno_pagos.observacion,
      })
      .from(schema.caja_turno_pagos)
      .leftJoin(schema.tipo_metodo_pago, eq(schema.caja_turno_pagos.metodo_pago_id, schema.tipo_metodo_pago.id))
      .where(eq(schema.caja_turno_pagos.caja_turno_id, turno.id))

    // Consultar pagos reales de ventas vinculadas a este turno desde ventas_pagos
    const pagosVentas = await db
      .select({
        metodo_pago_id: schema.ventas_pagos.metodo_pago_id,
        total: sql`COALESCE(SUM(${schema.ventas_pagos.monto}), 0)`
      })
      .from(schema.ventas_pagos)
      .innerJoin(schema.ventas, eq(schema.ventas_pagos.venta_id, schema.ventas.id))
      .where(
        and(
          eq(schema.ventas.caja_turno_id, turno.id),
          eq(schema.ventas_pagos.estado, 'PAGADO'),
          or(eq(schema.ventas.estado, 'EMITIDO'), sql`${schema.ventas.estado} IS NULL`)
        )
      )
      .groupBy(schema.ventas_pagos.metodo_pago_id)

    const mapaPagos = {}
    pagosVentas.forEach(p => {
      mapaPagos[String(p.metodo_pago_id)] = Number(p.total || 0)
    })

    // Consultar movimientos manuales (ingresos/egresos) para sumar/restar a efectivo
    const movsTurno = await db
      .select({
        tipo: schema.caja_movimientos.tipo_movimiento,
        total: sql`COALESCE(SUM(${schema.caja_movimientos.monto_total}), 0)`
      })
      .from(schema.caja_movimientos)
      .where(eq(schema.caja_movimientos.caja_turno_id, turno.id))
      .groupBy(schema.caja_movimientos.tipo_movimiento)

    let netMovsEfectivo = 0
    movsTurno.forEach(m => {
      if (m.tipo === 'INGRESO') netMovsEfectivo += Number(m.total || 0)
      if (m.tipo === 'EGRESO') netMovsEfectivo -= Number(m.total || 0)
    })

    const { factorPrecio } = await getFactores()

    // Formatear montos en decimales usando el factorPrecio dinámico (ej. 1000) integrando ventas_pagos
    const totalesFormateados = pagosMetodos.map(t => {
      const metodoId = String(t.metodo_pago_id)
      const montoVentasPagos = mapaPagos[metodoId] || 0
      const esEfectivo = metodoId === '1' || metodoId === '01'
      const sistemaInt = montoVentasPagos

      return {
        ...t,
        monto_sistema: sistemaInt / factorPrecio,
        monto_declarado: Number(t.monto_declarado || 0) / factorPrecio,
        diferencia: Number(t.diferencia || 0) / factorPrecio,
      }
    })

    const totalEfectivoVentasPagos = (mapaPagos['1'] || mapaPagos['01'] || 0) / factorPrecio
    const montoAperturaNum = Number(turno.monto_apertura || 0)
    const totalEfectivoNeto = (montoAperturaNum + (mapaPagos['1'] || mapaPagos['01'] || 0) + netMovsEfectivo) / factorPrecio

    return reply.code(200).send({
      success: true,
      data: {
        ...turno,
        monto_apertura: montoAperturaNum / factorPrecio,
        totales: totalesFormateados,
        efectivo_ventas_pagos: totalEfectivoVentasPagos,
        efectivo_total_en_caja: totalEfectivoNeto
      }
    })
  })

  // GET /api/cajas/turnos/:id - Detalle completo de un turno (con arqueo, resumen y balance de ventas)
  fastify.get('/turnos/:id', async (request, reply) => {
    const { id } = request.params

    const [turno] = await db
      .select({
        id: schema.caja_turnos.id,
        usuario_id: schema.caja_turnos.usuario_id,
        usuario_nombre: schema.usuarios.nombre,
        identificador_caja: schema.caja_turnos.identificador_caja,
        branch_id: schema.caja_turnos.branch_id,
        fecha_apertura: schema.caja_turnos.fecha_apertura,
        fecha_cierre_f: schema.caja_turnos.fecha_cierre_f,
        estado: schema.caja_turnos.estado,
        created_at: schema.caja_turnos.created_at,
        updated_at: schema.caja_turnos.updated_at,
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .where(eq(schema.caja_turnos.id, id))

    if (!turno) {
      throw fastify.httpErrors.notFound('Turno de caja no encontrado')
    }

    // Consultar caja_turno_pagos
    const pagosMetodos = await db
      .select({
        id: schema.caja_turno_pagos.id,
        caja_turno_id: schema.caja_turno_pagos.caja_turno_id,
        metodo_pago_id: schema.caja_turno_pagos.metodo_pago_id,
        metodo_pago_nombre: schema.tipo_metodo_pago.nombre,
        monto_sistema: schema.caja_turno_pagos.monto_sistema,
        monto_declarado: schema.caja_turno_pagos.monto_declarado,
        diferencia: schema.caja_turno_pagos.diferencia,
        observacion: schema.caja_turno_pagos.observacion,
      })
      .from(schema.caja_turno_pagos)
      .leftJoin(schema.tipo_metodo_pago, eq(schema.caja_turno_pagos.metodo_pago_id, schema.tipo_metodo_pago.id))
      .where(eq(schema.caja_turno_pagos.caja_turno_id, id))

    // Consultar caja_turnos_resumen (contiene monto_apertura y métricas analíticas)
    const [resumenCierre] = await db
      .select()
      .from(schema.caja_turnos_resumen)
      .where(eq(schema.caja_turnos_resumen.caja_turno_id, id))

    // Consultar ventas vinculadas al turno
    const ventasTurno = await db
      .select({
        id: schema.ventas.id,
        serie: schema.ventas.serie,
        correlativo: schema.ventas.correlativo,
        total_venta: schema.ventas.total_venta,
        tipo_comprobante_id: schema.ventas.tipo_comprobante_id,
        tipo_pago_id: schema.ventas.tipo_pago_id,
        estado: schema.ventas.estado,
        fecha_emision: schema.ventas.fecha_emision
      })
      .from(schema.ventas)
      .where(eq(schema.ventas.caja_turno_id, id))

    // Consultar pagos reales de ventas vinculadas a este turno desde ventas_pagos
    const pagosVentas = await db
      .select({
        metodo_pago_id: schema.ventas_pagos.metodo_pago_id,
        total: sql`COALESCE(SUM(${schema.ventas_pagos.monto}), 0)`
      })
      .from(schema.ventas_pagos)
      .innerJoin(schema.ventas, eq(schema.ventas_pagos.venta_id, schema.ventas.id))
      .where(
        and(
          eq(schema.ventas.caja_turno_id, id),
          eq(schema.ventas_pagos.estado, 'PAGADO'),
          or(eq(schema.ventas.estado, 'EMITIDO'), sql`${schema.ventas.estado} IS NULL`)
        )
      )
      .groupBy(schema.ventas_pagos.metodo_pago_id)

    const mapaPagos = {}
    pagosVentas.forEach(p => {
      mapaPagos[String(p.metodo_pago_id)] = Number(p.total || 0)
    })

    // Consultar movimientos manuales (ingresos/egresos) para sumar/restar a efectivo
    const movsTurno = await db
      .select({
        tipo: schema.caja_movimientos.tipo_movimiento,
        total: sql`COALESCE(SUM(${schema.caja_movimientos.monto_total}), 0)`
      })
      .from(schema.caja_movimientos)
      .where(eq(schema.caja_movimientos.caja_turno_id, id))
      .groupBy(schema.caja_movimientos.tipo_movimiento)

    let netMovsEfectivo = 0
    movsTurno.forEach(m => {
      if (m.tipo === 'INGRESO') netMovsEfectivo += Number(m.total || 0)
      if (m.tipo === 'EGRESO') netMovsEfectivo -= Number(m.total || 0)
    })

    const { factorPrecio } = await getFactores()

    // Formatear totales integrando ventas_pagos reales usando el factorPrecio dinámico
    const totalesFormateados = pagosMetodos.map(t => {
      const metodoId = String(t.metodo_pago_id)
      const montoVentasPagos = mapaPagos[metodoId] || 0
      const sistemaInt = turno.estado === 'CERRADA' ? Number(t.monto_sistema || 0) : montoVentasPagos

      return {
        ...t,
        monto_sistema: sistemaInt / factorPrecio,
        monto_declarado: Number(t.monto_declarado || 0) / factorPrecio,
        diferencia: Number(t.diferencia || 0) / factorPrecio,
      }
    })

    const ventasFormateadas = ventasTurno.map(v => ({
      ...v,
      total_venta: Number(v.total_venta || 0) / factorPrecio
    }))

    const montoAperturaNum = Number(turno.monto_apertura || 0)
    const totalEfectivoVentasPagos = (mapaPagos['1'] || mapaPagos['01'] || 0) / factorPrecio
    const totalEfectivoNeto = (montoAperturaNum + (mapaPagos['1'] || mapaPagos['01'] || 0) + netMovsEfectivo) / factorPrecio

    let resumenFormateado = null
    if (resumenCierre) {
      resumenFormateado = {
        ...resumenCierre,
        total_ventas_brutas: Number(resumenCierre.total_ventas_brutas || 0) / factorPrecio,
        total_ventas_netas: Number(resumenCierre.total_ventas_netas || 0) / factorPrecio,
        total_ingresos: Number(resumenCierre.total_ingresos || 0) / factorPrecio,
        total_egresos: Number(resumenCierre.total_egresos || 0) / factorPrecio,
        total_ventas_credito: Number(resumenCierre.total_ventas_credito || 0) / factorPrecio,
        total_ventas_contado: Number(resumenCierre.total_ventas_contado || 0) / factorPrecio,
        total_facturas: Number(resumenCierre.total_facturas || 0) / factorPrecio,
        total_boletas: Number(resumenCierre.total_boletas || 0) / factorPrecio,
        total_vales: Number(resumenCierre.total_vales || 0) / factorPrecio,
        total_notas_credito: Number(resumenCierre.total_notas_credito || 0) / factorPrecio,
        total_notas_debito: Number(resumenCierre.total_notas_debito || 0) / factorPrecio,
        total_aceptados: Number(resumenCierre.total_aceptados || 0) / factorPrecio,
        total_observados: Number(resumenCierre.total_observados || 0) / factorPrecio,
        total_rechazados: Number(resumenCierre.total_rechazados || 0) / factorPrecio,
        total_pendientes_envio: Number(resumenCierre.total_pendientes_envio || 0) / factorPrecio,
        total_anulaciones: Number(resumenCierre.total_anulaciones || 0) / factorPrecio,
        total_descuentos: Number(resumenCierre.total_descuentos || 0) / factorPrecio,
        total_impuestos: Number(resumenCierre.total_impuestos || 0) / factorPrecio,
        total_gravado: Number(resumenCierre.total_gravado || 0) / factorPrecio,
        total_exonerado: Number(resumenCierre.total_exonerado || 0) / factorPrecio,
        total_inafecto: Number(resumenCierre.total_inafecto || 0) / factorPrecio,
        monto_apertura: Number(resumenCierre.monto_apertura || 0) / factorPrecio,
        monto_sistema: Number(resumenCierre.monto_sistema || 0) / factorPrecio,
        monto_declarado: Number(resumenCierre.monto_declarado || 0) / factorPrecio,
        diferencia: Number(resumenCierre.diferencia || 0) / factorPrecio,
      }
    }

    return reply.code(200).send({
      success: true,
      data: {
        ...turno,
        monto_apertura: montoAperturaNum / factorPrecio,
        totales: totalesFormateados,
        ventas: ventasFormateadas,
        resumen: resumenFormateado,
        efectivo_ventas_pagos: totalEfectivoVentasPagos,
        efectivo_total_en_caja: totalEfectivoNeto,
        resumen_ventas: {
          cantidad: ventasTurno.length,
          total: ventasTurno.reduce((acc, curr) => acc + (Number(curr.total_venta || 0) / factorPrecio), 0)
        }
      }
    })
  })

  // POST /api/cajas/turnos/apertura - Aperturar nuevo turno de caja
  fastify.post('/turnos/apertura', async (request, reply) => {
    const { identificador_caja, monto_apertura, observacion } = request.body
    const branchId = request.user?.branch_id
    const userId = request.user?.id

    if (!identificador_caja || identificador_caja.trim() === '') {
      return reply.code(400).send({ success: false, message: 'El identificador de caja es requerido.' })
    }

    if (!branchId) {
      return reply.code(400).send({ success: false, message: 'Se requiere una sucursal activa en la sesión.' })
    }

    const idenLimpio = identificador_caja.trim()

    // 1. Validar que la caja física exista y esté activa para esta sucursal en caja_serie_correlativo
    const seriesCaja = await db
      .select({
        id: schema.caja_serie_correlativo.id,
        identificador_caja: schema.caja_serie_correlativo.identificador_caja,
        nombre: schema.caja_serie_correlativo.nombre,
        tipo_caja: schema.caja_serie_correlativo.tipo_caja,
        usuario_id: schema.caja_serie_correlativo.usuario_id,
        activo: schema.caja_serie_correlativo.activo,
        branch_id: schema.caja_serie_correlativo.branch_id
      })
      .from(schema.caja_serie_correlativo)
      .where(
        and(
          eq(schema.caja_serie_correlativo.identificador_caja, idenLimpio),
          eq(schema.caja_serie_correlativo.activo, true),
          or(eq(schema.caja_serie_correlativo.branch_id, branchId), sql`${schema.caja_serie_correlativo.branch_id} IS NULL`)
        )
      )

    if (!seriesCaja || seriesCaja.length === 0) {
      return reply.code(400).send({
        success: false,
        message: `La caja "${idenLimpio}" no existe o no tiene series activas configuradas para esta sucursal.`
      })
    }

    // Si la caja está asignada a un usuario específico, validar que sea el usuario actual
    const asignadaA = seriesCaja.find(s => s.usuario_id)
    if (asignadaA && asignadaA.usuario_id !== userId && !request.user.es_super_admin) {
      return reply.code(403).send({
        success: false,
        message: `La caja "${idenLimpio}" está asignada exclusivamente a otro usuario.`
      })
    }

    // 2. Validar que el usuario no tenga ya un turno abierto en esta u otra caja
    const [turnoUsuarioAbierto] = await db
      .select({ id: schema.caja_turnos.id, identificador_caja: schema.caja_turnos.identificador_caja })
      .from(schema.caja_turnos)
      .where(
        and(
          eq(schema.caja_turnos.branch_id, branchId),
          eq(schema.caja_turnos.usuario_id, userId),
          eq(schema.caja_turnos.estado, 'ABIERTA')
        )
      )

    if (turnoUsuarioAbierto) {
      return reply.code(400).send({
        success: false,
        message: `Ya tienes un turno abierto en la caja "${turnoUsuarioAbierto.identificador_caja}". Debes cerrarlo antes de aperturar uno nuevo.`
      })
    }

    // 3. Validar que la caja física seleccionada no esté siendo operada por otro cajero en simultáneo
    const [cajaEnUso] = await db
      .select({
        id: schema.caja_turnos.id,
        usuario_id: schema.caja_turnos.usuario_id,
        usuario_nombre: schema.usuarios.nombre
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .where(
        and(
          eq(schema.caja_turnos.branch_id, branchId),
          eq(schema.caja_turnos.identificador_caja, idenLimpio),
          eq(schema.caja_turnos.estado, 'ABIERTA')
        )
      )

    if (cajaEnUso) {
      return reply.code(400).send({
        success: false,
        message: `La caja "${idenLimpio}" ya se encuentra ABIERTA y en operación por el usuario ${cajaEnUso.usuario_nombre || 'otro cajero'}.`
      })
    }

    // 4. Obtener catálogo oficial de métodos de pago para inicializarlos en caja_turno_pagos
    const metodosExistentes = await db
      .select({ id: schema.tipo_metodo_pago.id, nombre: schema.tipo_metodo_pago.nombre })
      .from(schema.tipo_metodo_pago)

    // 5. Transacción atómica de apertura
    const result = await db.transaction(async (tx) => {
      const { factorPrecio } = await getFactores()
      const montoEfectivoCentimos = Math.round(Number(monto_apertura || 0) * factorPrecio)

      const [nuevoTurno] = await tx
        .insert(schema.caja_turnos)
        .values({
          usuario_id: userId,
          identificador_caja: idenLimpio,
          branch_id: branchId,
          fecha_apertura: sql`NOW()`,
          estado: 'ABIERTA',
          sincronizado: false,
          created_at: sql`NOW()`,
          updated_at: sql`NOW()`
        })
        .returning()

      // Registrar el monto de apertura y la cabecera en caja_turnos_resumen
      await tx.insert(schema.caja_turnos_resumen).values({
        caja_turno_id: nuevoTurno.id,
        monto_apertura: montoEfectivoCentimos,
        desglose_metodos_pago_jsonb: [],
        desglose_tipos_pago_jsonb: [],
        desglose_anulaciones_jsonb: [],
        created_at: sql`NOW()`,
        updated_at: sql`NOW()`
      })

      // Preparar registros para caja_turno_pagos limpios (solo métodos de pago)
      const listaMetodos = metodosExistentes.length > 0
        ? metodosExistentes
        : [{ id: '1', nombre: 'EFECTIVO' }, { id: '2', nombre: 'YAPE' }, { id: '3', nombre: 'TRANSFERENCIA' }, { id: '4', nombre: 'CREDITO' }]

      const registrosTotales = listaMetodos.map(m => {
        return {
          caja_turno_id: nuevoTurno.id,
          metodo_pago_id: String(m.id),
          monto_sistema: 0,
          monto_declarado: 0,
          diferencia: 0,
          observacion: observacion || `Inicialización ${m.nombre}`,
          sincronizado: false,
          created_at: sql`NOW()`,
          updated_at: sql`NOW()`
        }
      })

      await tx.insert(schema.caja_turno_pagos).values(registrosTotales)

      return {
        ...nuevoTurno,
        monto_apertura: montoEfectivoCentimos
      }
    })

    return reply.code(201).send({
      success: true,
      message: `Caja "${idenLimpio}" aperturada exitosamente`,
      data: result
    })
  })

// ═════════════════════════════════════════════════════════════════════
// 3. MOVIMIENTOS DE CAJA (caja_movimientos: Ingresos / Egresos manuales)
// ═════════════════════════════════════════════════════════════════════

// GET /api/cajas/turnos/:id/movimientos - Listar movimientos de un turno
fastify.get('/turnos/:id/movimientos', async (request, reply) => {
  const { id } = request.params

  const movimientos = await db
    .select({
      id: schema.caja_movimientos.id,
      caja_turno_id: schema.caja_movimientos.caja_turno_id,
      branch_id: schema.caja_movimientos.branch_id,
      usuario_id: schema.caja_movimientos.usuario_id,
      usuario_nombre: schema.usuarios.nombre,
      tipo_movimiento: schema.caja_movimientos.tipo_movimiento,
      concepto: schema.caja_movimientos.concepto,
      monto_total: schema.caja_movimientos.monto_total,
      observacion: schema.caja_movimientos.observacion,
      created_at: schema.caja_movimientos.created_at,
    })
    .from(schema.caja_movimientos)
    .leftJoin(schema.usuarios, eq(schema.caja_movimientos.usuario_id, schema.usuarios.id))
    .where(eq(schema.caja_movimientos.caja_turno_id, id))
    .orderBy(desc(schema.caja_movimientos.created_at))

  const { factorPrecio } = await getFactores()
  const formateados = movimientos.map(m => ({
    ...m,
    monto_total: Number(m.monto_total || 0) / factorPrecio
  }))

  return reply.code(200).send({ success: true, data: formateados })
})

// POST /api/cajas/turnos/:id/movimientos - Registrar ingreso o egreso en el turno con arqueo de denominaciones
fastify.post('/turnos/:id/movimientos', async (request, reply) => {
  const { id } = request.params
  const { tipo_movimiento, concepto, monto, observacion, conteos, arqueo } = request.body
  const userId = request.user?.id
  const branchId = request.user?.branch_id

  if (!tipo_movimiento || !['INGRESO', 'EGRESO'].includes(tipo_movimiento.toUpperCase())) {
    return reply.code(400).send({ success: false, message: 'El tipo_movimiento debe ser INGRESO o EGRESO.' })
  }

  if (!concepto || concepto.trim() === '') {
    return reply.code(400).send({ success: false, message: 'El concepto del movimiento es requerido.' })
  }

  const montoNum = Number(monto || 0)
  if (montoNum <= 0) {
    return reply.code(400).send({ success: false, message: 'El monto debe ser mayor a cero.' })
  }

  const [turno] = await db
    .select()
    .from(schema.caja_turnos)
    .where(eq(schema.caja_turnos.id, id))

  if (!turno) throw fastify.httpErrors.notFound('Turno de caja no encontrado')
  if (turno.estado !== 'ABIERTA') {
    return reply.code(400).send({ success: false, message: 'No se pueden registrar movimientos en un turno cerrado.' })
  }

  const { factorPrecio } = await getFactores()
  const montoCentimos = Math.round(montoNum * factorPrecio)

  // Validar saldo suficiente en caso de EGRESO para evitar saldos negativos
  if (tipo_movimiento.toUpperCase() === 'EGRESO') {
    // 1. Fondo de apertura en efectivo (almacenado en caja_turnos_resumen)
    const [resumenTurno] = await db
      .select({ monto_apertura: schema.caja_turnos_resumen.monto_apertura })
      .from(schema.caja_turnos_resumen)
      .where(eq(schema.caja_turnos_resumen.caja_turno_id, id))

    const aperturaEfectivo = Number(resumenTurno?.monto_apertura || 0)

    // 2. Ventas pagadas en efectivo
    const [ventasEfectivo] = await db
      .select({
        total: sql`COALESCE(SUM(${schema.ventas_pagos.monto}), 0)`
      })
      .from(schema.ventas_pagos)
      .innerJoin(schema.ventas, eq(schema.ventas_pagos.venta_id, schema.ventas.id))
      .where(
        and(
          eq(schema.ventas.caja_turno_id, id),
          eq(schema.ventas_pagos.estado, 'PAGADO'),
          or(eq(schema.ventas_pagos.metodo_pago_id, '1'), eq(schema.ventas_pagos.metodo_pago_id, '01')),
          or(eq(schema.ventas.estado, 'EMITIDO'), sql`${schema.ventas.estado} IS NULL`)
        )
      )
    const ventasEfectivoTotal = Number(ventasEfectivo?.total || 0)

    // 3. Movimientos manuales previos
    const movsPrevios = await db
      .select({
        tipo: schema.caja_movimientos.tipo_movimiento,
        total: sql`COALESCE(SUM(${schema.caja_movimientos.monto_total}), 0)`
      })
      .from(schema.caja_movimientos)
      .where(eq(schema.caja_movimientos.caja_turno_id, id))
      .groupBy(schema.caja_movimientos.tipo_movimiento)

    let netMovsPrevios = 0
    movsPrevios.forEach(m => {
      if (m.tipo === 'INGRESO') netMovsPrevios += Number(m.total || 0)
      if (m.tipo === 'EGRESO') netMovsPrevios -= Number(m.total || 0)
    })

    const saldoDisponibleCentimos = aperturaEfectivo + ventasEfectivoTotal + netMovsPrevios
    if (montoCentimos > saldoDisponibleCentimos) {
      const saldoDisponibleVisual = (saldoDisponibleCentimos / factorPrecio).toFixed(2)
      return reply.code(400).send({
        success: false,
        message: `Saldo insuficiente en caja. El saldo disponible en efectivo es de S/ ${saldoDisponibleVisual}, no es posible retirar S/ ${montoNum.toFixed(2)}.`
      })
    }
  }

  // Normalizar denominaciones de arqueo
  let billete_200 = 0
  let billete_100 = 0
  let billete_50 = 0
  let billete_20 = 0
  let billete_10 = 0
  let moneda_5 = 0
  let moneda_2 = 0
  let moneda_1 = 0
  let moneda_050 = 0
  let moneda_020 = 0
  let moneda_010 = 0

  if (arqueo && typeof arqueo === 'object') {
    billete_200 = parseInt(arqueo.billete_200 || 0, 10) || 0
    billete_100 = parseInt(arqueo.billete_100 || 0, 10) || 0
    billete_50 = parseInt(arqueo.billete_50 || 0, 10) || 0
    billete_20 = parseInt(arqueo.billete_20 || 0, 10) || 0
    billete_10 = parseInt(arqueo.billete_10 || 0, 10) || 0
    moneda_5 = parseInt(arqueo.moneda_5 || 0, 10) || 0
    moneda_2 = parseInt(arqueo.moneda_2 || 0, 10) || 0
    moneda_1 = parseInt(arqueo.moneda_1 || 0, 10) || 0
    moneda_050 = parseInt(arqueo.moneda_050 || 0, 10) || 0
    moneda_020 = parseInt(arqueo.moneda_020 || 0, 10) || 0
    moneda_010 = parseInt(arqueo.moneda_010 || 0, 10) || 0
  } else if (Array.isArray(conteos)) {
    conteos.forEach(c => {
      const val = Number(c.denominacion || c.valor || 0)
      const cant = parseInt(c.cantidad || 0, 10) || 0
      if (val === 200) billete_200 = cant
      else if (val === 100) billete_100 = cant
      else if (val === 50) billete_50 = cant
      else if (val === 20) billete_20 = cant
      else if (val === 10) billete_10 = cant
      else if (val === 5) moneda_5 = cant
      else if (val === 2) moneda_2 = cant
      else if (val === 1) moneda_1 = cant
      else if (Math.abs(val - 0.5) < 0.001) moneda_050 = cant
      else if (Math.abs(val - 0.2) < 0.001) moneda_020 = cant
      else if (Math.abs(val - 0.1) < 0.001) moneda_010 = cant
    })
  }

  const { nuevoMovimiento, nuevoArqueo } = await db.transaction(async (tx) => {
    // Inserción del movimiento usando NOW() para la hora real de la base de datos
    const [mov] = await tx
      .insert(schema.caja_movimientos)
      .values({
        branch_id: branchId || turno.branch_id,
        caja_turno_id: id,
        usuario_id: userId,
        tipo_movimiento: tipo_movimiento.toUpperCase(),
        concepto: concepto.trim(),
        monto_total: montoCentimos,
        observacion: observacion || null,
        sincronizado: false,
        created_at: sql`NOW()`,
        updated_at: sql`NOW()`
      })
      .returning()

    // Inserción en caja_arqueos vinculado al movimiento
    const [arq] = await tx
      .insert(schema.caja_arqueos)
      .values({
        caja_movimiento_id: mov.id,
        subtotal: montoCentimos,
        billete_200,
        billete_100,
        billete_50,
        billete_20,
        billete_10,
        moneda_5,
        moneda_2,
        moneda_1,
        moneda_050,
        moneda_020,
        moneda_010,
        sincronizado: false,
        created_at: sql`NOW()`,
        updated_at: sql`NOW()`
      })
      .returning()

    return { nuevoMovimiento: mov, nuevoArqueo: arq }
  })

  return reply.code(201).send({
    success: true,
    message: `Movimiento de ${tipo_movimiento.toUpperCase()} registrado correctamente`,
    data: {
      ...nuevoMovimiento,
      monto_total: Number(nuevoMovimiento.monto_total || 0) / factorPrecio,
      arqueo: {
        ...nuevoArqueo,
        subtotal: Number(nuevoArqueo.subtotal || 0) / factorPrecio
      }
    }
  })
})

// GET /api/cajas/movimientos/:movimientoId/arqueo - Consultar arqueo de un movimiento específico
fastify.get('/movimientos/:movimientoId/arqueo', async (request, reply) => {
  const { movimientoId } = request.params

  const [arqueo] = await db
    .select()
    .from(schema.caja_arqueos)
    .where(eq(schema.caja_arqueos.caja_movimiento_id, movimientoId))

  if (!arqueo) {
    return reply.code(404).send({ success: false, message: 'Arqueo no encontrado para este movimiento' })
  }

  const { factorPrecio } = await getFactores()
  return reply.code(200).send({
    success: true,
    data: {
      ...arqueo,
      subtotal: Number(arqueo.subtotal || 0) / factorPrecio
    }
  })
})

// ═════════════════════════════════════════════════════════════════════
// 4. ARQUEOS DE CAJA (caja_arqueos: Conteo físico de denominaciones)
// ═════════════════════════════════════════════════════════════════════

// GET /api/cajas/turnos/:id/arqueos - Consultar arqueos asociados a los movimientos del turno
fastify.get('/turnos/:id/arqueos', async (request, reply) => {
  const { id } = request.params

  const arqueos = await db
    .select({
      id: schema.caja_arqueos.id,
      caja_movimiento_id: schema.caja_arqueos.caja_movimiento_id,
      subtotal: schema.caja_arqueos.subtotal,
      billete_200: schema.caja_arqueos.billete_200,
      billete_100: schema.caja_arqueos.billete_100,
      billete_50: schema.caja_arqueos.billete_50,
      billete_20: schema.caja_arqueos.billete_20,
      billete_10: schema.caja_arqueos.billete_10,
      moneda_5: schema.caja_arqueos.moneda_5,
      moneda_2: schema.caja_arqueos.moneda_2,
      moneda_1: schema.caja_arqueos.moneda_1,
      moneda_050: schema.caja_arqueos.moneda_050,
      moneda_020: schema.caja_arqueos.moneda_020,
      moneda_010: schema.caja_arqueos.moneda_010,
      created_at: schema.caja_arqueos.created_at,
    })
    .from(schema.caja_arqueos)
    .innerJoin(schema.caja_movimientos, eq(schema.caja_arqueos.caja_movimiento_id, schema.caja_movimientos.id))
    .where(eq(schema.caja_movimientos.caja_turno_id, id))
    .orderBy(desc(schema.caja_arqueos.created_at))

  const { factorPrecio } = await getFactores()
  const formateados = arqueos.map(a => ({
    ...a,
    subtotal: Number(a.subtotal || 0) / factorPrecio
  }))

  return reply.code(200).send({
    success: true,
    data: formateados
  })
})

// ═════════════════════════════════════════════════════════════════════
// 5. CIERRE DE TURNO Y CONCILIACIÓN FINAL
// ═════════════════════════════════════════════════════════════════════

// POST /api/cajas/turnos/:id/cierre - Cerrar turno, registrar pagos por método y generar resumen histórico
fastify.post('/turnos/:id/cierre', async (request, reply) => {
  const { id } = request.params
  const { totales_cierre, observacion_general, arqueo, conteos } = request.body

  const [turno] = await db
    .select()
    .from(schema.caja_turnos)
    .where(eq(schema.caja_turnos.id, id))

  if (!turno) {
    throw fastify.httpErrors.notFound('Turno de caja no encontrado')
  }

  if (turno.estado === 'CERRADA') {
    return reply.code(400).send({ success: false, message: 'El turno ya se encuentra cerrado.' })
  }

  const { factorPrecio } = await getFactores()

  // Consultar resumen actual del turno para obtener monto_apertura
  const [resumenActual] = await db
    .select({ monto_apertura: schema.caja_turnos_resumen.monto_apertura })
    .from(schema.caja_turnos_resumen)
    .where(eq(schema.caja_turnos_resumen.caja_turno_id, id))

  const montoAperturaTurno = Number(resumenActual?.monto_apertura || 0)

  // Regla de Negocio VAL-DUR-02 (Opción B acordada):
  // Se valida que el efectivo físico no sea 0 únicamente si el sistema esperaba efectivo (por apertura, ventas o ingresos netos)
  if (Array.isArray(totales_cierre)) {
    const efectivoItem = totales_cierre.find(tc => String(tc.metodo_pago_id) === '1' || String(tc.metodo_pago_id) === '01')
    const declaradoEfectivo = Number(efectivoItem?.monto_declarado || 0)

    // Verificamos si en caja había efectivo esperado
    if (declaradoEfectivo <= 0 && montoAperturaTurno > 0) {
      return reply.code(400).send({
        success: false,
        message: 'El monto físico no puede ser cero, por favor ingresar la cantidad solicitada'
      })
    }
  }

  // 1. Consultar todas las ventas del turno
  const ventasTurno = await db
    .select({
      id: schema.ventas.id,
      tipo_comprobante_id: schema.ventas.tipo_comprobante_id,
      tipo_pago_id: schema.ventas.tipo_pago_id,
      total_venta: schema.ventas.total_venta,
      gravadas: schema.ventas.gravadas,
      exoneradas: schema.ventas.exoneradas,
      inafectas: schema.ventas.inafectas,
      igv: schema.ventas.igv,
      descuento: schema.ventas.descuento,
      estado: schema.ventas.estado,
      estado_pago: schema.ventas.estado_pago,
      facturado: schema.ventas.facturado,
      xml_url: schema.ventas.xml_url,
      cdr_url: schema.ventas.cdr_url,
      observacion_sunat: schema.ventas.observacion_sunat
    })
    .from(schema.ventas)
    .where(eq(schema.ventas.caja_turno_id, id))

  // 2. Consultar pagos agrupados por método de pago desde ventas_pagos reales
  const ventasPagosDelTurno = await db
    .select({
      metodo_pago_id: schema.ventas_pagos.metodo_pago_id,
      metodo_nombre: schema.tipo_metodo_pago.nombre,
      total: sql`COALESCE(SUM(${schema.ventas_pagos.monto}), 0)`
    })
    .from(schema.ventas_pagos)
    .innerJoin(schema.ventas, eq(schema.ventas_pagos.venta_id, schema.ventas.id))
    .leftJoin(schema.tipo_metodo_pago, eq(schema.ventas_pagos.metodo_pago_id, schema.tipo_metodo_pago.id))
    .where(
      and(
        eq(schema.ventas.caja_turno_id, id),
        eq(schema.ventas_pagos.estado, 'PAGADO'),
        or(eq(schema.ventas.estado, 'EMITIDO'), sql`${schema.ventas.estado} IS NULL`)
      )
    )
    .groupBy(schema.ventas_pagos.metodo_pago_id, schema.tipo_metodo_pago.nombre)

  const mapaVentas = {}
  ventasPagosDelTurno.forEach(v => {
    mapaVentas[String(v.metodo_pago_id)] = Number(v.total || 0)
  })

  // 3. Consultar movimientos manuales (INGRESOS y EGRESOS)
  const movimientos = await db
    .select({
      tipo: schema.caja_movimientos.tipo_movimiento,
      total: sql`COALESCE(SUM(${schema.caja_movimientos.monto_total}), 0)`
    })
    .from(schema.caja_movimientos)
    .where(eq(schema.caja_movimientos.caja_turno_id, id))
    .groupBy(schema.caja_movimientos.tipo_movimiento)

  let totalIngresos = 0
  let totalEgresos = 0
  movimientos.forEach(m => {
    if (m.tipo === 'INGRESO') totalIngresos += Number(m.total || 0)
    if (m.tipo === 'EGRESO') totalEgresos += Number(m.total || 0)
  })
  const netMovimientosEfectivo = totalIngresos - totalEgresos

  // 4. Calcular métricas agregadas de ventas para caja_turnos_resumen
  let totalVentasBrutas = 0
  let totalVentasNetas = 0
  let totalVentasCredito = 0
  let totalVentasContado = 0

  let totalFacturas = 0
  let cantFacturas = 0
  let totalBoletas = 0
  let cantBoletas = 0
  let totalVales = 0
  let cantVales = 0
  let totalNC = 0
  let totalND = 0

  let totalAceptados = 0
  let totalObservados = 0
  let totalRechazados = 0
  let totalPendientesEnvio = 0
  let cantPendientesEnvio = 0

  let totalAnulaciones = 0
  let cantAnulaciones = 0

  let totalDescuentos = 0
  let cantDescuentos = 0
  let totalImpuestos = 0
  let totalGravado = 0
  let totalExonerado = 0
  let totalInafecto = 0

  const anulacionesList = []

  ventasTurno.forEach(v => {
    const totalDoc = Number(v.total_venta || 0)
    const estadoVenta = String(v.estado || '').toUpperCase()

    if (estadoVenta === 'ANULADO') {
      totalAnulaciones += totalDoc
      cantAnulaciones += 1
      anulacionesList.push({
        id: v.id,
        tipo_comprobante_id: v.tipo_comprobante_id,
        total: totalDoc
      })
      return
    }

    // Ventas activas / emitidas
    totalVentasBrutas += totalDoc
    totalVentasNetas += (totalDoc - Number(v.descuento || 0))

    if (v.tipo_pago_id === '2' || String(v.tipo_pago_id).toUpperCase() === 'CREDITO') {
      totalVentasCredito += totalDoc
    } else {
      totalVentasContado += totalDoc
    }

    // Por tipo de comprobante
    const tipoComp = String(v.tipo_comprobante_id || '')
    if (tipoComp === '01') {
      totalFacturas += totalDoc
      cantFacturas += 1
    } else if (tipoComp === '03') {
      totalBoletas += totalDoc
      cantBoletas += 1
    } else if (tipoComp === 'VL' || tipoComp === '00' || tipoComp === '99') {
      totalVales += totalDoc
      cantVales += 1
    } else if (tipoComp === '07') {
      totalNC += totalDoc
    } else if (tipoComp === '08') {
      totalND += totalDoc
    }

    // Por estado SUNAT
    if (v.cdr_url) {
      totalAceptados += totalDoc
    } else if (v.observacion_sunat && v.observacion_sunat.toLowerCase().includes('rechazad')) {
      totalRechazados += totalDoc
    } else if (v.observacion_sunat && v.observacion_sunat.toLowerCase().includes('observad')) {
      totalObservados += totalDoc
    } else {
      totalPendientesEnvio += totalDoc
      cantPendientesEnvio += 1
    }

    // Descuentos e impuestos
    const descVal = Number(v.descuento || 0)
    if (descVal > 0) {
      totalDescuentos += descVal
      cantDescuentos += 1
    }
    totalImpuestos += Number(v.igv || 0)
    totalGravado += Number(v.gravadas || 0)
    totalExonerado += Number(v.exoneradas || 0)
    totalInafecto += Number(v.inafectas || 0)
  })

  // Transacción atómica de cierre
  const result = await db.transaction(async (tx) => {
    // 1. Actualizar estado del turno a CERRADA
    const [turnoActualizado] = await tx
      .update(schema.caja_turnos)
      .set({
        estado: 'CERRADA',
        fecha_cierre_f: sql`NOW()`,
        updated_at: sql`NOW()`
      })
      .where(eq(schema.caja_turnos.id, id))
      .returning()

    // 2. Procesar caja_turno_pagos
    let sumaTotalSistema = 0
    let sumaTotalDeclarado = 0
    const desgloseMetodos = []

    if (Array.isArray(totales_cierre) && totales_cierre.length > 0) {
      for (const tc of totales_cierre) {
        const metodoId = String(tc.metodo_pago_id || '1')
        const declaradoCentimos = Math.round(Number(tc.monto_declarado || 0) * factorPrecio)
        const ventaSistemaCentimos = mapaVentas[metodoId] || 0

        // Buscar registro existente en caja_turno_pagos para este turno y método
        const [pagExistente] = await tx
          .select()
          .from(schema.caja_turno_pagos)
          .where(
            and(
              eq(schema.caja_turno_pagos.caja_turno_id, id),
              eq(schema.caja_turno_pagos.metodo_pago_id, metodoId)
            )
          )

        // El total sistema para efectivo en gaveta al cierre = apertura + ventas_efectivo + movimientos
        const esEfectivo = metodoId === '1' || metodoId === '01'
        const aperturaEfectivo = Number(turno.monto_apertura || 0)
        const totalSistemaCalculado = esEfectivo
          ? (aperturaEfectivo + ventaSistemaCentimos + netMovimientosEfectivo)
          : ventaSistemaCentimos

        const diferenciaCentimos = declaradoCentimos - totalSistemaCalculado
        sumaTotalSistema += totalSistemaCalculado
        sumaTotalDeclarado += declaradoCentimos

        desgloseMetodos.push({
          metodo_pago_id: metodoId,
          monto_sistema: totalSistemaCalculado,
          monto_declarado: declaradoCentimos,
          diferencia: diferenciaCentimos
        })

        if (pagExistente) {
          await tx
            .update(schema.caja_turno_pagos)
            .set({
              monto_sistema: totalSistemaCalculado,
              monto_declarado: declaradoCentimos,
              diferencia: diferenciaCentimos,
              observacion: tc.observacion || observacion_general || pagExistente.observacion,
              updated_at: sql`NOW()`
            })
            .where(eq(schema.caja_turno_pagos.id, pagExistente.id))
        } else {
          await tx
            .insert(schema.caja_turno_pagos)
            .values({
              caja_turno_id: id,
              metodo_pago_id: metodoId,
              monto_sistema: totalSistemaCalculado,
              monto_declarado: declaradoCentimos,
              diferencia: diferenciaCentimos,
              observacion: tc.observacion || observacion_general || 'Cierre de turno',
              sincronizado: false,
              created_at: sql`NOW()`,
              updated_at: sql`NOW()`
            })
        }
      }
    }

    // 3. Insertar o actualizar la foto inmutable en caja_turnos_resumen
    const diferenciaTotal = sumaTotalDeclarado - sumaTotalSistema

    const desgloseTiposPago = [
      { tipo: 'CONTADO', total: totalVentasContado },
      { tipo: 'CREDITO', total: totalVentasCredito }
    ]

    const resumenData = {
      caja_turno_id: id,
      total_ventas_brutas: totalVentasBrutas,
      total_ventas_netas: totalVentasNetas,
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      total_ventas_credito: totalVentasCredito,
      total_ventas_contado: totalVentasContado,

      total_facturas: totalFacturas,
      cantidad_facturas: cantFacturas,
      total_boletas: totalBoletas,
      cantidad_boletas: cantBoletas,
      total_vales: totalVales,
      cantidad_vales: cantVales,
      total_notas_credito: totalNC,
      total_notas_debito: totalND,

      total_aceptados: totalAceptados,
      total_observados: totalObservados,
      total_rechazados: totalRechazados,
      total_pendientes_envio: totalPendientesEnvio,
      cantidad_pendientes_envio: cantPendientesEnvio,

      total_anulaciones: totalAnulaciones,
      cantidad_anulaciones: cantAnulaciones,

      total_descuentos: totalDescuentos,
      cantidad_descuentos: cantDescuentos,
      total_impuestos: totalImpuestos,
      total_gravado: totalGravado,
      total_exonerado: totalExonerado,
      total_inafecto: totalInafecto,

      monto_apertura: montoAperturaTurno,
      monto_sistema: sumaTotalSistema,
      monto_declarado: sumaTotalDeclarado,
      diferencia: diferenciaTotal,

      cantidad_transacciones: ventasTurno.length,
      cantidad_documentos_emitidos: (cantFacturas + cantBoletas + cantVales),

      desglose_metodos_pago_jsonb: desgloseMetodos,
      desglose_tipos_pago_jsonb: desgloseTiposPago,
      desglose_anulaciones_jsonb: anulacionesList,

      observacion: observacion_general || null,
      sincronizado: false,
      created_at: sql`NOW()`,
      updated_at: sql`NOW()`
    }

    const [resumenCreado] = await tx
      .insert(schema.caja_turnos_resumen)
      .values(resumenData)
      .onConflictDoUpdate({
        target: schema.caja_turnos_resumen.caja_turno_id,
        set: {
          ...resumenData,
          updated_at: sql`NOW()`
        }
      })
      .returning()

    // 4. Si se proporcionó desglose de arqueo de denominaciones físicas, persistir en caja_arqueos
    let billete_200 = 0
    let billete_100 = 0
    let billete_50 = 0
    let billete_20 = 0
    let billete_10 = 0
    let moneda_5 = 0
    let moneda_2 = 0
    let moneda_1 = 0
    let moneda_050 = 0
    let moneda_020 = 0
    let moneda_010 = 0

    if (arqueo && typeof arqueo === 'object') {
      billete_200 = parseInt(arqueo.billete_200 || 0, 10) || 0
      billete_100 = parseInt(arqueo.billete_100 || 0, 10) || 0
      billete_50 = parseInt(arqueo.billete_50 || 0, 10) || 0
      billete_20 = parseInt(arqueo.billete_20 || 0, 10) || 0
      billete_10 = parseInt(arqueo.billete_10 || 0, 10) || 0
      moneda_5 = parseInt(arqueo.moneda_5 || 0, 10) || 0
      moneda_2 = parseInt(arqueo.moneda_2 || 0, 10) || 0
      moneda_1 = parseInt(arqueo.moneda_1 || 0, 10) || 0
      moneda_050 = parseInt(arqueo.moneda_050 || 0, 10) || 0
      moneda_020 = parseInt(arqueo.moneda_020 || 0, 10) || 0
      moneda_010 = parseInt(arqueo.moneda_010 || 0, 10) || 0
    } else if (Array.isArray(conteos)) {
      conteos.forEach(c => {
        const val = Number(c.denominacion || c.valor || 0)
        const cant = parseInt(c.cantidad || 0, 10) || 0
        if (val === 200) billete_200 = cant
        else if (val === 100) billete_100 = cant
        else if (val === 50) billete_50 = cant
        else if (val === 20) billete_20 = cant
        else if (val === 10) billete_10 = cant
        else if (val === 5) moneda_5 = cant
        else if (val === 2) moneda_2 = cant
        else if (val === 1) moneda_1 = cant
        else if (Math.abs(val - 0.5) < 0.001) moneda_050 = cant
        else if (Math.abs(val - 0.2) < 0.001) moneda_020 = cant
        else if (Math.abs(val - 0.1) < 0.001) moneda_010 = cant
      })
    }

    const totalArqueoCentimos = (
      billete_200 * 200 + billete_100 * 100 + billete_50 * 50 + billete_20 * 20 + billete_10 * 10 +
      moneda_5 * 5 + moneda_2 * 2 + moneda_1 * 1 + moneda_050 * 0.5 + moneda_020 * 0.2 + moneda_010 * 0.1
    ) * factorPrecio

    if (totalArqueoCentimos > 0 || arqueo || conteos) {
      await tx.insert(schema.caja_arqueos).values({
        caja_turno_id: id,
        subtotal: Math.round(totalArqueoCentimos),
        billete_200,
        billete_100,
        billete_50,
        billete_20,
        billete_10,
        moneda_5,
        moneda_2,
        moneda_1,
        moneda_050,
        moneda_020,
        moneda_010,
        sincronizado: false,
        created_at: sql`NOW()`,
        updated_at: sql`NOW()`
      })
    }

    return {
      turno: turnoActualizado,
      resumen: resumenCreado
    }
  })

  return reply.code(200).send({
    success: true,
    message: 'Turno de caja cerrado exitosamente y resumen analítico generado',
    data: result.turno,
    resumen: result.resumen
  })
})
}

module.exports = cajasRoutes
