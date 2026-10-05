'use strict'

/** Rutas CRUD — Clientes  [JWT protegidas] */
async function clientesRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

  fastify.get('/', auth, async (request) => {
    const { page = 1, limit = 20, q = '' } = request.query
    // TODO: DB → SELECT con filtro ruc/nombre, paginación
    return { data: [], meta: { page: Number(page), limit: Number(limit), total: 0 } }
  })

  fastify.get('/:id', auth, async (request, reply) => {
    // TODO: DB → SELECT WHERE id = $id AND deleted_at IS NULL
    return reply.notFound(`Cliente ${request.params.id} no encontrado.`)
  })

  fastify.post('/', {
    ...auth,
    schema: {
      body: {
        type: 'object',
        required: ['nombre'],
        properties: {
          ruc:     { type: 'string' },
          nombre:  { type: 'string', minLength: 2 },
          email:   { type: 'string', format: 'email' },
          telefono: { type: 'string' },
          tipo:    { type: 'string', enum: ['persona', 'empresa'] },
        },
      },
    },
  }, async (request, reply) => {
    // TODO: DB → INSERT + sync_log
    return reply.code(201).send({ message: 'Cliente creado.', data: request.body })
  })

  fastify.put('/:id', auth, async (request) => {
    // TODO: DB → UPDATE + sync_log
    return { message: `Cliente ${request.params.id} actualizado.` }
  })

  fastify.delete('/:id', auth, async (request) => {
    // TODO: DB → soft delete + sync_log
    return { message: `Cliente ${request.params.id} eliminado.` }
  })
}

module.exports = clientesRoutes
