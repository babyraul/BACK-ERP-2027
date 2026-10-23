'use strict'

const { db } = require('../../../db')
const rolesRepository = require('../repositories/roles.repository')

/**
 * Servicio de Dominio para Roles y Asignación de Permisos
 * Aplica reglas estrictas de jerarquía de niveles numéricos (regla de inversión: menor número = mayor rango)
 */
const rolesService = {
  // Listar roles visibles para el usuario autenticado
  async listarRoles({ empresaId, rolNivel, esSuperAdmin }) {
    return rolesRepository.getRoles({ empresaId, rolNivel, esSuperAdmin })
  },

  // Obtener rol por ID
  async obtenerPorId(id) {
    const rol = await rolesRepository.getRolById(id)
    if (!rol) {
      const error = new Error('Rol no encontrado')
      error.statusCode = 404
      throw error
    }
    return rol
  },

  // Crear nuevo rol con validación de jerarquía
  async crearRol(payload, { rolNivel, esSuperAdmin }) {
    if (!esSuperAdmin && rolNivel !== undefined && rolNivel !== null) {
      if (payload.nivel !== undefined && payload.nivel <= rolNivel) {
        const error = new Error('No puedes crear un rol con un nivel igual o superior al tuyo.')
        error.statusCode = 403
        throw error
      }
    }
    return rolesRepository.createRol(payload)
  },

  // Actualizar rol con validación de jerarquía (nivel actual y nuevo nivel)
  async actualizarRol(id, payload, { rolNivel, esSuperAdmin }) {
    const existing = await rolesRepository.getRolById(id)
    if (!existing) {
      const error = new Error('Rol no encontrado')
      error.statusCode = 404
      throw error
    }

    if (!esSuperAdmin && rolNivel !== undefined && rolNivel !== null) {
      if (existing.nivel <= rolNivel) {
        const error = new Error('No puedes modificar un rol de nivel igual o superior al tuyo.')
        error.statusCode = 403
        throw error
      }
      if (payload.nivel !== undefined && payload.nivel <= rolNivel) {
        const error = new Error('No puedes asignar un nivel igual o superior al tuyo.')
        error.statusCode = 403
        throw error
      }
    }

    return rolesRepository.updateRol(id, payload)
  },

  // Eliminar rol con validación de jerarquía
  async eliminarRol(id, { rolNivel, esSuperAdmin }) {
    const existing = await rolesRepository.getRolById(id)
    if (!existing) {
      const error = new Error('Rol no encontrado')
      error.statusCode = 404
      throw error
    }

    if (!esSuperAdmin && rolNivel !== undefined && rolNivel !== null) {
      if (existing.nivel <= rolNivel) {
        const error = new Error('No puedes eliminar un rol de nivel igual o superior al tuyo.')
        error.statusCode = 403
        throw error
      }
    }

    return rolesRepository.deleteRol(id)
  },

  // Obtener array de IDs de permisos asignados al rol
  async obtenerPermisos(rolId) {
    return rolesRepository.getPermisosByRolId(rolId)
  },

  // Asignar array de IDs de permisos al rol con validación de jerarquía
  async asignarPermisos(rolId, permisosIds = [], { rolNivel, esSuperAdmin }) {
    const existing = await rolesRepository.getRolById(rolId)
    if (!existing) {
      const error = new Error('Rol no encontrado')
      error.statusCode = 404
      throw error
    }

    if (!esSuperAdmin && rolNivel !== undefined && rolNivel !== null) {
      if (existing.nivel <= rolNivel) {
        const error = new Error('No puedes modificar los permisos de un rol de nivel igual o superior al tuyo.')
        error.statusCode = 403
        throw error
      }
    }

    return db.transaction(async (tx) => {
      await rolesRepository.syncPermisosRolTx(tx, { rolId, permisosIds })
    })
  }
}

module.exports = rolesService
