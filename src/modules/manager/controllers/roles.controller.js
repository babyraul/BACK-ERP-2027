'use strict'

const rolesService = require('../services/roles.service')

/**
 * Controlador HTTP para Gestión de Roles y Permisos
 */
const rolesController = {
  // GET /roles
  async listar(request, reply) {
    try {
      const empresaId = request.user?.empresa_id
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await rolesService.listarRoles({ empresaId, rolNivel, esSuperAdmin })
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // GET /roles/:id
  async obtenerPorId(request, reply) {
    try {
      const data = await rolesService.obtenerPorId(request.params.id)
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /roles
  async crear(request, reply) {
    try {
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await rolesService.crearRol(request.body, { rolNivel, esSuperAdmin })
      return reply.code(201).send({ message: 'Rol creado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // PUT /roles/:id
  async actualizar(request, reply) {
    try {
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await rolesService.actualizarRol(request.params.id, request.body, { rolNivel, esSuperAdmin })
      return reply.code(200).send({ message: 'Rol actualizado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // DELETE /roles/:id
  async eliminar(request, reply) {
    try {
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await rolesService.eliminarRol(request.params.id, { rolNivel, esSuperAdmin })
      return reply.code(200).send({ message: 'Rol eliminado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // GET /roles/:id/permisos
  async obtenerPermisos(request, reply) {
    try {
      const data = await rolesService.obtenerPermisos(request.params.id)
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /roles/:id/permisos
  async asignarPermisos(request, reply) {
    try {
      const { permisosIds } = request.body || {}
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      await rolesService.asignarPermisos(request.params.id, permisosIds, { rolNivel, esSuperAdmin })
      return reply.code(200).send({ message: 'Permisos asignados correctamente al rol' })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        message: 'Error al asignar permisos al rol',
        error: error.message
      })
    }
  }
}

module.exports = rolesController
