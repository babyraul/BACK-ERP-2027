'use strict'

const clientesService = require('../services/clientes.service')

/**
 * Controlador HTTP para Clientes
 */
const clientesController = {
  // GET /api/clientes
  async listar(request, reply) {
    try {
      const { q, tipo_documento_id, estado_credito, incluir_inactivos, limit, offset } = request.query
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)
      const soloActivos = incluir_inactivos !== 'true' && incluir_inactivos !== true

      // Límite defensivo de seguridad: default 200, máx 1000 clientes
      const safeLimit = limit !== undefined ? Math.min(Math.max(1, Number(limit) || 200), 1000) : 200
      const safeOffset = offset !== undefined ? Math.max(0, Number(offset) || 0) : 0

      const data = await clientesService.listarClientes({
        q,
        tipoDocumentoId: tipo_documento_id,
        estadoCredito: estado_credito,
        soloActivos,
        empresaId,
        esSuperAdmin,
        limit: safeLimit,
        offset: safeOffset
      })

      return reply.code(200).send({
        success: true,
        data,
        total: data.length,
        limit: safeLimit,
        offset: safeOffset
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/clientes/:id
  async obtenerPorId(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const cliente = await clientesService.obtenerClientePorId(id, { empresaId, esSuperAdmin })
      return reply.code(200).send({ success: true, data: cliente })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // POST /api/clientes
  async crear(request, reply) {
    try {
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const nuevoCliente = await clientesService.crearCliente(request.body, { empresaId, esSuperAdmin })
      return reply.code(201).send({
        success: true,
        message: 'Cliente registrado exitosamente',
        data: nuevoCliente
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // PUT /api/clientes/:id
  async actualizar(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const updated = await clientesService.actualizarCliente(id, request.body, { empresaId, esSuperAdmin })
      return reply.code(200).send({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: updated
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // DELETE /api/clientes/:id (Inactivación visual / Soft Delete)
  async eliminar(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const inactivado = await clientesService.inactivarCliente(id, { empresaId, esSuperAdmin })
      return reply.code(200).send({
        success: true,
        message: 'Cliente inactivado correctamente',
        data: inactivado
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  }
}

module.exports = clientesController
