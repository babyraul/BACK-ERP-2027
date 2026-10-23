'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, asc } = require('drizzle-orm')

/**
 * Repositorio de Módulos del Sistema y Permisos Asociados
 */
const modulosRepository = {
  // Obtener todos los módulos
  async getAllModulos() {
    return db
      .select()
      .from(schema.modulos)
      .orderBy(asc(schema.modulos.orden))
  },

  // Obtener un módulo por su ID
  async getModuloById(id) {
    const [modulo] = await db
      .select()
      .from(schema.modulos)
      .where(eq(schema.modulos.id, id))
      .limit(1)
    return modulo || null
  },

  // Crear módulo dentro de una transacción
  async createModuloTx(tx, payload) {
    const [nuevoModulo] = await tx.insert(schema.modulos).values(payload).returning()
    return nuevoModulo
  },

  // Insertar permisos en lote
  async insertPermisosTx(tx, permisos) {
    if (!permisos || permisos.length === 0) return []
    return tx.insert(schema.permisos).values(permisos).returning()
  },

  // Actualizar módulo
  async updateModulo(id, payload) {
    const [updated] = await db
      .update(schema.modulos)
      .set(payload)
      .where(eq(schema.modulos.id, id))
      .returning()
    return updated || null
  },

  // Inactivar módulo (Baja lógica / Soft delete)
  async deleteModulo(id) {
    const [inactivado] = await db
      .update(schema.modulos)
      .set({
        activo: false,
        updated_at: new Date().toISOString()
      })
      .where(eq(schema.modulos.id, id))
      .returning()
    return inactivado || null
  },

  // Obtener módulos de tipo MENU dentro de transacción
  async getMenusTx(tx) {
    return tx
      .select()
      .from(schema.modulos)
      .where(eq(schema.modulos.tipo, 'MENU'))
  },

  // Obtener todos los permisos dentro de transacción
  async getAllPermisosTx(tx) {
    return tx.select().from(schema.permisos)
  },

  // Actualizar permiso dentro de transacción
  async updatePermisoTx(tx, id, payload) {
    return tx
      .update(schema.permisos)
      .set(payload)
      .where(eq(schema.permisos.id, id))
  }
}

module.exports = modulosRepository
