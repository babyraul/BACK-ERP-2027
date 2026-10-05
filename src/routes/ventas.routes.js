'use strict'

/** Rutas CRUD — Ventas  [JWT protegidas] */
async function ventasRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

  fastify.get('/', auth, async (request) => {
    const { page = 1, limit = 20, desde, hasta, estado } = request.query
    // TODO: DB → SELECT ventas JOIN clientes con filtros fecha/estado
    return { data: [], meta: { page: Number(page), limit: Number(limit), total: 0 } }
  })

  fastify.get('/:id', auth, async (request, reply) => {
    // TODO: DB → SELECT venta + detalle_ventas WHERE id = $id
    return reply.notFound(`Venta ${request.params.id} no encontrada.`)
  })

  fastify.post('/', {
    ...auth,
    schema: {
      body: {
        type: 'object',
        required: ['cliente_id', 'items'],
        properties: {
          cliente_id: { type: 'string' },
          tipo:       { type: 'string', enum: ['boleta', 'factura', 'ticket'] },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['producto_id', 'cantidad', 'precio_unitario'],
              properties: {
                producto_id:     { type: 'string' },
                cantidad:        { type: 'number', minimum: 0.01 },
                precio_unitario: { type: 'number', minimum: 0 },
                descuento:       { type: 'number', default: 0 },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    // TODO: DB → INSERT venta + detalle_ventas en transacción
    // TODO: DB → UPDATE stock de productos
    // TODO: SYNC → INSERT sync_log para venta y detalle
    return reply.code(201).send({ message: 'Venta registrada.', data: request.body })
  })

  fastify.patch('/:id/anular', auth, async (request) => {
    // TODO: DB → UPDATE ventas SET estado = 'anulado', updated_at = now()
    // TODO: SYNC → INSERT sync_log
    return { message: `Venta ${request.params.id} anulada.` }
  })
}

module.exports = ventasRoutes
