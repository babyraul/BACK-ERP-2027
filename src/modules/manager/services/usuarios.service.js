'use strict'

const { db } = require('../../../db')
const usuariosRepository = require('../repositories/usuarios.repository')
const rolesRepository = require('../repositories/roles.repository')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

/**
 * Servicio de Dominio para Gestión de Usuarios y Accesos
 * Controla la jerarquía de roles, hashing de contraseñas y soft deletes.
 */
const usuariosService = {
  // Listar usuarios visibles con filtro de empresa y jerarquía de niveles
  async listarUsuarios({ empresaId, rolNivel, esSuperAdmin }) {
    if (esSuperAdmin) {
      const data = await usuariosRepository.getAllUsuarios()
      return data.map(({ password, ...rest }) => rest)
    }

    if (!empresaId) return []

    // 1. Encontrar todos los usuarios vinculados a la empresa
    const accesos = await usuariosRepository.getAccesosByEmpresaId(empresaId)

    // 2. Extraer roles para determinar niveles
    const rolIds = [...new Set(accesos.map((a) => a.rol_id).filter(Boolean))]
    const rolesData = await usuariosRepository.getRolesByIds(rolIds)

    const rolNivelMap = {}
    rolesData.forEach((r) => {
      rolNivelMap[r.id] = r.nivel
    })

    // 3. Agrupar el mejor nivel (mínimo número) de cada usuario
    const userMinLevel = {}
    for (const acc of accesos) {
      if (!acc.rol_id) continue
      const nivel = rolNivelMap[acc.rol_id] ?? 999
      if (!userMinLevel[acc.usuario_id] || nivel < userMinLevel[acc.usuario_id]) {
        userMinLevel[acc.usuario_id] = nivel
      }
    }

    // 4. Filtrar usuarios: solo aquellos cuyo rol sea estrictamente INFERIOR al nuestro (mayor número)
    let userIds = []
    if (rolNivel !== undefined && rolNivel !== null) {
      userIds = Object.keys(userMinLevel).filter((uid) => userMinLevel[uid] > rolNivel)
    } else {
      userIds = Object.keys(userMinLevel)
    }

    if (!userIds.length) return []

    const data = await usuariosRepository.getUsuariosByIds(userIds)
    return data.map(({ password, ...rest }) => rest)
  },

  // Obtener usuario por ID (sin password)
  async obtenerPorId(id) {
    const data = await usuariosRepository.getUsuarioById(id)
    if (!data) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }
    const { password, ...safeData } = data
    return safeData
  },

  // Crear usuario con validación de unicidad, hash de password y acceso inicial
  async crearUsuario(body, { rolNivel, esSuperAdmin }) {
    const { empresa_id, branch_id, rol_id, ...userPayload } = body

    // 1. Validar unicidad de username
    const existing = await usuariosRepository.getUsuarioByUsername(userPayload.usuario)
    if (existing) {
      const error = new Error('El nombre de usuario ya está en uso.')
      error.statusCode = 400
      throw error
    }

    // 2. Hash de contraseña
    if (!userPayload.password) {
      const error = new Error('La contraseña es obligatoria para un usuario nuevo.')
      error.statusCode = 400
      throw error
    }
    userPayload.password = await bcrypt.hash(userPayload.password, 10)

    if (!userPayload.current_session_id) {
      userPayload.current_session_id = crypto.randomUUID()
    }

    // 3. Validación de Jerarquía para el acceso inicial
    if (rol_id) {
      const targetRol = await rolesRepository.getRolById(rol_id)
      if (!targetRol) {
        const error = new Error('Rol inválido.')
        error.statusCode = 400
        throw error
      }
      if (!esSuperAdmin && rolNivel !== undefined && rolNivel !== null) {
        if (targetRol.nivel <= rolNivel) {
          const error = new Error('No puedes asignar un rol de nivel igual o superior al tuyo.')
          error.statusCode = 403
          throw error
        }
      }
    }

    // 4. Creación atómica
    const result = await db.transaction(async (tx) => {
      const accesoInicial =
        empresa_id && branch_id && rol_id ? { empresa_id, branch_id, rol_id } : null
      return usuariosRepository.createUsuarioConAccesoTx(tx, {
        userPayload,
        accesoInicial
      })
    })

    const { password, ...safeData } = result
    return safeData
  },

  // Actualizar usuario
  async actualizarUsuario(id, body) {
    const { empresa_id, branch_id, rol_id, ...payload } = body

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10)
    } else {
      delete payload.password
    }

    if (payload.usuario) {
      const existing = await usuariosRepository.getUsuarioByUsername(payload.usuario, id)
      if (existing) {
        const error = new Error('El nombre de usuario ya está en uso por otra persona.')
        error.statusCode = 400
        throw error
      }
    }

    const data = await usuariosRepository.updateUsuario(id, payload)
    if (!data) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    const { password, ...safeData } = data
    return safeData
  },

  // Inactivar usuario (Soft delete / Baja lógica)
  async eliminarUsuario(id) {
    const data = await usuariosRepository.deleteUsuario(id)
    if (!data) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }
    const { password, ...safeData } = data
    return safeData
  },

  // ==========================================
  // SERVICIOS PARA ACCESOS
  // ==========================================

  // Listar accesos de un usuario
  async listarAccesos(userId) {
    return usuariosRepository.getAccesosByUsuarioId(userId)
  },

  // Crear un nuevo acceso con validación de jerarquía y unicidad por sucursal
  async crearAcceso(userId, body, { rolNivel, esSuperAdmin }) {
    const payload = { ...body, usuario_id: userId }

    // 1. Verificar si ya tiene un acceso para esa misma sucursal
    const existing = await usuariosRepository.findAccesoPorSucursal(userId, payload.branch_id)
    if (existing) {
      const error = new Error('El usuario ya tiene un acceso configurado para esta sucursal.')
      error.statusCode = 400
      throw error
    }

    // 2. Validación de Jerarquía
    if (!esSuperAdmin && rolNivel !== undefined && rolNivel !== null) {
      const targetRol = await rolesRepository.getRolById(payload.rol_id)
      if (!targetRol) {
        const error = new Error('Rol inválido.')
        error.statusCode = 400
        throw error
      }
      if (targetRol.nivel <= rolNivel) {
        const error = new Error('No puedes asignar un rol de nivel igual o superior al tuyo.')
        error.statusCode = 403
        throw error
      }
    }

    // 3. Si es predeterminado, desmarcar los demás
    if (payload.es_predeterminado) {
      await usuariosRepository.resetAccesosPredeterminados(userId)
    }

    return usuariosRepository.createAcceso(payload)
  },

  // Actualizar un acceso existente con validación de jerarquía
  async actualizarAcceso(userId, accesoId, payload, { rolNivel, esSuperAdmin }) {
    const accesoActual = await usuariosRepository.getAccesoById(accesoId)
    if (!accesoActual) {
      const error = new Error('Acceso no encontrado.')
      error.statusCode = 404
      throw error
    }

    // Validación de Jerarquía
    if (!esSuperAdmin && rolNivel !== undefined && rolNivel !== null) {
      const rolActual = await rolesRepository.getRolById(accesoActual.rol_id)
      if (rolActual && rolActual.nivel <= rolNivel) {
        const error = new Error('No puedes modificar un acceso que tiene un rol de nivel igual o superior al tuyo.')
        error.statusCode = 403
        throw error
      }

      if (payload.rol_id && payload.rol_id !== accesoActual.rol_id) {
        const nuevoRol = await rolesRepository.getRolById(payload.rol_id)
        if (nuevoRol && nuevoRol.nivel <= rolNivel) {
          const error = new Error('No puedes asignar un rol de nivel igual o superior al tuyo.')
          error.statusCode = 403
          throw error
        }
      }
    }

    // Si se marca como predeterminado, desmarcar los demás
    if (payload.es_predeterminado) {
      await usuariosRepository.resetAccesosPredeterminados(userId)
    }

    return usuariosRepository.updateAcceso(accesoId, payload)
  },

  // Inactivar acceso (Soft delete)
  async eliminarAcceso(userId, accesoId, { rolNivel, esSuperAdmin }) {
    const accesoActual = await usuariosRepository.getAccesoById(accesoId)
    if (!accesoActual) {
      const error = new Error('Acceso no encontrado.')
      error.statusCode = 404
      throw error
    }

    // Validación de Jerarquía
    if (!esSuperAdmin && rolNivel !== undefined && rolNivel !== null) {
      const rolActual = await rolesRepository.getRolById(accesoActual.rol_id)
      if (rolActual && rolActual.nivel <= rolNivel) {
        const error = new Error('No puedes eliminar un acceso de nivel igual o superior al tuyo.')
        error.statusCode = 403
        throw error
      }
    }

    return usuariosRepository.deleteAcceso(accesoId)
  }
}

module.exports = usuariosService
