'use strict'

const preventasController = require('./controllers/preventas.controller')

/**
 * Rutas para Pre-Ventas (pedidos / reservas antes del pago)
 * Prefijo: /api/preventas
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authenticate (RBAC integrado)
 */
async function preventasRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

  // 1. Listar preventas con filtros
  fastify.get('/', auth, preventasController.listar)

  // 2. Obtener cabecera y detalle de la preventa
  fastify.get('/:id', auth, preventasController.obtenerPorId)

  // 3. Crear nueva preventa transaccional
  fastify.post('/', auth, preventasController.crear)

  // 4. Actualizar preventa existente (Edición)
  fastify.put('/:id', auth, preventasController.actualizar)

  // 5. Anulación lógica de preventa (Soft Delete / Inactivación)
  fastify.delete('/:id', auth, preventasController.anular)
}

module.exports = preventasRoutes
