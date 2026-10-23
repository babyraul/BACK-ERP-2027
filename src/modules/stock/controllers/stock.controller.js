'use strict'

const stockService = require('../services/stock.service')
const reinicioStockService = require('../services/reinicioStock.service')
const cargaMasivaService = require('../services/cargaMasiva.service')

/**
 * Controlador HTTP para el Módulo de Stock y Kárdex
 * Mapea las solicitudes Fastify (request/reply) hacia la capa de servicios.
 */
const stockController = {
  // GET /api/stock
  async getStock(request, reply) {
    try {
      const { almacen_id, categoria_id, estado_stock, q, activo } = request.query
      const empresaId = request.user?.empresa_id
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const result = await stockService.getStockList({
        almacenId: almacen_id,
        categoriaId: categoria_id,
        estadoStock: estado_stock,
        q,
        activo,
        empresaId,
        branchId,
        esSuperAdmin
      })

      return reply.code(200).send({
        success: true,
        data: result.filteredItems,
        almacenes: result.almacenes,
        resumen: result.resumen
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: statusCode === 400 ? error.message : ('Error al obtener control de stock: ' + error.message)
      })
    }
  },

  // GET /api/stock/kardex
  async getKardex(request, reply) {
    try {
      const {
        producto_id,
        presentacion_id,
        almacen_id,
        tipo_mov,
        fecha_inicio,
        fecha_fin
      } = request.query

      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const result = await stockService.getKardex({
        productoId: producto_id,
        presentacionId: presentacion_id,
        almacenId: almacen_id,
        tipoMov: tipo_mov,
        fechaInicio: fecha_inicio,
        fechaFin: fecha_fin,
        branchId,
        esSuperAdmin
      })

      return reply.code(200).send({
        success: true,
        data: result.movimientos,
        resumen: result.resumen
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: statusCode === 400 ? error.message : ('Error al consultar el Kárdex del producto: ' + error.message)
      })
    }
  },

  // POST /api/stock/ajuste
  async registrarAjuste(request, reply) {
    try {
      const {
        producto_id,
        presentacion_id,
        almacen_id,
        tipo_mov,
        cantidad,
        documento,
        concepto
      } = request.body || {}

      const branchId = request.user?.branch_id
      const usuarioId = request.user?.id
      const empresaId = request.user?.empresa_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const resultado = await stockService.registrarAjuste({
        productoId: producto_id,
        presentacionId: presentacion_id,
        almacenId: almacen_id,
        tipoMov: tipo_mov,
        cantidad,
        documento,
        concepto,
        branchId,
        usuarioId,
        empresaId,
        esSuperAdmin
      })

      return reply.code(201).send({
        success: true,
        message:
          resultado.tipoMovNum === 1
            ? 'Entrada de stock registrada correctamente'
            : 'Salida de stock registrada correctamente',
        data: resultado
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: statusCode === 400 ? error.message : ('Error al registrar movimiento de stock: ' + error.message)
      })
    }
  },

  // POST /api/stock/reiniciar-masivo
  async reiniciarMasivo(request, reply) {
    try {
      const { almacen_id, motivo, tipo_saldo = 'todos', incluir_combos = false } = request.body || {}
      const branchId = request.user?.branch_id
      const usuarioId = request.user?.id

      const resultado = await reinicioStockService.ejecutarReinicio({
        almacenId: almacen_id,
        motivo,
        tipoSaldo: tipo_saldo,
        incluirCombos: Boolean(incluir_combos),
        branchId,
        usuarioId
      })

      return reply.code(200).send({
        success: true,
        message: resultado.message,
        data: resultado
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: statusCode === 400 ? error.message : ('Error al reiniciar stock masivamente: ' + error.message)
      })
    }
  },

  // POST /api/stock/carga-masiva
  async cargaMasiva(request, reply) {
    try {
      const {
        almacen_id,
        modo = 'conteo_fisico',
        motivo,
        items = []
      } = request.body || {}

      const branchId = request.user?.branch_id
      const usuarioId = request.user?.id
      const empresaId = request.user?.empresa_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const resultado = await cargaMasivaService.procesarCargaMasiva({
        almacenId: almacen_id,
        modo,
        motivo,
        items,
        branchId,
        usuarioId,
        empresaId,
        esSuperAdmin
      })

      return reply.code(200).send({
        success: true,
        message: `Carga masiva completada exitosamente. Se actualizaron ${resultado.total_actualizados} productos.`,
        data: resultado
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: statusCode === 400 ? error.message : ('Error al procesar carga masiva de stock: ' + error.message)
      })
    }
  }
}

module.exports = stockController
