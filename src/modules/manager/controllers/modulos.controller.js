'use strict'

const modulosService = require('../services/modulos.service')

/**
 * Controlador HTTP para Gestión de Módulos y Permisos
 */
const modulosController = {
  // GET /modulos
  async listar(request, reply) {
    try {
      const data = await modulosService.listarModulosJerarquicos()
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // GET /modulos/:id
  async obtenerPorId(request, reply) {
    try {
      const data = await modulosService.obtenerPorId(request.params.id)
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /modulos
  async crear(request, reply) {
    try {
      const result = await modulosService.crearModulo(request.body)
      return reply.code(201).send({ message: 'Módulo creado exitosamente', data: result })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: 'Error al crear el módulo', error: error.message })
    }
  },

  // PUT /modulos/:id
  async actualizar(request, reply) {
    try {
      const data = await modulosService.actualizarModulo(request.params.id, request.body)
      return reply.code(200).send({ message: 'Módulo actualizado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // DELETE /modulos/:id
  async eliminar(request, reply) {
    try {
      const data = await modulosService.eliminarModulo(request.params.id)
      return reply.code(200).send({ message: 'Módulo eliminado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /modulos/sync-permisos
  async sincronizarPermisos(request, reply) {
    try {
      const { creados } = await modulosService.sincronizarPermisos()
      return reply.code(200).send({ message: `Sincronización completada. ${creados} permisos creados.` })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: 'Error al sincronizar permisos', error: error.message })
    }
  }
}

module.exports = modulosController
