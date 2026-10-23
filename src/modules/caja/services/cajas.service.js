'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, sql } = require('drizzle-orm')
const cajasRepository = require('../repositories/cajas.repository')
const aperturaTurnoService = require('./aperturaTurno.service')
const cierreTurnoService = require('./cierreTurno.service')
const { getFactores } = require('../../../utils/factores')

/**
 * Servicio de Dominio para Gestión de Cajas, Turnos, Arqueos y Conciliación
 */
const cajasService = {
  // ── SERIES Y CAJAS CONFIGURADAS ──────────────────────────────────────────
  async listarSeriesCaja({ branchId, esSuperAdmin }) {
    return cajasRepository.getSeriesCaja({ branchId, esSuperAdmin })
  },

  async listarCajasConfiguradas({ branchId, userId, esSuperAdmin }) {
    const series = await cajasRepository.getCajasConfiguradas({ branchId, userId, esSuperAdmin })

    const cajasMap = {}
    series.forEach((s) => {
      const iden = s.identificador_caja || s.nombre || 'CAJA-01'
      if (!cajasMap[iden]) {
        cajasMap[iden] = {
          identificador_caja: iden,
          nombre: s.nombre || iden,
          branch_id: s.branch_id,
          tipo_caja: s.tipo_caja,
          usuario_id: s.usuario_id,
          activo: s.activo,
          series: []
        }
      }
      cajasMap[iden].series.push({
        id: s.id,
        serie: s.serie,
        correlativo: s.correlativo,
        tipo_comprobante_id: s.tipo_comprobante_id,
        tipo_comprobante_descripcion: s.tipo_comprobante_descripcion
      })
    })

    return Object.values(cajasMap)
  },

  async crearSerieCaja(payload, { branchId, esSuperAdmin }) {
    const targetBranchId = !esSuperAdmin && branchId ? branchId : payload.branch_id
    return cajasRepository.createSerieCaja({
      ...payload,
      branch_id: targetBranchId,
      activo: payload.activo !== undefined ? payload.activo : true
    })
  },

  async actualizarSerieCaja(id, payload) {
    const updated = await cajasRepository.updateSerieCaja(id, payload)
    if (!updated) {
      const error = new Error('Serie de caja no encontrada')
      error.statusCode = 404
      throw error
    }
    return updated
  },

  async eliminarSerieCaja(id) {
    const deleted = await cajasRepository.deleteSerieCaja(id)
    if (!deleted) {
      const error = new Error('Serie de caja no encontrada')
      error.statusCode = 404
      throw error
    }
    return deleted
  },

  // ── TURNOS DE CAJA ───────────────────────────────────────────────────────
  async listarTurnos({ estado, fecha, usuarioId, identificadorCaja, branchId, esSuperAdmin, limit, offset }) {
    const { factorPrecio } = await getFactores()
    const turnos = await cajasRepository.getTurnos({
      estado,
      fecha,
      usuarioId,
      identificadorCaja,
      branchId,
      esSuperAdmin,
      limit,
      offset
    })

    return turnos.map((t) => ({
      ...t,
      monto_apertura: Number(t.monto_apertura || 0) / factorPrecio
    }))
  },

  async obtenerTurnoActivo({ branchId, userId, esSuperAdmin }) {
    const turno = await cajasRepository.getTurnoActivo({ branchId, userId, esSuperAdmin })
    if (!turno) return null

    const pagosMetodos = await cajasRepository.getPagosMetodosTurno(turno.id)
    const pagosVentas = await cajasRepository.getTotalesPagosVentasTurno(turno.id)

    const mapaPagos = {}
    pagosVentas.forEach((p) => {
      mapaPagos[String(p.metodo_pago_id)] = Number(p.total || 0)
    })

    const movsTurno = await cajasRepository.getTotalesMovimientosCaja(turno.id)
    let netMovsEfectivo = 0
    movsTurno.forEach((m) => {
      if (m.tipo === 'INGRESO') netMovsEfectivo += Number(m.total || 0)
      if (m.tipo === 'EGRESO') netMovsEfectivo -= Number(m.total || 0)
    })

    const { factorPrecio } = await getFactores()

    const totalesFormateados = pagosMetodos.map((t) => {
      const metodoId = String(t.metodo_pago_id)
      const montoVentasPagos = mapaPagos[metodoId] || 0
      return {
        ...t,
        monto_sistema: montoVentasPagos / factorPrecio,
        monto_declarado: Number(t.monto_declarado || 0) / factorPrecio,
        diferencia: Number(t.diferencia || 0) / factorPrecio
      }
    })

    const totalEfectivoVentasPagos = (mapaPagos['1'] || mapaPagos['01'] || 0) / factorPrecio
    const montoAperturaNum = Number(turno.monto_apertura || 0)
    const totalEfectivoNeto =
      (montoAperturaNum + (mapaPagos['1'] || mapaPagos['01'] || 0) + netMovsEfectivo) / factorPrecio

    return {
      ...turno,
      monto_apertura: montoAperturaNum / factorPrecio,
      totales: totalesFormateados,
      efectivo_ventas_pagos: totalEfectivoVentasPagos,
      efectivo_total_en_caja: totalEfectivoNeto
    }
  },

  async obtenerTurnoDetalle(id) {
    const turno = await cajasRepository.getTurnoById(id)
    if (!turno) {
      const error = new Error('Turno de caja no encontrado')
      error.statusCode = 404
      throw error
    }

    const pagosMetodos = await cajasRepository.getPagosMetodosTurno(id)
    const resumenCierre = await cajasRepository.getResumenTurno(id)
    const ventasTurno = await cajasRepository.getVentasTurno(id)
    const pagosVentas = await cajasRepository.getTotalesPagosVentasTurno(id)

    const mapaPagos = {}
    pagosVentas.forEach((p) => {
      mapaPagos[String(p.metodo_pago_id)] = Number(p.total || 0)
    })

    const movsTurno = await cajasRepository.getTotalesMovimientosCaja(id)
    let netMovsEfectivo = 0
    movsTurno.forEach((m) => {
      if (m.tipo === 'INGRESO') netMovsEfectivo += Number(m.total || 0)
      if (m.tipo === 'EGRESO') netMovsEfectivo -= Number(m.total || 0)
    })

    const { factorPrecio } = await getFactores()

    const totalesFormateados = pagosMetodos.map((t) => {
      const metodoId = String(t.metodo_pago_id)
      const montoVentasPagos = mapaPagos[metodoId] || 0
      return {
        ...t,
        monto_sistema: montoVentasPagos / factorPrecio,
        monto_declarado: Number(t.monto_declarado || 0) / factorPrecio,
        diferencia: Number(t.diferencia || 0) / factorPrecio
      }
    })

    const montoAperturaNum = Number(resumenCierre?.monto_apertura || 0)
    const totalEfectivoVentasPagos = (mapaPagos['1'] || mapaPagos['01'] || 0) / factorPrecio
    const totalEfectivoNeto =
      (montoAperturaNum + (mapaPagos['1'] || mapaPagos['01'] || 0) + netMovsEfectivo) / factorPrecio

    const ventasFormateadas = ventasTurno.map((v) => ({
      ...v,
      total_venta: Number(v.total_venta || 0) / factorPrecio
    }))

    return {
      ...turno,
      monto_apertura: montoAperturaNum / factorPrecio,
      totales: totalesFormateados,
      resumen: resumenCierre,
      ventas: ventasFormateadas,
      total_ventas_registradas: ventasTurno.length,
      efectivo_ventas_pagos: totalEfectivoVentasPagos,
      efectivo_total_en_caja: totalEfectivoNeto
    }
  },

  // ── APERTURA DE TURNO (Delegado a Caso de Uso Especializado) ─────────────
  async aperturarTurno(params) {
    return aperturaTurnoService.aperturarTurno(params)
  },

  // ── MOVIMIENTOS MANUALES Y ARQUEOS ───────────────────────────────────────
  async listarMovimientos(cajaTurnoId) {
    const { factorPrecio } = await getFactores()
    const movs = await cajasRepository.getMovimientosTurno(cajaTurnoId)

    return movs.map((m) => ({
      ...m,
      monto_total: Number(m.monto_total || 0) / factorPrecio
    }))
  },

  async registrarMovimiento(cajaTurnoId, body, { userId, branchId }) {
    const { tipo_movimiento, concepto, monto, observacion, conteos, arqueo } = body

    if (!tipo_movimiento || !['INGRESO', 'EGRESO'].includes(tipo_movimiento.toUpperCase())) {
      const error = new Error('El tipo_movimiento debe ser INGRESO o EGRESO.')
      error.statusCode = 400
      throw error
    }

    if (!concepto || concepto.trim() === '') {
      const error = new Error('El concepto del movimiento es requerido.')
      error.statusCode = 400
      throw error
    }

    const montoNum = Number(monto || 0)
    if (montoNum <= 0) {
      const error = new Error('El monto debe ser mayor a cero.')
      error.statusCode = 400
      throw error
    }

    const turno = await cajasRepository.getTurnoById(cajaTurnoId)
    if (!turno) {
      const error = new Error('Turno de caja no encontrado')
      error.statusCode = 404
      throw error
    }

    if (turno.estado !== 'ABIERTA') {
      const error = new Error('No se pueden registrar movimientos en un turno cerrado.')
      error.statusCode = 400
      throw error
    }

    const { factorPrecio } = await getFactores()
    const montoCentimos = Math.round(montoNum * factorPrecio)

    // Validar saldo suficiente en caso de EGRESO
    if (tipo_movimiento.toUpperCase() === 'EGRESO') {
      const resumenTurno = await cajasRepository.getResumenTurno(cajaTurnoId)
      const aperturaEfectivo = Number(resumenTurno?.monto_apertura || 0)

      const [ventasEfectivo] = await db
        .select({
          total: sql`COALESCE(SUM(${schema.ventas_pagos.monto}), 0)`
        })
        .from(schema.ventas_pagos)
        .innerJoin(schema.ventas, eq(schema.ventas_pagos.venta_id, schema.ventas.id))
        .where(
          and(
            eq(schema.ventas.caja_turno_id, cajaTurnoId),
            eq(schema.ventas_pagos.estado, 'PAGADO'),
            or(eq(schema.ventas_pagos.metodo_pago_id, '1'), eq(schema.ventas_pagos.metodo_pago_id, '01')),
            or(eq(schema.ventas.estado, 'EMITIDO'), sql`${schema.ventas.estado} IS NULL`)
          )
        )
      const ventasEfectivoTotal = Number(ventasEfectivo?.total || 0)

      const movsPrevios = await cajasRepository.getTotalesMovimientosCaja(cajaTurnoId)
      let netMovsPrevios = 0
      movsPrevios.forEach((m) => {
        if (m.tipo === 'INGRESO') netMovsPrevios += Number(m.total || 0)
        if (m.tipo === 'EGRESO') netMovsPrevios -= Number(m.total || 0)
      })

      const saldoDisponibleCentimos = aperturaEfectivo + ventasEfectivoTotal + netMovsPrevios
      if (montoCentimos > saldoDisponibleCentimos) {
        const saldoDisponibleVisual = (saldoDisponibleCentimos / factorPrecio).toFixed(2)
        const error = new Error(
          `Saldo insuficiente en caja. El saldo disponible en efectivo es de S/ ${saldoDisponibleVisual}, no es posible retirar S/ ${montoNum.toFixed(2)}.`
        )
        error.statusCode = 400
        throw error
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
      conteos.forEach((c) => {
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

    return db.transaction(async (tx) => {
      const [mov] = await tx
        .insert(schema.caja_movimientos)
        .values({
          branch_id: branchId || turno.branch_id,
          caja_turno_id: cajaTurnoId,
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

      return {
        ...mov,
        monto_total: Number(mov.monto_total || 0) / factorPrecio,
        arqueo: {
          ...arq,
          subtotal: Number(arq.subtotal || 0) / factorPrecio
        }
      }
    })
  },

  async obtenerArqueoMovimiento(movimientoId) {
    const { factorPrecio } = await getFactores()
    const arq = await cajasRepository.getArqueoByMovimientoId(movimientoId)
    if (!arq) return null
    return {
      ...arq,
      subtotal: Number(arq.subtotal || 0) / factorPrecio
    }
  },

  async listarArqueosTurno(cajaTurnoId) {
    const { factorPrecio } = await getFactores()
    const arqs = await cajasRepository.getArqueosByTurnoId(cajaTurnoId)
    return arqs.map((a) => ({
      ...a,
      subtotal: Number(a.subtotal || 0) / factorPrecio
    }))
  },

  // ── CIERRE DE TURNO Y CONCILIACIÓN FINAL (Delegado a Caso de Uso Especializado) ──
  async cerrarTurno(cajaTurnoId, body) {
    return cierreTurnoService.cerrarTurno(cajaTurnoId, body)
  }
}

module.exports = cajasService
