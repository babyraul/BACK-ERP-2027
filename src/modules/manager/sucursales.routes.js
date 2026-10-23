'use strict'

const sucursalesController = require('./controllers/sucursales.controller')

/**
 * Rutas para Gestión de Sucursales
 * Sub-prefijo: /sucursales (montado bajo /api por gestion.routes)
 * Seguridad: Protegido por fastify.authorize (RBAC: sucursales.ver, sucursales.crear, sucursales.editar, sucursales.eliminar)
 */
async function sucursalesRoutes(fastify) {
  // Middleware Global para validar permisos automáticamente según la URL (ej. sucursales.ver)
  fastify.addHook('preHandler', fastify.authorize)

  // GET /sucursales
  fastify.get('/', sucursalesController.listar)

  // GET /sucursales/:id
  fastify.get('/:id', sucursalesController.obtenerPorId)

  // POST /sucursales
  fastify.post('/', sucursalesController.crear)

  // PUT /sucursales/:id
  fastify.put('/:id', sucursalesController.actualizar)

  // DELETE /sucursales/:id
  fastify.delete('/:id', sucursalesController.eliminar)
}

module.exports = sucursalesRoutes
