'use strict'

const ventasService = require('../services/ventas.service')

/**
 * Controlador HTTP para Ventas
 */
const ventasController = {
  // GET /api/ventas
  async listar(request, reply) {
    try {
      const { fecha_inicio, fecha_fin, estado, tipo_documento, q, limit, offset } = request.query
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      // Límite defensivo de seguridad: default 200, máximo 500 por consulta
      const safeLimit = limit !== undefined ? Math.min(Math.max(1, Number(limit) || 200), 500) : 200
      const safeOffset = offset !== undefined ? Math.max(0, Number(offset) || 0) : 0

      const ventas = await ventasService.listarVentas({
        fechaInicio: fecha_inicio,
        fechaFin: fecha_fin,
        estado,
        tipoDocumento: tipo_documento,
        q,
        branchId,
        esSuperAdmin,
        limit: safeLimit,
        offset: safeOffset
      })

      return reply.code(200).send({
        success: true,
        data: ventas,
        total: ventas.length,
        limit: safeLimit,
        offset: safeOffset
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: 'Error al listar ventas: ' + error.message })
    }
  },

  // GET /api/ventas/:id
  async obtenerPorId(request, reply) {
    try {
      const { id } = request.params
      const data = await ventasService.obtenerVentaPorId(id)

      return reply.code(200).send({
        success: true,
        data
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message || 'Error al consultar venta' })
    }
  },

  // POST /api/ventas
  async crear(request, reply) {
    try {
      const branchId = request.user?.branch_id
      const usuarioId = request.user?.id

      const ventaRegistrada = await ventasService.registrarVenta(request.body, { branchId, usuarioId })

      return reply.code(201).send({
        success: true,
        message: 'Venta registrada y comprobante emitido exitosamente',
        data: ventaRegistrada
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message || 'Error al procesar venta' })
    }
  },

  // POST /api/ventas/:id/anular
  async anular(request, reply) {
    try {
      const { id } = request.params
      const { motivo } = request.body || {}
      const usuarioId = request.user?.id

      const venta = await ventasService.anularVenta(id, { motivo, usuarioId })

      return reply.code(200).send({
        success: true,
        message: `Venta ${venta.serie}-${venta.correlativo} anulada correctamente`
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message || 'Error al anular venta' })
    }
  }
}

module.exports = ventasController
