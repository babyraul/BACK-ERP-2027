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
  fastify.get('/', {
    config: { permission: ['preventas.ver', 'ventas.ver'] }
  }, preventasController.listar)

  // 2. Obtener cabecera y detalle de la preventa
  fastify.get('/:id', {
    config: { permission: ['preventas.ver', 'ventas.ver'] }
  }, preventasController.obtenerPorId)

  // 3. Crear nueva preventa transaccional
  fastify.post('/', {
    config: { permission: ['preventas.crear', 'ventas.crear'] }
  }, preventasController.crear)

  // 4. Actualizar preventa existente (Edición)
  fastify.put('/:id', {
    config: { permission: ['preventas.editar', 'ventas.crear'] }
  }, preventasController.actualizar)

  // 5. Anulación lógica de preventa (Soft Delete / Inactivación)
  fastify.delete('/:id', {
    config: { permission: ['preventas.eliminar', 'ventas.anular'] }
  }, preventasController.anular)
}

module.exports = preventasRoutes
