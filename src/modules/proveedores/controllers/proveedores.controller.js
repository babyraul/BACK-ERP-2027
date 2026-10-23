'use strict'

const proveedoresService = require('../services/proveedores.service')

/**
 * Controlador HTTP para el Módulo de Proveedores
 */
const proveedoresController = {
  // GET /api/proveedores
  async listar(request, reply) {
    try {
      const { q, activo, limit, offset } = request.query
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      // Límite defensivo de seguridad: default 200, máx 1000 proveedores
      const safeLimit = limit !== undefined ? Math.min(Math.max(1, Number(limit) || 200), 1000) : 200
      const safeOffset = offset !== undefined ? Math.max(0, Number(offset) || 0) : 0

      const data = await proveedoresService.listarProveedores({
        q,
        activo,
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
      return reply.code(statusCode).send({
        success: false,
        message: 'Error al listar proveedores: ' + error.message
      })
    }
  },

  // GET /api/proveedores/:id
  async obtenerPorId(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await proveedoresService.obtenerPorId(id, { empresaId, esSuperAdmin })
      return reply.code(200).send({
        success: true,
        data
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: error.message
      })
    }
  },

  // POST /api/proveedores
  async crear(request, reply) {
    try {
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await proveedoresService.crearProveedor(request.body, { empresaId, esSuperAdmin })
      return reply.code(201).send({
        success: true,
        message: 'Proveedor creado exitosamente',
        data
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: error.message
      })
    }
  },

  // PUT /api/proveedores/:id
  async actualizar(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await proveedoresService.actualizarProveedor(id, request.body, { empresaId, esSuperAdmin })
      return reply.code(200).send({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: error.message
      })
    }
  },

  // DELETE /api/proveedores/:id (Soft delete / Baja lógica)
  async eliminar(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await proveedoresService.eliminarProveedor(id, { empresaId, esSuperAdmin })
      return reply.code(200).send({
        success: true,
        message: 'Proveedor inactivado exitosamente',
        data
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: error.message
      })
    }
  }
}

module.exports = proveedoresController
