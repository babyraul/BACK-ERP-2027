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

    const turnos = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.caja_turnos.fecha_apertura))

    return reply.code(200).send({ success: true, data: turnos })
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
        fecha_apertura: schema.caja_turnos.fecha_apertura,
        fecha_cierre_f: schema.caja_turnos.fecha_cierre_f,
        estado: schema.caja_turnos.estado,
        created_at: schema.caja_turnos.created_at,
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .where(and(...conditions))
      .orderBy(desc(schema.caja_turnos.fecha_apertura))

    if (!turno) {
      return reply.code(200).send({ success: true, data: null, message: 'No hay turno abierto' })
    }

    // Obtener los totales asociados al turno
    const totales = await db
      .select({
        id: schema.caja_totales.id,
        caja_turno_id: schema.caja_totales.caja_turno_id,
        metodo_pago_id: schema.caja_totales.metodo_pago_id,
        metodo_pago_nombre: schema.tipo_metodo_pago.nombre,
        monto_apertura: schema.caja_totales.monto_apertura,
        monto_sistema: schema.caja_totales.monto_sistema,
        monto_declarado: schema.caja_totales.monto_declarado,
        diferencia: schema.caja_totales.diferencia,
        observacion: schema.caja_totales.observacion,
      })
      .from(schema.caja_totales)
      .leftJoin(schema.tipo_metodo_pago, eq(schema.caja_totales.metodo_pago_id, schema.tipo_metodo_pago.id))
      .where(eq(schema.caja_totales.caja_turno_id, turno.id))

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
    const totalesFormateados = totales.map(t => {
      const metodoId = String(t.metodo_pago_id)
      const montoVentasPagos = mapaPagos[metodoId] || 0
      const esEfectivo = metodoId === '1' || metodoId === '01'
      const sistemaInt = montoVentasPagos + (esEfectivo ? netMovsEfectivo : 0)

      return {
        ...t,
        monto_apertura: Number(t.monto_apertura || 0) / factorPrecio,
        monto_sistema: sistemaInt / factorPrecio,
        monto_declarado: Number(t.monto_declarado || 0) / factorPrecio,
        diferencia: Number(t.diferencia || 0) / factorPrecio,
      }
    })

    const totalEfectivoVentasPagos = (mapaPagos['1'] || mapaPagos['01'] || 0) / factorPrecio
    const totalEfectivoNeto = ((totales.find(t => String(t.metodo_pago_id) === '1' || String(t.metodo_pago_id) === '01')?.monto_apertura || 0) + (mapaPagos['1'] || mapaPagos['01'] || 0) + netMovsEfectivo) / factorPrecio

    return reply.code(200).send({
      success: true,
      data: {
        ...turno,
        totales: totalesFormateados,
        efectivo_ventas_pagos: totalEfectivoVentasPagos,
        efectivo_total_en_caja: totalEfectivoNeto
      }
    })
  })

  // GET /api/cajas/turnos/:id - Detalle completo de un turno (con arqueo y balance de ventas/compras)
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

    // Consultar caja_totales
    const totales = await db
      .select({
        id: schema.caja_totales.id,
        caja_turno_id: schema.caja_totales.caja_turno_id,
        metodo_pago_id: schema.caja_totales.metodo_pago_id,
        metodo_pago_nombre: schema.tipo_metodo_pago.nombre,
        monto_apertura: schema.caja_totales.monto_apertura,
        monto_sistema: schema.caja_totales.monto_sistema,
        monto_declarado: schema.caja_totales.monto_declarado,
        diferencia: schema.caja_totales.diferencia,
        observacion: schema.caja_totales.observacion,
      })
      .from(schema.caja_totales)
      .leftJoin(schema.tipo_metodo_pago, eq(schema.caja_totales.metodo_pago_id, schema.tipo_metodo_pago.id))
      .where(eq(schema.caja_totales.caja_turno_id, id))

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
    const totalesFormateados = totales.map(t => {
      const metodoId = String(t.metodo_pago_id)
      const montoVentasPagos = mapaPagos[metodoId] || 0
      const esEfectivo = metodoId === '1' || metodoId === '01'
      const sistemaInt = montoVentasPagos + (esEfectivo ? netMovsEfectivo : 0)

      return {
        ...t,
        monto_apertura: Number(t.monto_apertura || 0) / factorPrecio,
        monto_sistema: sistemaInt / factorPrecio,
        monto_declarado: Number(t.monto_declarado || 0) / factorPrecio,
        diferencia: Number(t.diferencia || 0) / factorPrecio,
      }
    })

    const ventasFormateadas = ventasTurno.map(v => ({
      ...v,
      total_venta: Number(v.total_venta || 0) / factorPrecio
    }))

    const totalEfectivoVentasPagos = (mapaPagos['1'] || mapaPagos['01'] || 0) / factorPrecio
    const totalEfectivoNeto = ((totales.find(t => String(t.metodo_pago_id) === '1' || String(t.metodo_pago_id) === '01')?.monto_apertura || 0) + (mapaPagos['1'] || mapaPagos['01'] || 0) + netMovsEfectivo) / factorPrecio

    return reply.code(200).send({
      success: true,
      data: {
        ...turno,
        totales: totalesFormateados,
        ventas: ventasFormateadas,
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
    const { identificador_caja, monto_apertura, observacion, totales_iniciales } = request.body
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

    // 4. Obtener catálogo oficial de métodos de pago para inicializarlos en caja_totales
    const metodosExistentes = await db
      .select({ id: schema.tipo_metodo_pago.id, nombre: schema.tipo_metodo_pago.nombre })
      .from(schema.tipo_metodo_pago)

    // 5. Transacción atómica de apertura
    const result = await db.transaction(async (tx) => {
      const [nuevoTurno] = await tx
        .insert(schema.caja_turnos)
        .values({
          usuario_id: userId,
          identificador_caja: idenLimpio,
          branch_id: branchId,
          fecha_apertura: new Date().toISOString(),
          estado: 'ABIERTA',
          sincronizado: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .returning()

      const { factorPrecio } = await getFactores()
      const montoEfectivoCentimos = Math.round(Number(monto_apertura || 0) * factorPrecio)

      // Mapear importes iniciales si se proporcionaron desglosados
      const mapaIniciales = {}
      if (Array.isArray(totales_iniciales)) {
        totales_iniciales.forEach(t => {
          mapaIniciales[String(t.metodo_pago_id)] = Math.round(Number(t.monto_apertura || 0) * factorPrecio)
        })
      }

      // Preparar registros para caja_totales asegurando que existan los métodos del catálogo
      const listaMetodos = metodosExistentes.length > 0
        ? metodosExistentes
        : [{ id: '1', nombre: 'EFECTIVO' }, { id: '2', nombre: 'YAPE' }, { id: '3', nombre: 'TRANSFERENCIA' }, { id: '4', nombre: 'CREDITO' }]

      const registrosTotales = listaMetodos.map(m => {
        const esEfectivo = String(m.id) === '1' || String(m.id) === '01'
        const aperturaMetodo = mapaIniciales[String(m.id)] !== undefined 
          ? mapaIniciales[String(m.id)] 
          : (esEfectivo ? montoEfectivoCentimos : 0)

        return {
          caja_turno_id: nuevoTurno.id,
          metodo_pago_id: String(m.id),
          monto_apertura: aperturaMetodo,
          monto_sistema: 0,
          monto_declarado: 0,
          diferencia: 0,
          observacion: esEfectivo ? (observacion || 'Fondo inicial de apertura en efectivo') : `Inicialización ${m.nombre}`,
          sincronizado: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      await tx.insert(schema.caja_totales).values(registrosTotales)

      return nuevoTurno
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

  // POST /api/cajas/turnos/:id/movimientos - Registrar ingreso o egreso en el turno
  fastify.post('/turnos/:id/movimientos', async (request, reply) => {
    const { id } = request.params
    const { tipo_movimiento, concepto, monto, observacion } = request.body
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

    const [nuevoMovimiento] = await db
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning()

    return reply.code(201).send({
      success: true,
      message: `Movimiento de ${tipo_movimiento.toUpperCase()} registrado correctamente`,
      data: {
        ...nuevoMovimiento,
        monto_total: Number(nuevoMovimiento.monto_total || 0) / factorPrecio
      }
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 4. ARQUEOS DE CAJA (caja_arqueos: Conteo físico de denominaciones)
  // ═════════════════════════════════════════════════════════════════════

  // GET /api/cajas/turnos/:id/arqueos - Consultar conteo físico por denominación
  fastify.get('/turnos/:id/arqueos', async (request, reply) => {
    const { id } = request.params

    const arqueos = await db
      .select({
        id: schema.caja_arqueos.id,
        caja_turno_id: schema.caja_arqueos.caja_turno_id,
        denominacion: schema.caja_arqueos.denominacion,
        cantidad: schema.caja_arqueos.cantidad,
        subtotal: schema.caja_arqueos.subtotal,
        created_at: schema.caja_arqueos.created_at,
      })
      .from(schema.caja_arqueos)
      .where(eq(schema.caja_arqueos.caja_turno_id, id))
      .orderBy(desc(schema.caja_arqueos.denominacion))

    const { factorPrecio } = await getFactores()
    const formateados = arqueos.map(a => ({
      ...a,
      denominacion: Number(a.denominacion || 0) / factorPrecio,
      subtotal: Number(a.subtotal || 0) / factorPrecio
    }))

    const totalFisico = formateados.reduce((acc, curr) => acc + curr.subtotal, 0)

    return reply.code(200).send({
      success: true,
      data: {
        detalles: formateados,
        total_arqueo: totalFisico
      }
    })
  })

  // POST /api/cajas/turnos/:id/arqueos - Guardar conteo físico de denominaciones
  fastify.post('/turnos/:id/arqueos', async (request, reply) => {
    const { id } = request.params
    const { conteos } = request.body

    if (!Array.isArray(conteos) || conteos.length === 0) {
      return reply.code(400).send({ success: false, message: 'Se requiere una lista de conteos por denominación.' })
    }

    const [turno] = await db
      .select()
      .from(schema.caja_turnos)
      .where(eq(schema.caja_turnos.id, id))

    if (!turno) throw fastify.httpErrors.notFound('Turno de caja no encontrado')

    const { factorPrecio } = await getFactores()

    const result = await db.transaction(async (tx) => {
      // Reemplazar o registrar conteo del turno
      await tx.delete(schema.caja_arqueos).where(eq(schema.caja_arqueos.caja_turno_id, id))

      const registros = conteos.map(c => {
        const denomCent = Math.round(Number(c.denominacion || 0) * factorPrecio)
        const cant = Math.max(0, parseInt(c.cantidad || 0, 10))
        const subCent = denomCent * cant

        return {
          caja_turno_id: id,
          denominacion: denomCent,
          cantidad: cant,
          subtotal: subCent,
          sincronizado: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      const insertados = await tx.insert(schema.caja_arqueos).values(registros).returning()
      return insertados
    })

    return reply.code(201).send({
      success: true,
      message: 'Arqueo físico de denominaciones guardado correctamente',
      data: result
    })
  })

  // ═════════════════════════════════════════════════════════════════════
  // 5. CIERRE DE TURNO Y CONCILIACIÓN FINAL
  // ═════════════════════════════════════════════════════════════════════

  // POST /api/cajas/turnos/:id/cierre - Cerrar turno y calcular balance final en caja_totales
  fastify.post('/turnos/:id/cierre', async (request, reply) => {
    const { id } = request.params
    const { totales_cierre, observacion_general } = request.body

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

    // Calcular montos acumulados por ventas en este turno agrupados por método de pago desde ventas_pagos reales
    const ventasPagosDelTurno = await db
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

    const mapaVentas = {}
    ventasPagosDelTurno.forEach(v => {
      mapaVentas[String(v.metodo_pago_id)] = Number(v.total || 0)
    })

    // Sumar movimientos manuales (INGRESOS y EGRESOS en efectivo '1')
    const movimientosEfectivo = await db
      .select({
        tipo: schema.caja_movimientos.tipo_movimiento,
        total: sql`COALESCE(SUM(${schema.caja_movimientos.monto_total}), 0)`
      })
      .from(schema.caja_movimientos)
      .where(eq(schema.caja_movimientos.caja_turno_id, id))
      .groupBy(schema.caja_movimientos.tipo_movimiento)

    let netMovimientosEfectivo = 0
    movimientosEfectivo.forEach(m => {
      if (m.tipo === 'INGRESO') netMovimientosEfectivo += Number(m.total || 0)
      if (m.tipo === 'EGRESO') netMovimientosEfectivo -= Number(m.total || 0)
    })

    // Transacción atómica de cierre
    const result = await db.transaction(async (tx) => {
      // 1. Actualizar estado del turno a CERRADA
      const [turnoActualizado] = await tx
        .update(schema.caja_turnos)
        .set({
          estado: 'CERRADA',
          fecha_cierre_f: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .where(eq(schema.caja_turnos.id, id))
        .returning()

      // 2. Actualizar o insertar totales de cierre
      if (Array.isArray(totales_cierre) && totales_cierre.length > 0) {
        for (const tc of totales_cierre) {
          const metodoId = String(tc.metodo_pago_id || '1')
          const declaradoCentimos = Math.round(Number(tc.monto_declarado || 0) * factorPrecio)
          let ventaSistemaCentimos = mapaVentas[metodoId] || 0

          // Buscar registro existente en caja_totales para este turno y método
          const [totExistente] = await tx
            .select()
            .from(schema.caja_totales)
            .where(
              and(
                eq(schema.caja_totales.caja_turno_id, id),
                eq(schema.caja_totales.metodo_pago_id, metodoId)
              )
            )

          const aperturaCentimos = totExistente ? Number(totExistente.monto_apertura || 0) : 0
          
          // Si es efectivo ('1'), sumar apertura + ventas + movimientos manuales (ingresos - egresos)
          const esEfectivo = metodoId === '1' || metodoId === '01'
          const totalSistemaCalculado = aperturaCentimos + ventaSistemaCentimos + (esEfectivo ? netMovimientosEfectivo : 0)
          
          // Regla del PDF de arquitectura: diferencia = monto_declarado - monto_sistema
          const diferenciaCentimos = declaradoCentimos - totalSistemaCalculado

          if (totExistente) {
            await tx
              .update(schema.caja_totales)
              .set({
                monto_sistema: totalSistemaCalculado,
                monto_declarado: declaradoCentimos,
                diferencia: diferenciaCentimos,
                observacion: tc.observacion || observacion_general || totExistente.observacion,
                updated_at: new Date().toISOString()
              })
              .where(eq(schema.caja_totales.id, totExistente.id))
          } else {
            await tx
              .insert(schema.caja_totales)
              .values({
                caja_turno_id: id,
                metodo_pago_id: metodoId,
                monto_apertura: 0,
                monto_sistema: totalSistemaCalculado,
                monto_declarado: declaradoCentimos,
                diferencia: diferenciaCentimos,
                observacion: tc.observacion || observacion_general || 'Cierre de turno',
                sincronizado: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
          }
        }
      }

      return turnoActualizado
    })

    return reply.code(200).send({
      success: true,
      message: 'Turno de caja cerrado exitosamente',
      data: result
    })
  })
}

module.exports = cajasRoutes
