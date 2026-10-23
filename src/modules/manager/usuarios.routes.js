'use strict'

const usuariosController = require('./controllers/usuarios.controller')

/**
 * Rutas para Gestión de Usuarios y Accesos Multi-Tenant
 * Sub-prefijo: /usuarios (montado bajo /api por gestion.routes o app.js)
 * Seguridad: Protegido por fastify.authorize (RBAC: usuarios.ver, usuarios.crear, usuarios.editar, usuarios.eliminar)
 */
async function usuariosRoutes(fastify) {
  // Middleware Global para validar permisos automáticamente según la URL (ej. usuarios.ver)
  fastify.addHook('preHandler', fastify.authorize)

  // 1. Endpoints principales de Usuarios
  fastify.get('/', usuariosController.listar)
  fastify.get('/:id', usuariosController.obtenerPorId)
  fastify.post('/', usuariosController.crear)
  fastify.put('/:id', usuariosController.actualizar)
  fastify.delete('/:id', usuariosController.eliminar) // Inactivación visual (Soft delete)

  // 2. Endpoints para Gestión de Accesos (Empresa + Sucursal + Rol)
  fastify.get(
    '/:id/accesos',
    { config: { permission: 'usuarios.ver' } },
    usuariosController.listarAccesos
  )

  fastify.post(
    '/:id/accesos',
    { config: { permission: 'usuarios.editar' } },
    usuariosController.crearAcceso
  )

  fastify.put(
    '/:id/accesos/:accesoId',
    { config: { permission: 'usuarios.editar' } },
    usuariosController.actualizarAcceso
  )

  fastify.delete(
    '/:id/accesos/:accesoId',
    { config: { permission: 'usuarios.editar' } },
    usuariosController.eliminarAcceso
  )
}

module.exports = usuariosRoutes
