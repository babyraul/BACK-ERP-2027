'use strict'

const clientesController = require('./controllers/clientes.controller')

/**
 * Rutas CRUD para Clientes
 * Prefijo: /api/clientes
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authorize (RBAC: clientes.ver, clientes.crear, clientes.editar, clientes.eliminar)
 */
async function clientesRoutes(fastify) {
  // Asegura autenticación y autorización RBAC dinámica
  fastify.addHook('preHandler', fastify.authorize)

  // Endpoints REST de Clientes
  fastify.get('/', clientesController.listar)
  fastify.get('/:id', clientesController.obtenerPorId)
  fastify.post('/', clientesController.crear)
  fastify.put('/:id', clientesController.actualizar)
  fastify.delete('/:id', clientesController.eliminar) // Inactivación visual (Soft delete)
}

module.exports = clientesRoutes
