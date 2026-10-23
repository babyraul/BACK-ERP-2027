'use strict'

const combosService = require('../services/combos.service')

/**
 * Controlador HTTP para Combos Promocionales
 */
const combosController = {
  // GET /api/combos
  async listar(request, reply) {
    try {
      const { q, activo, limit, offset } = request.query
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      // Límite defensivo de seguridad: default 200, máx 1000 combos
      const safeLimit = limit !== undefined ? Math.min(Math.max(1, Number(limit) || 200), 1000) : 200
      const safeOffset = offset !== undefined ? Math.max(0, Number(offset) || 0) : 0

      const result = await combosService.listarCombos({
        q,
        activo,
        empresaId,
        branchId,
        esSuperAdmin,
        limit: safeLimit,
        offset: safeOffset
      })

      return reply.code(200).send(result)
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: 'No se pudo obtener el listado de combos.',
        error: error.message
      })
    }
  },

  // GET /api/combos/:id
  async obtenerPorId(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const result = await combosService.obtenerComboPorId(id, {
        empresaId,
        branchId,
        esSuperAdmin
      })

      return reply.code(200).send(result)
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: error.message || 'No se puede obtener información en este momento.',
        error: error.message
      })
    }
  },

  // POST /api/combos
  async crear(request, reply) {
    try {
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const result = await combosService.crearCombo(request.body, { empresaId, esSuperAdmin })

      return reply.code(201).send({
        success: true,
        message: 'Se guardaron los cambios correctamente.',
        data: result
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: error.message || 'No se pudo registrar el combo. Inténtalo otra vez.',
        error: error.message
      })
    }
  },

  // PUT /api/combos/:id
  async actualizar(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      await combosService.actualizarCombo(id, request.body, { empresaId, esSuperAdmin })

      return reply.code(200).send({
        success: true,
        message: 'Se guardaron los cambios correctamente.'
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: error.message || 'No se pudo registrar el combo. Inténtalo otra vez.',
        error: error.message
      })
    }
  },

  // PATCH /api/combos/:id (Activar / Desactivar)
  async toggleEstado(request, reply) {
    try {
      const { id } = request.params
      const { Estado, activo } = request.body || {}
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      await combosService.toggleEstado(id, { estado: Estado, activo }, { empresaId, esSuperAdmin })

      return reply.code(200).send({
        success: true,
        message: 'Se actualizó correctamente el combo.'
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: 'Error al cambiar estado del combo: ' + error.message
      })
    }
  },

  // DELETE /api/combos/:id (Soft Delete / Inactivación)
  async eliminar(request, reply) {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      await combosService.inactivarCombo(id, { empresaId, esSuperAdmin })

      return reply.code(200).send({
        success: true,
        message: 'Se eliminó correctamente.'
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: 'Error al eliminar el combo: ' + error.message
      })
    }
  }
}

module.exports = combosController
