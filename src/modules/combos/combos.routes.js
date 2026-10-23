'use strict'

const combosController = require('./controllers/combos.controller')

/**
 * Rutas de Combos Promocionales
 * Prefijo: /api/combos
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authorize (RBAC: combos.ver, combos.crear, combos.editar, combos.eliminar)
 */
async function combosRoutes(fastify) {
  // Verificación de autenticación y autorización RBAC
  fastify.addHook('preHandler', fastify.authorize)

  // Endpoints REST de Combos
  fastify.get('/', combosController.listar)
  fastify.get('/:id', combosController.obtenerPorId)
  fastify.post('/', combosController.crear)
  fastify.put('/:id', combosController.actualizar)
  fastify.patch('/:id', combosController.toggleEstado)
  fastify.delete('/:id', combosController.eliminar) // Inactivación visual (Soft delete)
}

module.exports = combosRoutes
