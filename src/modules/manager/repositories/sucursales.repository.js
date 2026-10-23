'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq } = require('drizzle-orm')

/**
 * Repositorio de Sucursales (Persistencia Drizzle ORM)
 */
const sucursalesRepository = {
  // Obtener sucursales con descripción de Ubigeo y filtro RLS por empresa
  async getSucursales({ empresaId, esSuperAdmin = false }) {
    let baseQuery = db
      .select({
        sucursal: schema.sucursales,
        ubigeo: schema.ubigeo
      })
      .from(schema.sucursales)
      .leftJoin(schema.ubigeo, eq(schema.sucursales.ubigeo, schema.ubigeo.codigo))

    // Row-Level Security (RLS)
    if (!esSuperAdmin && empresaId) {
      baseQuery = baseQuery.where(eq(schema.sucursales.empresa_id, empresaId))
    }

    const rawData = await baseQuery

    return rawData.map((row) => ({
      ...row.sucursal,
      ubigeo_descripcion: row.ubigeo
        ? `${row.ubigeo.departamento}, ${row.ubigeo.provincia}, ${row.ubigeo.distrito}`
        : null
    }))
  },

  // Obtener sucursal por ID
  async getSucursalById(id) {
    const [sucursal] = await db
      .select()
      .from(schema.sucursales)
      .where(eq(schema.sucursales.id, id))
      .limit(1)
    return sucursal || null
  },

  // Crear sucursal
  async createSucursal(payload) {
    const [nueva] = await db.insert(schema.sucursales).values(payload).returning()
    return nueva
  },

  // Actualizar sucursal
  async updateSucursal(id, payload) {
    const [updated] = await db
      .update(schema.sucursales)
      .set(payload)
      .where(eq(schema.sucursales.id, id))
      .returning()
    return updated || null
  },

  // Inactivar sucursal (Baja lógica / Soft delete)
  async deleteSucursal(id) {
    const [inactivado] = await db
      .update(schema.sucursales)
      .set({
        activo: false,
        updated_at: new Date().toISOString()
      })
      .where(eq(schema.sucursales.id, id))
      .returning()
    return inactivado || null
  }
}

module.exports = sucursalesRepository
