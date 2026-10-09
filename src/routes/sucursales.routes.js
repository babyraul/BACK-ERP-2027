'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const GenericService = require('../core/generic.service')

async function sucursalesRoutes(fastify) {
  // Middleware Global para todas las rutas de este bloque
  // Validará automáticamente los permisos infiriéndolos de la URL (ej. sucursales.ver)
  fastify.addHook('preHandler', fastify.authorize)

  const service = new GenericService(schema.sucursales)

  fastify.get('/', async (request, reply) => {
    const { eq } = require('drizzle-orm')
    
    let baseQuery = db
      .select({
        sucursal: schema.sucursales,
        ubigeo: schema.ubigeo
      })
      .from(schema.sucursales)
      .leftJoin(schema.ubigeo, eq(schema.sucursales.ubigeo, schema.ubigeo.codigo))

    // ── Row-Level Security (RLS) ──
    // Si no es super admin, solo puede ver las sucursales de su propia empresa
    if (!request.user.es_super_admin && request.user.empresa_id) {
      baseQuery = baseQuery.where(eq(schema.sucursales.empresa_id, request.user.empresa_id))
    }

    const rawData = await baseQuery

    const data = rawData.map(row => ({
      ...row.sucursal,
      ubigeo_descripcion: row.ubigeo 
        ? `${row.ubigeo.departamento}, ${row.ubigeo.provincia}, ${row.ubigeo.distrito}`
        : null
    }))
    return reply.code(200).send({ data })
  })

  fastify.get('/:id', async (request, reply) => {
    const data = await service.getById(request.params.id)
    if (!data) throw fastify.httpErrors.notFound('Registro no encontrado')
    return reply.code(200).send({ data })
  })

  fastify.post('/', async (request, reply) => {
    const data = await service.create(request.body)
    return reply.code(201).send({ message: 'Registro creado exitosamente', data })
  })

  fastify.put('/:id', async (request, reply) => {
    const existing = await service.getById(request.params.id)
    if (!existing) throw fastify.httpErrors.notFound('Registro no encontrado')
    const data = await service.update(request.params.id, request.body)
    return reply.code(200).send({ message: 'Registro actualizado', data })
  })

  fastify.delete('/:id', async (request, reply) => {
    const existing = await service.getById(request.params.id)
    if (!existing) throw fastify.httpErrors.notFound('Registro no encontrado')
    const data = await service.remove(request.params.id)
    return reply.code(200).send({ message: 'Registro eliminado', data })
  })
}

module.exports = sucursalesRoutes
