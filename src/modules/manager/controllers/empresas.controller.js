'use strict'

const empresasService = require('../services/empresas.service')

/**
 * Controlador HTTP para Gestión de Empresas
 */
const empresasController = {
  // GET /empresas
  async listar(request, reply) {
    try {
      const empresaId = request.user?.empresa_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await empresasService.listarEmpresas({ empresaId, esSuperAdmin })
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // GET /empresas/:id
  async obtenerPorId(request, reply) {
    try {
      const data = await empresasService.obtenerPorId(request.params.id)
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /empresas
  async crear(request, reply) {
    try {
      const result = await empresasService.crearEmpresaCascada(request.body)
      return reply.code(201).send({
        message: 'Empresa, Sucursal y Almacén creados correctamente',
        data: result.empresa
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        message: 'Error al crear la empresa en cascada',
        error: error.message
      })
    }
  },

  // PUT /empresas/:id
  async actualizar(request, reply) {
    try {
      const data = await empresasService.actualizarEmpresa(request.params.id, request.body)
      return reply.code(200).send({ message: 'Empresa actualizada', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // DELETE /empresas/:id
  async eliminar(request, reply) {
    try {
      const data = await empresasService.eliminarEmpresa(request.params.id)
      return reply.code(200).send({ message: 'Empresa eliminada', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // GET /empresas/:id/modulos
  async obtenerModulos(request, reply) {
    try {
      const data = await empresasService.obtenerModulos(request.params.id)
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ message: error.message })
    }
  },

  // POST /empresas/:id/modulos
  async asignarModulos(request, reply) {
    try {
      const { modulosIds } = request.body || {}
      await empresasService.asignarModulos(request.params.id, modulosIds)
      return reply.code(200).send({ message: 'Módulos asignados correctamente' })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        message: 'Error al asignar módulos a la empresa',
        error: error.message
      })
    }
  }
}

module.exports = empresasController
