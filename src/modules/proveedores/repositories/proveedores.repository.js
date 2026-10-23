'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')

/**
 * Repositorio de Proveedores (Persistencia Drizzle ORM)
 */
const proveedoresRepository = {
  // Obtener proveedores con joins a ubigeo y RLS
  async getProveedores({ q, activo, empresaId, esSuperAdmin = false, limit, offset }) {
    const conditions = []

    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.proveedores.empresa_id, empresaId), sql`${schema.proveedores.empresa_id} IS NULL`))
    }

    if (activo !== undefined && activo !== '') {
      conditions.push(eq(schema.proveedores.activo, activo === 'true' || activo === true))
    }

    if (q && q.trim() !== '') {
      const search = `%${q.trim()}%`
      conditions.push(
        or(
          ilike(schema.proveedores.ruc, search),
          ilike(schema.proveedores.razon_social, search),
          ilike(schema.proveedores.nombre_comercial, search),
          ilike(schema.proveedores.email, search),
          ilike(schema.proveedores.persona_contacto, search)
        )
      )
    }

    let query = db
      .select({
        id: schema.proveedores.id,
        empresa_id: schema.proveedores.empresa_id,
        ruc: schema.proveedores.ruc,
        razon_social: schema.proveedores.razon_social,
        nombre_comercial: schema.proveedores.nombre_comercial,
        direccion: schema.proveedores.direccion,
        ubigeo: schema.proveedores.ubigeo,
        email: schema.proveedores.email,
        telefono: schema.proveedores.telefono,
        persona_contacto: schema.proveedores.persona_contacto,
        es_mercaderia: schema.proveedores.es_mercaderia,
        es_servicio: schema.proveedores.es_servicio,
        es_activo: schema.proveedores.es_activo,
        es_comisiones: schema.proveedores.es_comisiones,
        activo: schema.proveedores.activo,
        sincronizado: schema.proveedores.sincronizado,
        created_at: schema.proveedores.created_at,
        updated_at: schema.proveedores.updated_at,
        ubigeo_departamento: schema.ubigeo.departamento,
        ubigeo_provincia: schema.ubigeo.provincia,
        ubigeo_distrito: schema.ubigeo.distrito
      })
      .from(schema.proveedores)
      .leftJoin(schema.ubigeo, eq(schema.proveedores.ubigeo, schema.ubigeo.codigo))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    query = query.orderBy(desc(schema.proveedores.created_at))

    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.offset(offset)
    }

    const data = await query

    return data.map((p) => ({
      ...p,
      ubigeo_descripcion: p.ubigeo && p.ubigeo_departamento
        ? `${p.ubigeo_departamento} - ${p.ubigeo_provincia} - ${p.ubigeo_distrito}`
        : null
    }))
  },

  // Obtener proveedor por ID y validar RLS
  async getProveedorById(id, { empresaId, esSuperAdmin = false }) {
    const conditions = [eq(schema.proveedores.id, id)]
    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.proveedores.empresa_id, empresaId), sql`${schema.proveedores.empresa_id} IS NULL`))
    }

    const [proveedor] = await db
      .select({
        id: schema.proveedores.id,
        empresa_id: schema.proveedores.empresa_id,
        ruc: schema.proveedores.ruc,
        razon_social: schema.proveedores.razon_social,
        nombre_comercial: schema.proveedores.nombre_comercial,
        direccion: schema.proveedores.direccion,
        ubigeo: schema.proveedores.ubigeo,
        email: schema.proveedores.email,
        telefono: schema.proveedores.telefono,
        persona_contacto: schema.proveedores.persona_contacto,
        es_mercaderia: schema.proveedores.es_mercaderia,
        es_servicio: schema.proveedores.es_servicio,
        es_activo: schema.proveedores.es_activo,
        es_comisiones: schema.proveedores.es_comisiones,
        activo: schema.proveedores.activo,
        sincronizado: schema.proveedores.sincronizado,
        created_at: schema.proveedores.created_at,
        updated_at: schema.proveedores.updated_at,
        ubigeo_departamento: schema.ubigeo.departamento,
        ubigeo_provincia: schema.ubigeo.provincia,
        ubigeo_distrito: schema.ubigeo.distrito
      })
      .from(schema.proveedores)
      .leftJoin(schema.ubigeo, eq(schema.proveedores.ubigeo, schema.ubigeo.codigo))
      .where(and(...conditions))
      .limit(1)

    if (!proveedor) return null

    return {
      ...proveedor,
      ubigeo_descripcion: proveedor.ubigeo && proveedor.ubigeo_departamento
        ? `${proveedor.ubigeo_departamento} - ${proveedor.ubigeo_provincia} - ${proveedor.ubigeo_distrito}`
        : null
    }
  },

  // Buscar proveedor por RUC en la misma empresa (para unicidad)
  async findProveedorByRuc(ruc, empresaId, excludeId = null) {
    const conditions = [eq(schema.proveedores.ruc, ruc)]
    if (empresaId) {
      conditions.push(eq(schema.proveedores.empresa_id, empresaId))
    }
    if (excludeId) {
      conditions.push(sql`${schema.proveedores.id} != ${excludeId}`)
    }

    const [existing] = await db
      .select()
      .from(schema.proveedores)
      .where(and(...conditions))
      .limit(1)

    return existing || null
  },

  // Insertar proveedor
  async insertProveedor(payload) {
    const [nuevo] = await db.insert(schema.proveedores).values(payload).returning()
    return nuevo
  },

  // Actualizar proveedor
  async updateProveedor(id, payload) {
    const [updated] = await db
      .update(schema.proveedores)
      .set({ ...payload, updated_at: sql`NOW()` })
      .where(eq(schema.proveedores.id, id))
      .returning()
    return updated || null
  },

  // Inactivar proveedor (Soft delete / Baja lógica)
  async deleteProveedor(id) {
    const [inactivado] = await db
      .update(schema.proveedores)
      .set({ activo: false, updated_at: new Date().toISOString() })
      .where(eq(schema.proveedores.id, id))
      .returning()
    return inactivado || null
  }
}

module.exports = proveedoresRepository
