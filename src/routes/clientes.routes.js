'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')

/**
 * Rutas CRUD para Clientes
 * Prefijo: /api/clientes
 *
 * Tabla: schema.clientes
 * - id: uuid
 * - tipo_documento_id: varchar(2) (ej. '1' DNI, '6' RUC)
 * - numero_documento: varchar(20)
 * - nombre_razon_social: text
 * - direccion_1, direccion_2, direccion_3: text
 * - email_1, email_2, email_3: text
 * - telefono_1, telefono_2, telefono_3: varchar(20)
 * - empresa_id: uuid
 * - limite_credito_int: bigint (en céntimos x100)
 * - saldo_utilizado_int: bigint
 * - dias_credito_pactado: integer
 * - cantidad_cuotas: integer
 * - estado_credito: varchar(20) ('NORMAL', 'OBSERVADO', 'BLOQUEADO')
 * - sincronizado: boolean
 * - created_at, updated_at: timestamp
 */
async function clientesRoutes(fastify) {
  // Asegura autenticación y autorización RBAC dinámica (clientes.ver, etc.)
  fastify.addHook('preHandler', fastify.authorize)

  // ── GET /api/clientes ───────────────────────────────────────────
  fastify.get('/', async (request, reply) => {
    const { q, tipo_documento_id, estado_credito } = request.query
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    const conditions = []

    // RLS por empresa si el usuario no es superadmin
    if (!request.user.es_super_admin && empresaId) {
      conditions.push(or(eq(schema.clientes.empresa_id, empresaId), sql`${schema.clientes.empresa_id} IS NULL`))
    }

    if (tipo_documento_id && tipo_documento_id.trim() !== '') {
      conditions.push(eq(schema.clientes.tipo_documento_id, tipo_documento_id.trim()))
    }

    if (estado_credito && estado_credito.trim() !== '') {
      conditions.push(eq(schema.clientes.estado_credito, estado_credito.trim()))
    }

    if (q && q.trim() !== '') {
      const search = `%${q.trim()}%`
      conditions.push(
        or(
          ilike(schema.clientes.numero_documento, search),
          ilike(schema.clientes.nombre_razon_social, search),
          ilike(schema.clientes.email_1, search),
          ilike(schema.clientes.telefono_1, search),
          ilike(schema.clientes.direccion_1, search)
        )
      )
    }

    let query = db
      .select({
        id: schema.clientes.id,
        tipo_documento_id: schema.clientes.tipo_documento_id,
        tipo_documento_abreviatura: schema.tipo_documento.abreviatura,
        tipo_documento_descripcion: schema.tipo_documento.descripcion,
        numero_documento: schema.clientes.numero_documento,
        nombre_razon_social: schema.clientes.nombre_razon_social,
        direccion_1: schema.clientes.direccion_1,
        direccion_2: schema.clientes.direccion_2,
        direccion_3: schema.clientes.direccion_3,
        email_1: schema.clientes.email_1,
        email_2: schema.clientes.email_2,
        email_3: schema.clientes.email_3,
        telefono_1: schema.clientes.telefono_1,
        telefono_2: schema.clientes.telefono_2,
        telefono_3: schema.clientes.telefono_3,
        empresa_id: schema.clientes.empresa_id,
        limite_credito_int: schema.clientes.limite_credito_int,
        saldo_utilizado_int: schema.clientes.saldo_utilizado_int,
        dias_credito_pactado: schema.clientes.dias_credito_pactado,
        cantidad_cuotas: schema.clientes.cantidad_cuotas,
        estado_credito: schema.clientes.estado_credito,
        sincronizado: schema.clientes.sincronizado,
        created_at: schema.clientes.created_at,
        updated_at: schema.clientes.updated_at,
      })
      .from(schema.clientes)
      .leftJoin(schema.tipo_documento, eq(schema.clientes.tipo_documento_id, schema.tipo_documento.id))
      .orderBy(desc(schema.clientes.created_at))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const data = await query

    // Formatear montos para UI (limite_credito en formato decimal y raw)
    const formatted = data.map(c => ({
      ...c,
      limite_credito: Number(c.limite_credito_int || 0) / 100,
      saldo_utilizado: Number(c.saldo_utilizado_int || 0) / 100,
      saldo_disponible: (Number(c.limite_credito_int || 0) - Number(c.saldo_utilizado_int || 0)) / 100,
    }))

    return reply.code(200).send({ success: true, data: formatted })
  })

  // ── GET /api/clientes/:id ───────────────────────────────────────
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    const conditions = [eq(schema.clientes.id, id)]
    if (!request.user.es_super_admin && empresaId) {
      conditions.push(or(eq(schema.clientes.empresa_id, empresaId), sql`${schema.clientes.empresa_id} IS NULL`))
    }

    const [cliente] = await db
      .select({
        id: schema.clientes.id,
        tipo_documento_id: schema.clientes.tipo_documento_id,
        tipo_documento_abreviatura: schema.tipo_documento.abreviatura,
        tipo_documento_descripcion: schema.tipo_documento.descripcion,
        numero_documento: schema.clientes.numero_documento,
        nombre_razon_social: schema.clientes.nombre_razon_social,
        direccion_1: schema.clientes.direccion_1,
        direccion_2: schema.clientes.direccion_2,
        direccion_3: schema.clientes.direccion_3,
        email_1: schema.clientes.email_1,
        email_2: schema.clientes.email_2,
        email_3: schema.clientes.email_3,
        telefono_1: schema.clientes.telefono_1,
        telefono_2: schema.clientes.telefono_2,
        telefono_3: schema.clientes.telefono_3,
        empresa_id: schema.clientes.empresa_id,
        limite_credito_int: schema.clientes.limite_credito_int,
        saldo_utilizado_int: schema.clientes.saldo_utilizado_int,
        dias_credito_pactado: schema.clientes.dias_credito_pactado,
        cantidad_cuotas: schema.clientes.cantidad_cuotas,
        estado_credito: schema.clientes.estado_credito,
        sincronizado: schema.clientes.sincronizado,
        created_at: schema.clientes.created_at,
        updated_at: schema.clientes.updated_at,
      })
      .from(schema.clientes)
      .leftJoin(schema.tipo_documento, eq(schema.clientes.tipo_documento_id, schema.tipo_documento.id))
      .where(and(...conditions))

    if (!cliente) {
      throw fastify.httpErrors.notFound(`Cliente no encontrado`)
    }

    cliente.limite_credito = Number(cliente.limite_credito_int || 0) / 100
    cliente.saldo_utilizado = Number(cliente.saldo_utilizado_int || 0) / 100
    cliente.saldo_disponible = (Number(cliente.limite_credito_int || 0) - Number(cliente.saldo_utilizado_int || 0)) / 100

    return reply.code(200).send({ success: true, data: cliente })
  })

  // ── POST /api/clientes ──────────────────────────────────────────
  fastify.post('/', async (request, reply) => {
    const payload = { ...request.body }

    // RLS inyectar empresa_id
    if (!request.user.es_super_admin) {
      if (!payload.empresa_id && request.user.empresa_id) {
        payload.empresa_id = request.user.empresa_id
      }
    }

    const tipoDoc = payload.tipo_documento_id ? String(payload.tipo_documento_id).trim() : '1'
    const numDoc = payload.numero_documento ? String(payload.numero_documento).trim() : ''
    const nombre = payload.nombre_razon_social ? String(payload.nombre_razon_social).trim() : ''

    if (!numDoc) {
      return reply.code(400).send({ success: false, message: 'El número de documento es obligatorio.' })
    }
    if (!nombre) {
      return reply.code(400).send({ success: false, message: 'El nombre o razón social es obligatorio.' })
    }

    // Verificar si ya existe este número de documento para el mismo tipo de documento
    const [existing] = await db
      .select({ id: schema.clientes.id })
      .from(schema.clientes)
      .where(
        and(
          eq(schema.clientes.tipo_documento_id, tipoDoc),
          eq(schema.clientes.numero_documento, numDoc)
        )
      )

    if (existing) {
      return reply.code(400).send({
        success: false,
        message: `Ya existe un cliente registrado con el documento ${numDoc}`
      })
    }

    // Convertir límite de crédito si viene en decimal a céntimos (x100)
    const limiteCreditoInt = payload.limite_credito !== undefined
      ? Math.round(Number(payload.limite_credito || 0) * 100)
      : Math.round(Number(payload.limite_credito_int || 0))

    const insertData = {
      tipo_documento_id: tipoDoc,
      numero_documento: numDoc,
      nombre_razon_social: nombre,
      direccion_1: payload.direccion_1 ? String(payload.direccion_1).trim() : null,
      direccion_2: payload.direccion_2 ? String(payload.direccion_2).trim() : null,
      direccion_3: payload.direccion_3 ? String(payload.direccion_3).trim() : null,
      email_1: payload.email_1 ? String(payload.email_1).trim() : null,
      email_2: payload.email_2 ? String(payload.email_2).trim() : null,
      email_3: payload.email_3 ? String(payload.email_3).trim() : null,
      telefono_1: payload.telefono_1 ? String(payload.telefono_1).trim() : null,
      telefono_2: payload.telefono_2 ? String(payload.telefono_2).trim() : null,
      telefono_3: payload.telefono_3 ? String(payload.telefono_3).trim() : null,
      empresa_id: payload.empresa_id || null,
      limite_credito_int: limiteCreditoInt || 0,
      saldo_utilizado_int: 0,
      dias_credito_pactado: Number(payload.dias_credito_pactado) || 30,
      cantidad_cuotas: Number(payload.cantidad_cuotas) || 1,
      estado_credito: payload.estado_credito || 'NORMAL',
      sincronizado: false,
      updated_at: new Date().toISOString()
    }

    const [nuevoCliente] = await db
      .insert(schema.clientes)
      .values(insertData)
      .returning()

    return reply.code(201).send({
      success: true,
      message: 'Cliente registrado exitosamente',
      data: nuevoCliente
    })
  })

  // ── PUT /api/clientes/:id ───────────────────────────────────────
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const payload = { ...request.body }
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    const conditions = [eq(schema.clientes.id, id)]
    if (!request.user.es_super_admin && empresaId) {
      conditions.push(or(eq(schema.clientes.empresa_id, empresaId), sql`${schema.clientes.empresa_id} IS NULL`))
    }

    const [existing] = await db
      .select()
      .from(schema.clientes)
      .where(and(...conditions))

    if (!existing) {
      throw fastify.httpErrors.notFound('Cliente no encontrado')
    }

    const tipoDoc = payload.tipo_documento_id ? String(payload.tipo_documento_id).trim() : existing.tipo_documento_id
    const numDoc = payload.numero_documento ? String(payload.numero_documento).trim() : existing.numero_documento

    // Si cambia el documento, verificar que no colisione
    if (tipoDoc !== existing.tipo_documento_id || numDoc !== existing.numero_documento) {
      const [duplicate] = await db
        .select({ id: schema.clientes.id })
        .from(schema.clientes)
        .where(
          and(
            eq(schema.clientes.tipo_documento_id, tipoDoc),
            eq(schema.clientes.numero_documento, numDoc)
          )
        )

      if (duplicate && duplicate.id !== id) {
        return reply.code(400).send({
          success: false,
          message: `Ya existe otro cliente con el documento ${numDoc}`
        })
      }
    }

    const updateData = {
      ...(payload.tipo_documento_id !== undefined && { tipo_documento_id: tipoDoc }),
      ...(payload.numero_documento !== undefined && { numero_documento: numDoc }),
      ...(payload.nombre_razon_social !== undefined && { nombre_razon_social: String(payload.nombre_razon_social).trim() }),
      ...(payload.direccion_1 !== undefined && { direccion_1: payload.direccion_1 ? String(payload.direccion_1).trim() : null }),
      ...(payload.direccion_2 !== undefined && { direccion_2: payload.direccion_2 ? String(payload.direccion_2).trim() : null }),
      ...(payload.direccion_3 !== undefined && { direccion_3: payload.direccion_3 ? String(payload.direccion_3).trim() : null }),
      ...(payload.email_1 !== undefined && { email_1: payload.email_1 ? String(payload.email_1).trim() : null }),
      ...(payload.email_2 !== undefined && { email_2: payload.email_2 ? String(payload.email_2).trim() : null }),
      ...(payload.email_3 !== undefined && { email_3: payload.email_3 ? String(payload.email_3).trim() : null }),
      ...(payload.telefono_1 !== undefined && { telefono_1: payload.telefono_1 ? String(payload.telefono_1).trim() : null }),
      ...(payload.telefono_2 !== undefined && { telefono_2: payload.telefono_2 ? String(payload.telefono_2).trim() : null }),
      ...(payload.telefono_3 !== undefined && { telefono_3: payload.telefono_3 ? String(payload.telefono_3).trim() : null }),
      ...(payload.limite_credito !== undefined && { limite_credito_int: Math.round(Number(payload.limite_credito || 0) * 100) }),
      ...(payload.dias_credito_pactado !== undefined && { dias_credito_pactado: Number(payload.dias_credito_pactado) }),
      ...(payload.cantidad_cuotas !== undefined && { cantidad_cuotas: Number(payload.cantidad_cuotas) }),
      ...(payload.estado_credito !== undefined && { estado_credito: String(payload.estado_credito).trim() }),
      updated_at: new Date().toISOString()
    }

    const [updated] = await db
      .update(schema.clientes)
      .set(updateData)
      .where(eq(schema.clientes.id, id))
      .returning()

    return reply.code(200).send({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: updated
    })
  })

  // ── DELETE /api/clientes/:id ────────────────────────────────────
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    const conditions = [eq(schema.clientes.id, id)]
    if (!request.user.es_super_admin && empresaId) {
      conditions.push(or(eq(schema.clientes.empresa_id, empresaId), sql`${schema.clientes.empresa_id} IS NULL`))
    }

    const [existing] = await db
      .select({ id: schema.clientes.id })
      .from(schema.clientes)
      .where(and(...conditions))

    if (!existing) {
      throw fastify.httpErrors.notFound('Cliente no encontrado')
    }

    const [deleted] = await db
      .delete(schema.clientes)
      .where(eq(schema.clientes.id, id))
      .returning()

    return reply.code(200).send({
      success: true,
      message: 'Cliente eliminado correctamente',
      data: deleted
    })
  })
}

module.exports = clientesRoutes
