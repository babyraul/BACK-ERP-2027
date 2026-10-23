'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, desc, sql, inArray } = require('drizzle-orm')

/**
 * Repositorio de Cajas, Turnos, Movimientos y Arqueos (Persistencia Drizzle ORM)
 */
const cajasRepository = {
  // ── 1. SERIES Y CORRELATIVOS DE CAJA ──────────────────────────────────
  async getSeriesCaja({ branchId, esSuperAdmin = false }) {
    const conditions = []
    if (!esSuperAdmin && branchId) {
      conditions.push(or(eq(schema.caja_serie_correlativo.branch_id, branchId), sql`${schema.caja_serie_correlativo.branch_id} IS NULL`))
    }

    return db
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
        updated_at: schema.caja_serie_correlativo.updated_at
      })
      .from(schema.caja_serie_correlativo)
      .leftJoin(schema.tipo_comprobante, eq(schema.caja_serie_correlativo.tipo_comprobante_id, schema.tipo_comprobante.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.caja_serie_correlativo.created_at))
  },

  async getCajasConfiguradas({ branchId, userId, esSuperAdmin = false }) {
    const conditions = [eq(schema.caja_serie_correlativo.activo, true)]

    if (!esSuperAdmin && branchId) {
      conditions.push(or(eq(schema.caja_serie_correlativo.branch_id, branchId), sql`${schema.caja_serie_correlativo.branch_id} IS NULL`))
    }

    if (!esSuperAdmin && userId) {
      conditions.push(or(eq(schema.caja_serie_correlativo.usuario_id, userId), sql`${schema.caja_serie_correlativo.usuario_id} IS NULL`))
    }

    return db
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
        activo: schema.caja_serie_correlativo.activo
      })
      .from(schema.caja_serie_correlativo)
      .leftJoin(schema.tipo_comprobante, eq(schema.caja_serie_correlativo.tipo_comprobante_id, schema.tipo_comprobante.id))
      .where(and(...conditions))
      .orderBy(schema.caja_serie_correlativo.identificador_caja)
  },

  async createSerieCaja(payload) {
    const [nueva] = await db.insert(schema.caja_serie_correlativo).values(payload).returning()
    return nueva
  },

  async updateSerieCaja(id, payload) {
    const [updated] = await db
      .update(schema.caja_serie_correlativo)
      .set({ ...payload, updated_at: new Date().toISOString() })
      .where(eq(schema.caja_serie_correlativo.id, id))
      .returning()
    return updated || null
  },

  async deleteSerieCaja(id) {
    const [inactivado] = await db
      .update(schema.caja_serie_correlativo)
      .set({ activo: false, updated_at: new Date().toISOString() })
      .where(eq(schema.caja_serie_correlativo.id, id))
      .returning()
    return inactivado || null
  },

  // ── 2. GESTIÓN DE TURNOS ──────────────────────────────────────────────
  async getTurnos({ estado, fecha, usuarioId, identificadorCaja, branchId, esSuperAdmin = false }) {
    const conditions = []
    if (!esSuperAdmin && branchId) {
      conditions.push(eq(schema.caja_turnos.branch_id, branchId))
    }
    if (estado) conditions.push(eq(schema.caja_turnos.estado, estado))
    if (usuarioId) conditions.push(eq(schema.caja_turnos.usuario_id, usuarioId))
    if (identificadorCaja) conditions.push(eq(schema.caja_turnos.identificador_caja, identificadorCaja))
    if (fecha) conditions.push(sql`DATE(${schema.caja_turnos.fecha_apertura}) = ${fecha}`)

    return db
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
        updated_at: schema.caja_turnos.updated_at
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .leftJoin(schema.caja_turnos_resumen, eq(schema.caja_turnos.id, schema.caja_turnos_resumen.caja_turno_id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.caja_turnos.fecha_apertura))
  },

  async getTurnoActivo({ branchId, userId, esSuperAdmin = false }) {
    const conditions = [eq(schema.caja_turnos.estado, 'ABIERTA')]
    if (!esSuperAdmin) {
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
        created_at: schema.caja_turnos.created_at
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .leftJoin(schema.caja_turnos_resumen, eq(schema.caja_turnos.id, schema.caja_turnos_resumen.caja_turno_id))
      .where(and(...conditions))
      .orderBy(desc(schema.caja_turnos.fecha_apertura))

    return turno || null
  },

  async getTurnoById(id) {
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
        updated_at: schema.caja_turnos.updated_at
      })
      .from(schema.caja_turnos)
      .leftJoin(schema.usuarios, eq(schema.caja_turnos.usuario_id, schema.usuarios.id))
      .where(eq(schema.caja_turnos.id, id))

    return turno || null
  },

  async getPagosMetodosTurno(cajaTurnoId) {
    return db
      .select({
        id: schema.caja_turno_pagos.id,
        caja_turno_id: schema.caja_turno_pagos.caja_turno_id,
        metodo_pago_id: schema.caja_turno_pagos.metodo_pago_id,
        metodo_pago_nombre: schema.tipo_metodo_pago.nombre,
        monto_sistema: schema.caja_turno_pagos.monto_sistema,
        monto_declarado: schema.caja_turno_pagos.monto_declarado,
        diferencia: schema.caja_turno_pagos.diferencia,
        observacion: schema.caja_turno_pagos.observacion
      })
      .from(schema.caja_turno_pagos)
      .leftJoin(schema.tipo_metodo_pago, eq(schema.caja_turno_pagos.metodo_pago_id, schema.tipo_metodo_pago.id))
      .where(eq(schema.caja_turno_pagos.caja_turno_id, cajaTurnoId))
  },

  async getResumenTurno(cajaTurnoId) {
    const [resumen] = await db
      .select()
      .from(schema.caja_turnos_resumen)
      .where(eq(schema.caja_turnos_resumen.caja_turno_id, cajaTurnoId))
    return resumen || null
  },

  async getVentasTurno(cajaTurnoId) {
    return db
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
      .where(eq(schema.ventas.caja_turno_id, cajaTurnoId))
  },

  async getTotalesPagosVentasTurno(cajaTurnoId) {
    return db
      .select({
        metodo_pago_id: schema.ventas_pagos.metodo_pago_id,
        total: sql`COALESCE(SUM(${schema.ventas_pagos.monto}), 0)`
      })
      .from(schema.ventas_pagos)
      .innerJoin(schema.ventas, eq(schema.ventas_pagos.venta_id, schema.ventas.id))
      .where(
        and(
          eq(schema.ventas.caja_turno_id, cajaTurnoId),
          eq(schema.ventas_pagos.estado, 'PAGADO'),
          or(eq(schema.ventas.estado, 'EMITIDO'), sql`${schema.ventas.estado} IS NULL`)
        )
      )
      .groupBy(schema.ventas_pagos.metodo_pago_id)
  },

  async getTotalesMovimientosCaja(cajaTurnoId) {
    return db
      .select({
        tipo: schema.caja_movimientos.tipo_movimiento,
        total: sql`COALESCE(SUM(${schema.caja_movimientos.monto_total}), 0)`
      })
      .from(schema.caja_movimientos)
      .where(eq(schema.caja_movimientos.caja_turno_id, cajaTurnoId))
      .groupBy(schema.caja_movimientos.tipo_movimiento)
  },

  async getMovimientosTurno(cajaTurnoId) {
    return db
      .select({
        id: schema.caja_movimientos.id,
        caja_turno_id: schema.caja_movimientos.caja_turno_id,
        tipo_movimiento: schema.caja_movimientos.tipo_movimiento,
        concepto: schema.caja_movimientos.concepto,
        monto_total: schema.caja_movimientos.monto_total,
        observacion: schema.caja_movimientos.observacion,
        usuario_id: schema.caja_movimientos.usuario_id,
        usuario_nombre: schema.usuarios.nombre,
        created_at: schema.caja_movimientos.created_at
      })
      .from(schema.caja_movimientos)
      .leftJoin(schema.usuarios, eq(schema.caja_movimientos.usuario_id, schema.usuarios.id))
      .where(eq(schema.caja_movimientos.caja_turno_id, cajaTurnoId))
      .orderBy(desc(schema.caja_movimientos.created_at))
  },

  async getArqueoByMovimientoId(movimientoId) {
    const [arqueo] = await db
      .select()
      .from(schema.caja_arqueos)
      .where(eq(schema.caja_arqueos.caja_movimiento_id, movimientoId))
    return arqueo || null
  },

  async getArqueosByTurnoId(cajaTurnoId) {
    return db
      .select()
      .from(schema.caja_arqueos)
      .where(eq(schema.caja_arqueos.caja_turno_id, cajaTurnoId))
      .orderBy(desc(schema.caja_arqueos.created_at))
  }
}

module.exports = cajasRepository
