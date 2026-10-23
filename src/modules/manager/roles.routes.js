'use strict'

const rolesController = require('./controllers/roles.controller')

/**
 * Rutas para Gestión de Roles y Asignación de Permisos
 * Sub-prefijo: /roles (montado bajo /api por gestion.routes)
 * Seguridad: Protegido por fastify.authorize (RBAC: roles.ver, roles.crear, roles.editar, roles.eliminar)
 */
async function rolesRoutes(fastify) {
  // Middleware Global para validar permisos automáticamente según la URL (ej. roles.ver)
  fastify.addHook('preHandler', fastify.authorize)

  // GET /roles
  fastify.get('/', rolesController.listar)

  // GET /roles/:id
  fastify.get('/:id', rolesController.obtenerPorId)

  // POST /roles
  fastify.post('/', rolesController.crear)

  // PUT /roles/:id
  fastify.put('/:id', rolesController.actualizar)

  // DELETE /roles/:id
  fastify.delete('/:id', rolesController.eliminar)

  // GET /roles/:id/permisos (Permiso roles.ver)
  fastify.get(
    '/:id/permisos',
    { config: { permission: 'roles.ver' } },
    rolesController.obtenerPermisos
  )

  // POST /roles/:id/permisos (Permiso roles.editar)
  fastify.post(
    '/:id/permisos',
    { config: { permission: 'roles.editar' } },
    rolesController.asignarPermisos
  )
}

module.exports = rolesRoutes
