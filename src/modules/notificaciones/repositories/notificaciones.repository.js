'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, desc, sql } = require('drizzle-orm')

/**
 * Repositorio de Notificaciones In-App (Drizzle ORM)
 */
const notificacionesRepository = {
  _buildScopeCondition({ userId, branchId, soloNoLeidas = false, tipo = null }) {
    const conditions = []

    if (userId && branchId) {
      conditions.push(
        or(
          eq(schema.notificaciones.usuario_id, userId),
          and(sql`${schema.notificaciones.usuario_id} IS NULL`, eq(schema.notificaciones.branch_id, branchId))
        )
      )
    } else if (userId) {
      conditions.push(eq(schema.notificaciones.usuario_id, userId))
    } else if (branchId) {
      conditions.push(eq(schema.notificaciones.branch_id, branchId))
    }

    if (soloNoLeidas) {
      conditions.push(eq(schema.notificaciones.leido, false))
    }

    if (tipo) {
      conditions.push(eq(schema.notificaciones.tipo, String(tipo).toLowerCase()))
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  },

  async listar({ userId, branchId, leido, tipo, limit = 50, offset = 0 }) {
    const whereClause = this._buildScopeCondition({
      userId,
      branchId,
      soloNoLeidas: leido === false || leido === 'false',
      tipo
    })

    let query = db
      .select()
      .from(schema.notificaciones)
      .where(whereClause)
      .orderBy(desc(schema.notificaciones.created_at))
      .limit(limit)
      .offset(offset)

    if (leido === true || leido === 'true') {
      const baseCond = this._buildScopeCondition({ userId, branchId, tipo })
      query = db
        .select()
        .from(schema.notificaciones)
        .where(and(baseCond, eq(schema.notificaciones.leido, true)))
        .orderBy(desc(schema.notificaciones.created_at))
        .limit(limit)
        .offset(offset)
    }

    return query
  },

  async contarNoLeidas({ userId, branchId }) {
    const whereClause = this._buildScopeCondition({ userId, branchId, soloNoLeidas: true })
    const [row] = await db
      .select({ total: sql`COUNT(*)::int` })
      .from(schema.notificaciones)
      .where(whereClause)

    return Number(row?.total || 0)
  },

  async obtenerUltimas({ userId, branchId, limit = 10 }) {
    const whereClause = this._buildScopeCondition({ userId, branchId })
    return db
      .select()
      .from(schema.notificaciones)
      .where(whereClause)
      .orderBy(desc(schema.notificaciones.created_at))
      .limit(limit)
  },

  async marcarLeida(id, { userId, branchId }) {
    const scope = this._buildScopeCondition({ userId, branchId })
    const whereClause = scope ? and(eq(schema.notificaciones.id, id), scope) : eq(schema.notificaciones.id, id)

    const [updated] = await db
      .update(schema.notificaciones)
      .set({ leido: true })
      .where(whereClause)
      .returning()

    return updated || null
  },

  async marcarTodasLeidas({ userId, branchId }) {
    const whereClause = this._buildScopeCondition({ userId, branchId, soloNoLeidas: true })
    const updated = await db
      .update(schema.notificaciones)
      .set({ leido: true })
      .where(whereClause)
      .returning({ id: schema.notificaciones.id })

    return updated.length
  },

  async crear(data) {
    const [created] = await db
      .insert(schema.notificaciones)
      .values(data)
      .returning()

    return created
  }
}

module.exports = notificacionesRepository
