'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, sql } = require('drizzle-orm')
const { getFactores } = require('../../../utils/factores')

/**
 * Caso de Uso Especializado: Apertura de Turno de Caja
 */
const aperturaTurnoService = {
  async aperturarTurno({ identificadorCaja, montoApertura, observacion, branchId, userId, esSuperAdmin }) {
    if (!identificadorCaja || identificadorCaja.trim() === '') {
      const error = new Error('El identificador de caja es requerido.')
      error.statusCode = 400
      throw error
    }

    if (!branchId) {
      const error = new Error('Se requiere una sucursal activa en la sesión.')
      error.statusCode = 400
      throw error
    }

    const idenLimpio = identificadorCaja.trim()

    // 1. Validar que la caja física exista y esté activa para esta sucursal
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
      const error = new Error(`La caja "${idenLimpio}" no existe o no tiene series activas configuradas para esta sucursal.`)
      error.statusCode = 400
      throw error
    }

    // 2. Validar asignación exclusiva a usuario si aplica
    const asignadaA = seriesCaja.find((s) => s.usuario_id)
    if (asignadaA && asignadaA.usuario_id !== userId && !esSuperAdmin) {
      const error = new Error(`La caja "${idenLimpio}" está asignada exclusivamente a otro usuario.`)
      error.statusCode = 403
      throw error
    }

    // 3. Validar que el usuario no tenga ya un turno abierto
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
      const error = new Error(`Ya tienes un turno abierto en la caja "${turnoUsuarioAbierto.identificador_caja}". Debes cerrarlo antes de aperturar uno nuevo.`)
      error.statusCode = 400
      throw error
    }

    // 4. Validar que la caja física no esté siendo operada por otro cajero
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
      const error = new Error(`La caja "${idenLimpio}" ya se encuentra ABIERTA y en operación por el usuario ${cajaEnUso.usuario_nombre || 'otro cajero'}.`)
      error.statusCode = 400
      throw error
    }

    const metodosExistentes = await db
      .select({ id: schema.tipo_metodo_pago.id, nombre: schema.tipo_metodo_pago.nombre })
      .from(schema.tipo_metodo_pago)

    // 5. Transacción atómica de apertura
    return db.transaction(async (tx) => {
      const { factorPrecio } = await getFactores()
      const montoEfectivoCentimos = Math.round(Number(montoApertura || 0) * factorPrecio)

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

      await tx.insert(schema.caja_turnos_resumen).values({
        caja_turno_id: nuevoTurno.id,
        monto_apertura: montoEfectivoCentimos,
        desglose_metodos_pago_jsonb: [],
        desglose_tipos_pago_jsonb: [],
        desglose_anulaciones_jsonb: [],
        created_at: sql`NOW()`,
        updated_at: sql`NOW()`
      })

      const listaMetodos =
        metodosExistentes.length > 0
          ? metodosExistentes
          : [
              { id: '1', nombre: 'EFECTIVO' },
              { id: '2', nombre: 'YAPE' },
              { id: '3', nombre: 'TRANSFERENCIA' },
              { id: '4', nombre: 'CREDITO' }
            ]

      const registrosTotales = listaMetodos.map((m) => ({
        caja_turno_id: nuevoTurno.id,
        metodo_pago_id: String(m.id),
        monto_sistema: 0,
        monto_declarado: 0,
        diferencia: 0,
        observacion: observacion || `Inicialización ${m.nombre}`,
        sincronizado: false,
        created_at: sql`NOW()`,
        updated_at: sql`NOW()`
      }))

      await tx.insert(schema.caja_turno_pagos).values(registrosTotales)

      return {
        ...nuevoTurno,
        monto_apertura: montoEfectivoCentimos
      }
    })
  }
}

module.exports = aperturaTurnoService
