'use strict'

const { db } = require('../../../db')
const modulosRepository = require('../repositories/modulos.repository')

/**
 * Servicio de Dominio para Módulos y Autogeneración de Permisos
 */
const modulosService = {
  // Listar módulos con ordenamiento jerárquico (Padres primero según orden, seguidos de sus hijos)
  async listarModulosJerarquicos() {
    const rawData = await modulosRepository.getAllModulos()

    const parents = rawData.filter((m) => !m.padre_id).sort((a, b) => (a.orden || 0) - (b.orden || 0))
    const children = rawData.filter((m) => m.padre_id).sort((a, b) => (a.orden || 0) - (b.orden || 0))

    const sortedData = []
    parents.forEach((p) => {
      sortedData.push(p)
      sortedData.push(...children.filter((c) => c.padre_id === p.id))
    })

    // Asegurar hijos con padres inexistentes o huérfanos
    const assignedIds = new Set(sortedData.map((d) => d.id))
    children.forEach((c) => {
      if (!assignedIds.has(c.id)) sortedData.push(c)
    })

    return sortedData
  },

  // Obtener un módulo por ID
  async obtenerPorId(id) {
    const modulo = await modulosRepository.getModuloById(id)
    if (!modulo) {
      const error = new Error('Módulo no encontrado')
      error.statusCode = 404
      throw error
    }
    return modulo
  },

  // Crear módulo con autogeneración de permisos CRUD si es de tipo MENU
  async crearModulo(payload) {
    return db.transaction(async (tx) => {
      const nuevoModulo = await modulosRepository.createModuloTx(tx, payload)

      if (nuevoModulo.tipo === 'MENU') {
        const acciones = ['ver', 'crear', 'editar', 'eliminar']
        const permisosBase = acciones.map((accion) => {
          const verb = accion === 'eliminar' ? 'Inactivar' : accion.charAt(0).toUpperCase() + accion.slice(1)
          return {
            modulo_id: nuevoModulo.id,
            codigo: `${nuevoModulo.codigo.toLowerCase()}.${accion}`,
            nombre: `${verb} ${nuevoModulo.nombre.toLowerCase()}`,
            descripcion: `Permiso para ${verb.toLowerCase()} en ${nuevoModulo.nombre}`
          }
        })

        await modulosRepository.insertPermisosTx(tx, permisosBase)
      }

      return nuevoModulo
    })
  },

  // Actualizar módulo
  async actualizarModulo(id, payload) {
    const updated = await modulosRepository.updateModulo(id, payload)
    if (!updated) {
      const error = new Error('Módulo no encontrado para actualizar')
      error.statusCode = 404
      throw error
    }
    return updated
  },

  // Eliminar módulo
  async eliminarModulo(id) {
    const deleted = await modulosRepository.deleteModulo(id)
    if (!deleted) {
      const error = new Error('Módulo no encontrado para eliminar')
      error.statusCode = 404
      throw error
    }
    return deleted
  },

  // Sincronizador de permisos base para menús existentes (Backfill de permisos)
  async sincronizarPermisos() {
    return db.transaction(async (tx) => {
      let creados = 0
      const menus = await modulosRepository.getMenusTx(tx)
      const permisosActuales = await modulosRepository.getAllPermisosTx(tx)

      for (const menu of menus) {
        const acciones = ['ver', 'crear', 'editar', 'eliminar']
        for (const accion of acciones) {
          const codigoBuscado = `${menu.codigo.toLowerCase()}.${accion}`
          const existe = permisosActuales.find((p) => p.codigo === codigoBuscado)

          const verb = accion === 'eliminar' ? 'Inactivar' : accion.charAt(0).toUpperCase() + accion.slice(1)
          const nombreGenerado = `${verb} ${menu.nombre.toLowerCase()}`

          if (!existe) {
            await modulosRepository.insertPermisosTx(tx, [
              {
                modulo_id: menu.id,
                codigo: codigoBuscado,
                nombre: nombreGenerado,
                descripcion: `Permiso automático de sincronización para ${verb.toLowerCase()}`
              }
            ])
            creados++
          } else if (accion === 'eliminar' && existe.nombre.startsWith('Eliminar')) {
            await modulosRepository.updatePermisoTx(tx, existe.id, {
              nombre: nombreGenerado,
              descripcion: `Permiso automático de sincronización para ${verb.toLowerCase()}`
            })
          }
        }
      }

      return { creados }
    })
  }
}

module.exports = modulosService
