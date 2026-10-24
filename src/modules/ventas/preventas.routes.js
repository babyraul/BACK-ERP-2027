'use strict'

const preventasController = require('./controllers/preventas.controller')

/**
 * Rutas para Pre-Ventas (pedidos / reservas antes del pago)
 * Prefijo: /api/preventas
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authorize (RBAC integrado con fallback ventas.ver)
 */
async function preventasRoutes(fastify) {
  // PreHandler RBAC global para todo el módulo de preventas
  fastify.addHook('preHandler', fastify.authorize)

  // 1. Listar preventas con filtros y paginación
  fastify.get('/', preventasController.listar)

  // 2. Obtener cabecera y detalle de la preventa
  fastify.get('/:id', preventasController.obtenerPorId)

  // 3. Crear nueva preventa transaccional
  fastify.post('/', preventasController.crear)

  // 4. Actualizar preventa existente (Edición)
  fastify.put('/:id', preventasController.actualizar)

  // 5. Anulación lógica de preventa (Soft Delete / Inactivación)
  fastify.delete('/:id', preventasController.anular)
}

module.exports = preventasRoutes
