'use strict'

const usuariosService = require('../services/usuarios.service')

/**
 * Controlador HTTP para Gestión de Usuarios y Accesos Multi-Tenant
 */
const usuariosController = {
  // GET /usuarios
  async listar(request, reply) {
    try {
      const empresaId = request.user?.empresa_id
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await usuariosService.listarUsuarios({ empresaId, rolNivel, esSuperAdmin })
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // GET /usuarios/:id
  async obtenerPorId(request, reply) {
    try {
      const data = await usuariosService.obtenerPorId(request.params.id)
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /usuarios
  async crear(request, reply) {
    try {
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await usuariosService.crearUsuario(request.body, { rolNivel, esSuperAdmin })
      return reply.code(201).send({ message: 'Usuario creado exitosamente', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        message: statusCode === 400 || statusCode === 403 ? error.message : 'Error al crear el usuario',
        error: error.message
      })
    }
  },

  // PUT /usuarios/:id
  async actualizar(request, reply) {
    try {
      const data = await usuariosService.actualizarUsuario(request.params.id, request.body)
      return reply.code(200).send({ message: 'Usuario actualizado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // DELETE /usuarios/:id (Inactivación visual / Soft delete)
  async eliminar(request, reply) {
    try {
      const data = await usuariosService.eliminarUsuario(request.params.id)
      return reply.code(200).send({ message: 'Usuario eliminado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // ==========================================
  // CONTROLADOR DE ACCESOS
  // ==========================================

  // GET /usuarios/:id/accesos
  async listarAccesos(request, reply) {
    try {
      const data = await usuariosService.listarAccesos(request.params.id)
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /usuarios/:id/accesos
  async crearAcceso(request, reply) {
    try {
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await usuariosService.crearAcceso(request.params.id, request.body, { rolNivel, esSuperAdmin })
      return reply.code(201).send({ message: 'Acceso asignado exitosamente', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // PUT /usuarios/:id/accesos/:accesoId
  async actualizarAcceso(request, reply) {
    try {
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await usuariosService.actualizarAcceso(
        request.params.id,
        request.params.accesoId,
        request.body,
        { rolNivel, esSuperAdmin }
      )
      return reply.code(200).send({ message: 'Acceso actualizado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // DELETE /usuarios/:id/accesos/:accesoId
  async eliminarAcceso(request, reply) {
    try {
      const rolNivel = request.user?.rol_nivel
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await usuariosService.eliminarAcceso(
        request.params.id,
        request.params.accesoId,
        { rolNivel, esSuperAdmin }
      )
      return reply.code(200).send({ message: 'Acceso removido', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  }
}

module.exports = usuariosController
