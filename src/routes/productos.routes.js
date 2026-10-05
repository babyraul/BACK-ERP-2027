'use strict'

/**
 * Rutas CRUD — Productos
 * Todas protegidas con JWT.
 * TODO: reemplazar fastify.sql con queries Drizzle cuando el schema esté listo.
 *
 * GET    /api/productos           → listar (paginado + filtros)
 * GET    /api/productos/:id       → obtener uno
 * POST   /api/productos           → crear
 * PUT    /api/productos/:id       → actualizar
 * DELETE /api/productos/:id       → soft delete
 */
async function productosRoutes(fastify) {

  const auth = { preHandler: [fastify.authenticate] }

  // ── GET / ──────────────────────────────────────────────────────────────────
  fastify.get('/', auth, async (request) => {
    const { page = 1, limit = 20, q = '' } = request.query
    const offset = (page - 1) * limit

    // TODO: DB → SELECT con filtro por nombre/código, paginación, deleted_at IS NULL
    return {
      data:  [],
      meta:  { page: Number(page), limit: Number(limit), total: 0 },
    }
  })

  // ── GET /:id ───────────────────────────────────────────────────────────────
  fastify.get('/:id', auth, async (request, reply) => {
    const { id } = request.params
    // TODO: DB → SELECT WHERE id = $id AND deleted_at IS NULL
    return reply.notFound(`Producto ${id} no encontrado.`)
  })

  // ── POST / ─────────────────────────────────────────────────────────────────
  fastify.post('/', {
    ...auth,
    schema: {
      body: {
        type: 'object',
        required: ['nombre', 'precio'],
        properties: {
          codigo:    { type: 'string' },
          nombre:    { type: 'string', minLength: 2 },
          precio:    { type: 'number', minimum: 0 },
          stock:     { type: 'integer', minimum: 0 },
          categoria_id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body
    // TODO: DB → INSERT INTO productos (...) VALUES (...) RETURNING *
    // TODO: SYNC → INSERT INTO sync_log (tabla, operacion, payload)
    return reply.code(201).send({ message: 'Producto creado.', data: body })
  })

  // ── PUT /:id ───────────────────────────────────────────────────────────────
  fastify.put('/:id', {
    ...auth,
    schema: {
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          precio: { type: 'number' },
          stock:  { type: 'integer' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params
    // TODO: DB → UPDATE productos SET ...body, updated_at = now() WHERE id = $id
    // TODO: SYNC → INSERT INTO sync_log
    return { message: `Producto ${id} actualizado.`, data: request.body }
  })

  // ── DELETE /:id ────────────────────────────────────────────────────────────
  fastify.delete('/:id', auth, async (request, reply) => {
    const { id } = request.params
    // TODO: DB → UPDATE productos SET deleted_at = now() WHERE id = $id
    // TODO: SYNC → INSERT INTO sync_log (operacion: 'delete')
    return { message: `Producto ${id} eliminado.` }
  })
}

module.exports = productosRoutes
