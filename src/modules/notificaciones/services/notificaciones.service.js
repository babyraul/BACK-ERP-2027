'use strict'

const crypto = require('crypto')
const notificacionesRepository = require('../repositories/notificaciones.repository')

/**
 * Servicio de Dominio para Notificaciones In-App
 */
const notificacionesService = {
  async listar({ userId, branchId, leido, tipo, limit = 50, offset = 0 }) {
    return notificacionesRepository.listar({ userId, branchId, leido, tipo, limit, offset })
  },

  async obtenerResumen({ userId, branchId }) {
    const [no_leidas, ultimas] = await Promise.all([
      notificacionesRepository.contarNoLeidas({ userId, branchId }),
      notificacionesRepository.obtenerUltimas({ userId, branchId, limit: 10 })
    ])

    return {
      no_leidas,
      ultimas
    }
  },

  async marcarLeida(id, { userId, branchId }) {
    const updated = await notificacionesRepository.marcarLeida(id, { userId, branchId })
    if (!updated) {
      const error = new Error('Notificación no encontrada')
      error.statusCode = 404
      throw error
    }
    return updated
  },

  async marcarTodasLeidas({ userId, branchId }) {
    const actualizadas = await notificacionesRepository.marcarTodasLeidas({ userId, branchId })
    return { actualizadas }
  },

  /**
   * Helper reutilizable para emitir notificaciones desde cualquier módulo del backend.
   */
  async crear({ branchId = null, usuarioId = null, titulo, mensaje, tipo = 'info' }) {
    if (!titulo || !mensaje) {
      const error = new Error('titulo y mensaje son obligatorios para crear una notificación')
      error.statusCode = 400
      throw error
    }

    return notificacionesRepository.crear({
      id: crypto.randomUUID(),
      branch_id: branchId,
      usuario_id: usuarioId,
      titulo: String(titulo).slice(0, 255),
      mensaje: String(mensaje),
      tipo: String(tipo || 'info').toLowerCase().slice(0, 50),
      leido: false
    })
  }
}

module.exports = notificacionesService
