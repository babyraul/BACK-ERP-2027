'use strict'

const preventasService = require('../services/preventas.service')

/**
 * Controlador HTTP para Pre-Ventas
 */
const preventasController = {
  // GET /api/preventas
  async listar(request, reply) {
    try {
      const { fecha_inicio, fecha_fin, estado, q } = request.query
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const preventas = await preventasService.listarPreventas({
        fechaInicio: fecha_inicio,
        fechaFin: fecha_fin,
        estado,
        q,
        branchId,
        esSuperAdmin
      })

      return reply.code(200).send({ success: true, data: preventas, total: preventas.length })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: 'Error al consultar preventas: ' + error.message })
    }
  },

  // GET /api/preventas/:id
  async obtenerPorId(request, reply) {
    try {
      const { id } = request.params
      const data = await preventasService.obtenerPreventaPorId(id)

      return reply.code(200).send({
        success: true,
        data
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message || 'Error al consultar detalle de preventa' })
    }
  },

  // POST /api/preventas
  async crear(request, reply) {
    try {
      const branchId = request.user?.branch_id
      const usuarioId = request.user?.id

      const result = await preventasService.crearPreventa(request.body, { branchId, usuarioId })

      return reply.code(201).send({
        success: true,
        message: 'Pre-venta registrada exitosamente',
        data: {
          id: result.id,
          codigo: `PRE-${String(result.id).slice(0, 8)}`,
          ...result
        }
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message || 'Error al registrar pre-venta' })
    }
  },

  // PUT /api/preventas/:id
  async actualizar(request, reply) {
    try {
      const { id } = request.params
      const result = await preventasService.actualizarPreventa(id, request.body)

      return reply.code(200).send({
        success: true,
        message: 'Pre-venta actualizada correctamente',
        data: result
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: 'Error al actualizar pre-venta: ' + (error.message || 'Error interno del servidor')
      })
    }
  },

  // DELETE /api/preventas/:id (Soft delete / Anulación)
  async anular(request, reply) {
    try {
      const { id } = request.params
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const result = await preventasService.anularPreventa(id, { branchId, esSuperAdmin })

      return reply.code(200).send({
        success: true,
        message: 'Pre-venta anulada correctamente',
        data: result
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: 'Error al anular la pre-venta: ' + error.message
      })
    }
  }
}

module.exports = preventasController
