'use strict'

const empresasController = require('./controllers/empresas.controller')

/**
 * Rutas para Gestión de Empresas y Asignación de Módulos
 * Sub-prefijo: /empresas (montado bajo /api por gestion.routes)
 * Seguridad: Protegido por fastify.authorize (RBAC: empresas.ver, empresas.crear, etc.)
 */
async function empresasRoutes(fastify) {
  // Middleware Global para validar permisos automáticamente según la URL (ej. empresas.ver)
  fastify.addHook('preHandler', fastify.authorize)

  // GET /empresas (Requiere empresas.ver)
  fastify.get('/', empresasController.listar)

  // GET /empresas/:id (Requiere empresas.ver)
  fastify.get('/:id', empresasController.obtenerPorId)

  // POST /empresas (Requiere empresas.crear) - Creación en cascada Empresa -> Sucursal -> Almacén
  fastify.post('/', empresasController.crear)

  // PUT /empresas/:id (Requiere empresas.editar)
  fastify.put('/:id', empresasController.actualizar)

  // DELETE /empresas/:id (Requiere empresas.eliminar)
  fastify.delete('/:id', empresasController.eliminar)

  // GET /empresas/:id/modulos (Requiere empresas.modulos)
  fastify.get(
    '/:id/modulos',
    { config: { permission: 'empresas.modulos' } },
    empresasController.obtenerModulos
  )

  // POST /empresas/:id/modulos (Requiere empresas.modulos)
  fastify.post(
    '/:id/modulos',
    { config: { permission: 'empresas.modulos' } },
    empresasController.asignarModulos
  )

  // GET /empresas/:id/configuraciones (Requiere empresas.editar o empresas.modulos)
  fastify.get(
    '/:id/configuraciones',
    { config: { permission: ['empresas.editar', 'empresas.modulos'] } },
    empresasController.obtenerConfiguraciones
  )

  // POST /empresas/:id/configuraciones (Requiere empresas.editar o empresas.modulos)
  fastify.post(
    '/:id/configuraciones',
    { config: { permission: ['empresas.editar', 'empresas.modulos'] } },
    empresasController.asignarConfiguraciones
  )
}

module.exports = empresasRoutes
