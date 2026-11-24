'use strict'

const notificacionesService = require('../services/notificaciones.service')

/**
 * Controlador HTTP para Notificaciones In-App
 */
const notificacionesController = {
  // GET /api/notificaciones
  async listar(request, reply) {
    try {
      const { leido, tipo, limit, offset } = request.query || {}
      const userId = request.user?.id
      const branchId = request.user?.branch_id

      const safeLimit = limit !== undefined ? Math.min(Math.max(1, Number(limit) || 50), 200) : 50
      const safeOffset = offset !== undefined ? Math.max(0, Number(offset) || 0) : 0

      const data = await notificacionesService.listar({
        userId,
        branchId,
        leido,
        tipo,
        limit: safeLimit,
        offset: safeOffset
      })

      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/notificaciones/resumen
  async resumen(request, reply) {
    try {
      const userId = request.user?.id
      const branchId = request.user?.branch_id

      const data = await notificacionesService.obtenerResumen({ userId, branchId })
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // POST /api/notificaciones/:id/marcar-leida
  async marcarLeida(request, reply) {
    try {
      const { id } = request.params
      const userId = request.user?.id
      const branchId = request.user?.branch_id

      const data = await notificacionesService.marcarLeida(id, { userId, branchId })
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // POST /api/notificaciones/marcar-todas-leidas
  async marcarTodasLeidas(request, reply) {
    try {
      const userId = request.user?.id
      const branchId = request.user?.branch_id

      const data = await notificacionesService.marcarTodasLeidas({ userId, branchId })
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  }
}

module.exports = notificacionesController
