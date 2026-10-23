'use strict'

const { db } = require('../../../db')
const empresasRepository = require('../repositories/empresas.repository')

/**
 * Servicio de Empresas y Configuración Multi-tenant
 */
const empresasService = {
  // Listar empresas
  async listarEmpresas({ empresaId, esSuperAdmin }) {
    return empresasRepository.getEmpresas({ empresaId, esSuperAdmin })
  },

  // Obtener una empresa por ID
  async obtenerPorId(id) {
    const empresa = await empresasRepository.getEmpresaById(id)
    if (!empresa) {
      const error = new Error('Empresa no encontrada')
      error.statusCode = 404
      throw error
    }
    return empresa
  },

  // Crear empresa en cascada (Empresa -> Sucursal Principal -> Almacén Principal)
  async crearEmpresaCascada(datosEmpresa) {
    if (!datosEmpresa.ruc || !datosEmpresa.razon_social) {
      const error = new Error('El RUC y la Razón Social son obligatorios.')
      error.statusCode = 400
      throw error
    }

    return db.transaction(async (tx) => {
      return empresasRepository.createEmpresaCascadaTx(tx, datosEmpresa)
    })
  },

  // Actualizar empresa
  async actualizarEmpresa(id, datos) {
    const updated = await empresasRepository.updateEmpresa(id, datos)
    if (!updated) {
      const error = new Error('Empresa no encontrada para actualizar')
      error.statusCode = 404
      throw error
    }
    return updated
  },

  // Eliminar empresa
  async eliminarEmpresa(id) {
    const deleted = await empresasRepository.deleteEmpresa(id)
    if (!deleted) {
      const error = new Error('Empresa no encontrada para eliminar')
      error.statusCode = 404
      throw error
    }
    return deleted
  },

  // Obtener array de IDs de módulos asignados a una empresa
  async obtenerModulos(empresaId) {
    return empresasRepository.getModulosByEmpresaId(empresaId)
  },

  // Asignar array de IDs de módulos a una empresa
  async asignarModulos(empresaId, modulosIds = []) {
    return db.transaction(async (tx) => {
      await empresasRepository.syncModulosEmpresaTx(tx, { empresaId, modulosIds })
    })
  }
}

module.exports = empresasService
