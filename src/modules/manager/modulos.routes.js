'use strict'

const modulosController = require('./controllers/modulos.controller')

/**
 * Rutas para Gestión de Módulos del Sistema y Árbol de Permisos
 * Sub-prefijo: /modulos (montado bajo /api por gestion.routes)
 * Seguridad: Protegido por autenticación JWT y validación RBAC específica
 */
async function modulosRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate)

  // Hooks de autorización específicos
  const requireSuperAdmin = async (request, reply) => {
    if (!request.user.es_super_admin) {
      return reply.code(403).send({ message: 'Acceso restringido a super administradores.' })
    }
  }

  const requireRolesVer = async (request, reply) => {
    if (!request.user.es_super_admin && (!request.user.permisos || !request.user.permisos.includes('roles.ver'))) {
      return reply.code(403).send({ message: 'Acceso restringido a administradores de roles.' })
    }
  }

  // GET /modulos (Lectura del árbol para asignar permisos en roles)
  fastify.get('/', { preHandler: requireRolesVer }, modulosController.listar)

  // GET /modulos/:id
  fastify.get('/:id', { preHandler: requireSuperAdmin }, modulosController.obtenerPorId)

  // POST /modulos (Crea módulo y genera permisos automáticos si es MENU)
  fastify.post('/', { preHandler: requireSuperAdmin }, modulosController.crear)

  // PUT /modulos/:id
  fastify.put('/:id', { preHandler: requireSuperAdmin }, modulosController.actualizar)

  // DELETE /modulos/:id
  fastify.delete('/:id', { preHandler: requireSuperAdmin }, modulosController.eliminar)

  // POST /modulos/sync-permisos (Backfill de permisos CRUD para menús)
  fastify.post('/sync-permisos', { preHandler: requireSuperAdmin }, modulosController.sincronizarPermisos)
}

module.exports = modulosRoutes
