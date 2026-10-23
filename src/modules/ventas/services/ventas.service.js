'use strict'

const ventasRepository = require('../repositories/ventas.repository')
const registrarVentaService = require('./registrarVenta.service')
const anularVentaService = require('./anularVenta.service')
const { getFactores, toVolumenVisual } = require('../../../utils/factores')

/**
 * Servicio de Dominio para Gestión y Consulta de Ventas
 */
const ventasService = {
  // Listar ventas con filtros y RLS por sucursal
  async listarVentas({ fechaInicio, fechaFin, estado, tipoDocumento, q, branchId, esSuperAdmin }) {
    const { factorPrecio } = await getFactores()
    return ventasRepository.getVentas({
      fechaInicio,
      fechaFin,
      estado,
      tipoDocumento,
      q,
      branchId,
      esSuperAdmin,
      factorPrecio
    })
  },

  // Obtener detalle completo de venta por ID (ítems, pagos y combos)
  async obtenerVentaPorId(id) {
    const { factorPrecio, factorVolumen } = await getFactores()

    const venta = await ventasRepository.getVentaById(id, factorPrecio)
    if (!venta) {
      const error = new Error('Venta no encontrada')
      error.statusCode = 404
      throw error
    }

    const rawItems = await ventasRepository.getDetalleVenta(id, factorPrecio)
    const detalleVentaIds = rawItems.map((it) => it.id).filter(Boolean)

    const comboDetallesVentaMap = await ventasRepository.getComboDetallesByVentaDetalleIds(detalleVentaIds, {
      factorPrecio,
      factorVolumen
    })

    const items = rawItems.map((it) => {
      const unidad = it.presentacion_unidad_medida_id || it.producto_unidad_medida_id || 'NIU'
      return {
        ...it,
        unidad_medida_id: unidad,
        cantidad: toVolumenVisual(it.cantidad, factorVolumen),
        cantidad_raw: Number(it.cantidad || 0),
        combo_detalles: comboDetallesVentaMap[it.id] || []
      }
    })

    const pagos = await ventasRepository.getPagosByVentaId(id, factorPrecio)

    return {
      ...venta,
      items,
      detalles: items,
      pagos
    }
  },

  // Delegar registro transaccional de venta
  async registrarVenta(payload, { branchId, usuarioId }) {
    return registrarVentaService.procesarVenta(payload, { branchId, usuarioId })
  },

  // Delegar anulación y reversión transaccional de venta
  async anularVenta(id, { motivo, usuarioId }) {
    return anularVentaService.anularVenta(id, { motivo, usuarioId })
  }
}

module.exports = ventasService
