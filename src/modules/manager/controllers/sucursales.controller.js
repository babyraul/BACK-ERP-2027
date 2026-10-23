'use strict'

const sucursalesService = require('../services/sucursales.service')

/**
 * Controlador HTTP para Gestión de Sucursales
 */
const sucursalesController = {
  // GET /sucursales
  async listar(request, reply) {
    try {
      const empresaId = request.user?.empresa_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await sucursalesService.listarSucursales({ empresaId, esSuperAdmin })
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // GET /sucursales/:id
  async obtenerPorId(request, reply) {
    try {
      const data = await sucursalesService.obtenerPorId(request.params.id)
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /sucursales
  async crear(request, reply) {
    try {
      const data = await sucursalesService.crearSucursal(request.body)
      return reply.code(201).send({ message: 'Registro creado exitosamente', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // PUT /sucursales/:id
  async actualizar(request, reply) {
    try {
      const data = await sucursalesService.actualizarSucursal(request.params.id, request.body)
      return reply.code(200).send({ message: 'Registro actualizado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // DELETE /sucursales/:id
  async eliminar(request, reply) {
    try {
      const data = await sucursalesService.eliminarSucursal(request.params.id)
      return reply.code(200).send({ message: 'Registro eliminado', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  }
}

module.exports = sucursalesController
