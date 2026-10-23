'use strict'

const sucursalesRepository = require('../repositories/sucursales.repository')

/**
 * Servicio de Dominio para Sucursales
 */
const sucursalesService = {
  // Listar sucursales aplicando RLS
  async listarSucursales({ empresaId, esSuperAdmin }) {
    return sucursalesRepository.getSucursales({ empresaId, esSuperAdmin })
  },

  // Obtener sucursal por ID
  async obtenerPorId(id) {
    const sucursal = await sucursalesRepository.getSucursalById(id)
    if (!sucursal) {
      const error = new Error('Registro no encontrado')
      error.statusCode = 404
      throw error
    }
    return sucursal
  },

  // Crear sucursal
  async crearSucursal(payload) {
    return sucursalesRepository.createSucursal(payload)
  },

  // Actualizar sucursal
  async actualizarSucursal(id, payload) {
    const existing = await sucursalesRepository.getSucursalById(id)
    if (!existing) {
      const error = new Error('Registro no encontrado')
      error.statusCode = 404
      throw error
    }
    return sucursalesRepository.updateSucursal(id, payload)
  },

  // Eliminar sucursal
  async eliminarSucursal(id) {
    const existing = await sucursalesRepository.getSucursalById(id)
    if (!existing) {
      const error = new Error('Registro no encontrado')
      error.statusCode = 404
      throw error
    }
    return sucursalesRepository.deleteSucursal(id)
  }
}

module.exports = sucursalesService
