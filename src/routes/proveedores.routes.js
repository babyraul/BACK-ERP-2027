'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')

/**
 * Rutas CRUD para Proveedores
 * Prefijo: /api/proveedores
 * 
 * Columnas de tabla schema.proveedores:
 * - id: uuid
 * - empresa_id: uuid
 * - ruc: varchar(11)
 * - razon_social: varchar(200)
 * - nombre_comercial: varchar(200)
 * - direccion: varchar(255)
 * - ubigeo: varchar(6)
 * - email: varchar(150)
 * - telefono: varchar(50)
 * - persona_contacto: varchar(150)
 * - es_mercaderia: boolean
 * - es_servicio: boolean
 * - es_activo: boolean
 * - es_comisiones: boolean
 * - activo: boolean
 * - sincronizado: boolean
 * - created_at: timestamp
 * - updated_at: timestamp
 */
async function proveedoresRoutes(fastify) {
  // Asegura autenticación y autorización RBAC dinámica
  fastify.addHook('preHandler', fastify.authorize)

  // ── GET /api/proveedores ───────────────────────────────────────────
  fastify.get('/', async (request, reply) => {
    const { q, activo } = request.query
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    const conditions = []

    // RLS por empresa si el usuario no es superadmin
    if (!request.user.es_super_admin && empresaId) {
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
        ubigeo_distrito: schema.ubigeo.distrito,
      })
      .from(schema.proveedores)
      .leftJoin(schema.ubigeo, eq(schema.proveedores.ubigeo, schema.ubigeo.codigo))
      .orderBy(desc(schema.proveedores.created_at))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const data = await query

    // Mapear ubigeo_descripcion amigable
    const dataFormatted = data.map(p => ({
      ...p,
      ubigeo_descripcion: p.ubigeo_departamento
        ? `${p.ubigeo_departamento} - ${p.ubigeo_provincia} - ${p.ubigeo_distrito}`
        : null
    }))

    return reply.code(200).send({ success: true, data: dataFormatted })
  })

  // ── GET /api/proveedores/:id ───────────────────────────────────────
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    const conditions = [eq(schema.proveedores.id, id)]

    if (!request.user.es_super_admin && empresaId) {
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
        ubigeo_distrito: schema.ubigeo.distrito,
      })
      .from(schema.proveedores)
      .leftJoin(schema.ubigeo, eq(schema.proveedores.ubigeo, schema.ubigeo.codigo))
      .where(and(...conditions))

    if (!proveedor) {
      throw fastify.httpErrors.notFound('Proveedor no encontrado')
    }

    proveedor.ubigeo_descripcion = proveedor.ubigeo_departamento
      ? `${proveedor.ubigeo_departamento} - ${proveedor.ubigeo_provincia} - ${proveedor.ubigeo_distrito}`
      : null

    return reply.code(200).send({ success: true, data: proveedor })
  })

  // ── POST /api/proveedores ──────────────────────────────────────────
  fastify.post('/', async (request, reply) => {
    const payload = { ...request.body }

    // RLS inyectar empresa_id
    if (!request.user.es_super_admin) {
      if (!payload.empresa_id && request.user.empresa_id) {
        payload.empresa_id = request.user.empresa_id
      }
    }

    // Validar RUC
    if (!payload.ruc || payload.ruc.trim().length !== 11) {
      return reply.code(400).send({ success: false, message: 'El RUC debe tener 11 dígitos numéricos.' })
    }

    if (!payload.razon_social || payload.razon_social.trim() === '') {
      return reply.code(400).send({ success: false, message: 'La razón social es requerida.' })
    }

    // Verificar si ya existe un proveedor con el mismo RUC
    const [existing] = await db
      .select({ id: schema.proveedores.id })
      .from(schema.proveedores)
      .where(eq(schema.proveedores.ruc, payload.ruc.trim()))

    if (existing) {
      return reply.code(400).send({ success: false, message: `Ya existe un proveedor registrado con el RUC ${payload.ruc}` })
    }

    const insertData = {
      empresa_id: payload.empresa_id || null,
      ruc: payload.ruc.trim(),
      razon_social: payload.razon_social.trim(),
      nombre_comercial: payload.nombre_comercial ? payload.nombre_comercial.trim() : null,
      direccion: payload.direccion ? payload.direccion.trim() : null,
      ubigeo: payload.ubigeo ? payload.ubigeo.trim() : null,
      email: payload.email ? payload.email.trim() : null,
      telefono: payload.telefono ? payload.telefono.trim() : null,
      persona_contacto: payload.persona_contacto ? payload.persona_contacto.trim() : null,
      es_mercaderia: payload.es_mercaderia === true,
      es_servicio: payload.es_servicio === true,
      es_activo: payload.es_activo === true,
      es_comisiones: payload.es_comisiones === true,
      activo: payload.activo !== undefined ? payload.activo : true,
      sincronizado: true,
      updated_at: new Date().toISOString()
    }

    const [nuevoProveedor] = await db
      .insert(schema.proveedores)
      .values(insertData)
      .returning()

    return reply.code(201).send({
      success: true,
      message: 'Proveedor registrado exitosamente',
      data: nuevoProveedor
    })
  })

  // ── PUT /api/proveedores/:id ───────────────────────────────────────
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const payload = { ...request.body }
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    // Verificar que exista y pertenezca a la empresa
    const conditions = [eq(schema.proveedores.id, id)]
    if (!request.user.es_super_admin && empresaId) {
      conditions.push(or(eq(schema.proveedores.empresa_id, empresaId), sql`${schema.proveedores.empresa_id} IS NULL`))
    }

    const [existing] = await db
      .select()
      .from(schema.proveedores)
      .where(and(...conditions))

    if (!existing) {
      throw fastify.httpErrors.notFound('Proveedor no encontrado')
    }

    // Si modifica el RUC, validar que no choque con otro
    if (payload.ruc && payload.ruc.trim() !== existing.ruc) {
      const [duplicate] = await db
        .select({ id: schema.proveedores.id })
        .from(schema.proveedores)
        .where(eq(schema.proveedores.ruc, payload.ruc.trim()))

      if (duplicate && duplicate.id !== id) {
        return reply.code(400).send({ success: false, message: `Ya existe otro proveedor con el RUC ${payload.ruc}` })
      }
    }

    const updateData = {
      ...(payload.ruc !== undefined && { ruc: payload.ruc.trim() }),
      ...(payload.razon_social !== undefined && { razon_social: payload.razon_social.trim() }),
      ...(payload.nombre_comercial !== undefined && { nombre_comercial: payload.nombre_comercial ? payload.nombre_comercial.trim() : null }),
      ...(payload.direccion !== undefined && { direccion: payload.direccion ? payload.direccion.trim() : null }),
      ...(payload.ubigeo !== undefined && { ubigeo: payload.ubigeo ? payload.ubigeo.trim() : null }),
      ...(payload.email !== undefined && { email: payload.email ? payload.email.trim() : null }),
      ...(payload.telefono !== undefined && { telefono: payload.telefono ? payload.telefono.trim() : null }),
      ...(payload.persona_contacto !== undefined && { persona_contacto: payload.persona_contacto ? payload.persona_contacto.trim() : null }),
      ...(payload.es_mercaderia !== undefined && { es_mercaderia: payload.es_mercaderia === true }),
      ...(payload.es_servicio !== undefined && { es_servicio: payload.es_servicio === true }),
      ...(payload.es_activo !== undefined && { es_activo: payload.es_activo === true }),
      ...(payload.es_comisiones !== undefined && { es_comisiones: payload.es_comisiones === true }),
      ...(payload.activo !== undefined && { activo: payload.activo === true }),
      updated_at: new Date().toISOString()
    }

    const [updated] = await db
      .update(schema.proveedores)
      .set(updateData)
      .where(eq(schema.proveedores.id, id))
      .returning()

    return reply.code(200).send({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: updated
    })
  })

  // ── DELETE /api/proveedores/:id ────────────────────────────────────
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    const conditions = [eq(schema.proveedores.id, id)]
    if (!request.user.es_super_admin && empresaId) {
      conditions.push(or(eq(schema.proveedores.empresa_id, empresaId), sql`${schema.proveedores.empresa_id} IS NULL`))
    }

    const [existing] = await db
      .select()
      .from(schema.proveedores)
      .where(and(...conditions))

    if (!existing) {
      throw fastify.httpErrors.notFound('Proveedor no encontrado')
    }

    // Soft delete: cambiar activo a false
    const [deleted] = await db
      .update(schema.proveedores)
      .set({ activo: false, updated_at: new Date().toISOString() })
      .where(eq(schema.proveedores.id, id))
      .returning()

    return reply.code(200).send({
      success: true,
      message: 'Proveedor inactivado exitosamente',
      data: deleted
    })
  })
}

module.exports = proveedoresRoutes
