'use strict'

const proveedoresRepository = require('../repositories/proveedores.repository')

/**
 * Servicio de Dominio para Gestión de Proveedores
 */
const proveedoresService = {
  // Listar proveedores con filtro y RLS
  async listarProveedores({ q, activo, empresaId, esSuperAdmin }) {
    return proveedoresRepository.getProveedores({ q, activo, empresaId, esSuperAdmin })
  },

  // Obtener proveedor por ID
  async obtenerPorId(id, { empresaId, esSuperAdmin }) {
    const proveedor = await proveedoresRepository.getProveedorById(id, { empresaId, esSuperAdmin })
    if (!proveedor) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }
    return proveedor
  },

  // Crear proveedor con validaciones de RUC y razón social
  async crearProveedor(payload, { empresaId, esSuperAdmin }) {
    const ruc = payload.ruc ? String(payload.ruc).trim() : ''
    const razonSocial = payload.razon_social ? String(payload.razon_social).trim() : ''

    if (!ruc || ruc.length !== 11) {
      const error = new Error('El RUC es obligatorio y debe tener exactamente 11 dígitos')
      error.statusCode = 400
      throw error
    }

    if (!razonSocial) {
      const error = new Error('La razón social es obligatoria')
      error.statusCode = 400
      throw error
    }

    const targetEmpresaId = payload.empresa_id || empresaId || null

    if (targetEmpresaId) {
      const existing = await proveedoresRepository.findProveedorByRuc(ruc, targetEmpresaId)
      if (existing) {
        const error = new Error(`Ya existe un proveedor registrado con el RUC ${ruc} en esta empresa`)
        error.statusCode = 400
        throw error
      }
    }

    const dataToInsert = {
      empresa_id: targetEmpresaId,
      ruc,
      razon_social: razonSocial,
      nombre_comercial: payload.nombre_comercial ? String(payload.nombre_comercial).trim() : null,
      direccion: payload.direccion ? String(payload.direccion).trim() : null,
      ubigeo: payload.ubigeo ? String(payload.ubigeo).trim() : null,
      email: payload.email ? String(payload.email).trim() : null,
      telefono: payload.telefono ? String(payload.telefono).trim() : null,
      persona_contacto: payload.persona_contacto ? String(payload.persona_contacto).trim() : null,
      es_mercaderia: payload.es_mercaderia === true || payload.es_mercaderia === 'true',
      es_servicio: payload.es_servicio === true || payload.es_servicio === 'true',
      es_activo: payload.es_activo === true || payload.es_activo === 'true',
      es_comisiones: payload.es_comisiones === true || payload.es_comisiones === 'true',
      activo: payload.activo !== undefined ? (payload.activo === true || payload.activo === 'true') : true
    }

    return proveedoresRepository.insertProveedor(dataToInsert)
  },

  // Actualizar proveedor
  async actualizarProveedor(id, payload, { empresaId, esSuperAdmin }) {
    const existing = await proveedoresRepository.getProveedorById(id, { empresaId, esSuperAdmin })
    if (!existing) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    const ruc = payload.ruc !== undefined ? String(payload.ruc).trim() : existing.ruc
    const razonSocial = payload.razon_social !== undefined ? String(payload.razon_social).trim() : existing.razon_social

    if (ruc && ruc.length !== 11) {
      const error = new Error('El RUC debe tener exactamente 11 dígitos')
      error.statusCode = 400
      throw error
    }

    if (!razonSocial) {
      const error = new Error('La razón social no puede quedar vacía')
      error.statusCode = 400
      throw error
    }

    const targetEmpresaId = existing.empresa_id
    if (ruc && ruc !== existing.ruc && targetEmpresaId) {
      const duplicate = await proveedoresRepository.findProveedorByRuc(ruc, targetEmpresaId, id)
      if (duplicate) {
        const error = new Error(`Ya existe otro proveedor registrado con el RUC ${ruc} en esta empresa`)
        error.statusCode = 400
        throw error
      }
    }

    const dataToUpdate = {
      ruc,
      razon_social: razonSocial,
      nombre_comercial: payload.nombre_comercial !== undefined ? (payload.nombre_comercial ? String(payload.nombre_comercial).trim() : null) : existing.nombre_comercial,
      direccion: payload.direccion !== undefined ? (payload.direccion ? String(payload.direccion).trim() : null) : existing.direccion,
      ubigeo: payload.ubigeo !== undefined ? (payload.ubigeo ? String(payload.ubigeo).trim() : null) : existing.ubigeo,
      email: payload.email !== undefined ? (payload.email ? String(payload.email).trim() : null) : existing.email,
      telefono: payload.telefono !== undefined ? (payload.telefono ? String(payload.telefono).trim() : null) : existing.telefono,
      persona_contacto: payload.persona_contacto !== undefined ? (payload.persona_contacto ? String(payload.persona_contacto).trim() : null) : existing.persona_contacto,
      es_mercaderia: payload.es_mercaderia !== undefined ? (payload.es_mercaderia === true || payload.es_mercaderia === 'true') : existing.es_mercaderia,
      es_servicio: payload.es_servicio !== undefined ? (payload.es_servicio === true || payload.es_servicio === 'true') : existing.es_servicio,
      es_activo: payload.es_activo !== undefined ? (payload.es_activo === true || payload.es_activo === 'true') : existing.es_activo,
      es_comisiones: payload.es_comisiones !== undefined ? (payload.es_comisiones === true || payload.es_comisiones === 'true') : existing.es_comisiones,
      activo: payload.activo !== undefined ? (payload.activo === true || payload.activo === 'true') : existing.activo
    }

    return proveedoresRepository.updateProveedor(id, dataToUpdate)
  },

  // Inactivar proveedor (Soft delete / Baja lógica)
  async eliminarProveedor(id, { empresaId, esSuperAdmin }) {
    const existing = await proveedoresRepository.getProveedorById(id, { empresaId, esSuperAdmin })
    if (!existing) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    return proveedoresRepository.deleteProveedor(id)
  }
}

module.exports = proveedoresService
