'use strict'

const clientesRepository = require('../repositories/clientes.repository')

/**
 * Servicio de Dominio para Gestión y Crédito de Clientes
 */
const clientesService = {
  // Listar clientes con cálculo de saldo disponible y formateo de montos
  async listarClientes({ q, tipoDocumentoId, estadoCredito, soloActivos, empresaId, esSuperAdmin, limit, offset }) {
    const data = await clientesRepository.getClientes({
      q,
      tipoDocumentoId,
      estadoCredito,
      soloActivos,
      empresaId,
      esSuperAdmin,
      limit,
      offset
    })

    return data.map((c) => ({
      ...c,
      limite_credito: Number(c.limite_credito_int || 0) / 100,
      saldo_utilizado: Number(c.saldo_utilizado_int || 0) / 100,
      saldo_disponible: (Number(c.limite_credito_int || 0) - Number(c.saldo_utilizado_int || 0)) / 100
    }))
  },

  // Obtener detalle de cliente por ID
  async obtenerClientePorId(id, { empresaId, esSuperAdmin }) {
    const cliente = await clientesRepository.getClienteById(id, { empresaId, esSuperAdmin })
    if (!cliente) {
      const error = new Error('Cliente no encontrado')
      error.statusCode = 404
      throw error
    }

    return {
      ...cliente,
      limite_credito: Number(cliente.limite_credito_int || 0) / 100,
      saldo_utilizado: Number(cliente.saldo_utilizado_int || 0) / 100,
      saldo_disponible: (Number(cliente.limite_credito_int || 0) - Number(cliente.saldo_utilizado_int || 0)) / 100
    }
  },

  // Crear cliente con validación de documento y conversión a enteros
  async crearCliente(payload, { empresaId, esSuperAdmin }) {
    const tipoDoc = payload.tipo_documento_id ? String(payload.tipo_documento_id).trim() : '1'
    const numDoc = payload.numero_documento ? String(payload.numero_documento).trim() : ''
    const nombre = payload.nombre_razon_social ? String(payload.nombre_razon_social).trim() : ''

    if (!numDoc) {
      const error = new Error('El número de documento es obligatorio.')
      error.statusCode = 400
      throw error
    }
    if (!nombre) {
      const error = new Error('El nombre o razón social es obligatorio.')
      error.statusCode = 400
      throw error
    }

    // Validar duplicado
    const existing = await clientesRepository.findByDocumento(tipoDoc, numDoc)
    if (existing) {
      const error = new Error(`Ya existe un cliente registrado con el documento ${numDoc}`)
      error.statusCode = 400
      throw error
    }

    const targetEmpresaId = !esSuperAdmin && empresaId ? empresaId : payload.empresa_id || null

    // Convertir límite de crédito si viene en decimal a céntimos (x100)
    const limiteCreditoInt = payload.limite_credito !== undefined
      ? Math.round(Number(payload.limite_credito || 0) * 100)
      : Math.round(Number(payload.limite_credito_int || 0))

    const insertData = {
      tipo_documento_id: tipoDoc,
      numero_documento: numDoc,
      nombre_razon_social: nombre,
      direccion_1: payload.direccion_1 ? String(payload.direccion_1).trim() : null,
      direccion_2: payload.direccion_2 ? String(payload.direccion_2).trim() : null,
      direccion_3: payload.direccion_3 ? String(payload.direccion_3).trim() : null,
      email_1: payload.email_1 ? String(payload.email_1).trim() : null,
      email_2: payload.email_2 ? String(payload.email_2).trim() : null,
      email_3: payload.email_3 ? String(payload.email_3).trim() : null,
      telefono_1: payload.telefono_1 ? String(payload.telefono_1).trim() : null,
      telefono_2: payload.telefono_2 ? String(payload.telefono_2).trim() : null,
      telefono_3: payload.telefono_3 ? String(payload.telefono_3).trim() : null,
      empresa_id: targetEmpresaId,
      limite_credito_int: limiteCreditoInt || 0,
      saldo_utilizado_int: 0,
      dias_credito_pactado: Number(payload.dias_credito_pactado) || 30,
      cantidad_cuotas: Number(payload.cantidad_cuotas) || 1,
      estado_credito: payload.estado_credito || 'NORMAL',
      sincronizado: false
    }

    return clientesRepository.insertCliente(insertData)
  },

  // Actualizar cliente
  async actualizarCliente(id, payload, { empresaId, esSuperAdmin }) {
    const existing = await clientesRepository.getClienteById(id, { empresaId, esSuperAdmin })
    if (!existing) {
      const error = new Error('Cliente no encontrado')
      error.statusCode = 404
      throw error
    }

    const tipoDoc = payload.tipo_documento_id !== undefined ? String(payload.tipo_documento_id).trim() : existing.tipo_documento_id
    const numDoc = payload.numero_documento !== undefined ? String(payload.numero_documento).trim() : existing.numero_documento

    // Si cambia el documento, verificar duplicados
    if (tipoDoc !== existing.tipo_documento_id || numDoc !== existing.numero_documento) {
      const duplicate = await clientesRepository.findByDocumento(tipoDoc, numDoc, id)
      if (duplicate) {
        const error = new Error(`Ya existe otro cliente con el documento ${numDoc}`)
        error.statusCode = 400
        throw error
      }
    }

    const updateData = {
      ...(payload.tipo_documento_id !== undefined && { tipo_documento_id: tipoDoc }),
      ...(payload.numero_documento !== undefined && { numero_documento: numDoc }),
      ...(payload.nombre_razon_social !== undefined && { nombre_razon_social: String(payload.nombre_razon_social).trim() }),
      ...(payload.direccion_1 !== undefined && { direccion_1: payload.direccion_1 ? String(payload.direccion_1).trim() : null }),
      ...(payload.direccion_2 !== undefined && { direccion_2: payload.direccion_2 ? String(payload.direccion_2).trim() : null }),
      ...(payload.direccion_3 !== undefined && { direccion_3: payload.direccion_3 ? String(payload.direccion_3).trim() : null }),
      ...(payload.email_1 !== undefined && { email_1: payload.email_1 ? String(payload.email_1).trim() : null }),
      ...(payload.email_2 !== undefined && { email_2: payload.email_2 ? String(payload.email_2).trim() : null }),
      ...(payload.email_3 !== undefined && { email_3: payload.email_3 ? String(payload.email_3).trim() : null }),
      ...(payload.telefono_1 !== undefined && { telefono_1: payload.telefono_1 ? String(payload.telefono_1).trim() : null }),
      ...(payload.telefono_2 !== undefined && { telefono_2: payload.telefono_2 ? String(payload.telefono_2).trim() : null }),
      ...(payload.telefono_3 !== undefined && { telefono_3: payload.telefono_3 ? String(payload.telefono_3).trim() : null }),
      ...(payload.limite_credito !== undefined && { limite_credito_int: Math.round(Number(payload.limite_credito || 0) * 100) }),
      ...(payload.dias_credito_pactado !== undefined && { dias_credito_pactado: Number(payload.dias_credito_pactado) }),
      ...(payload.cantidad_cuotas !== undefined && { cantidad_cuotas: Number(payload.cantidad_cuotas) }),
      ...(payload.estado_credito !== undefined && { estado_credito: String(payload.estado_credito).trim() })
    }

    return clientesRepository.updateCliente(id, updateData)
  },

  // Inactivación visual (Soft Delete) - Regla de negocio del ERP: NO DELETE físico
  async inactivarCliente(id, { empresaId, esSuperAdmin }) {
    const existing = await clientesRepository.getClienteById(id, { empresaId, esSuperAdmin })
    if (!existing) {
      const error = new Error('Cliente no encontrado')
      error.statusCode = 404
      throw error
    }

    return clientesRepository.inactivateCliente(id)
  }
}

module.exports = clientesService
