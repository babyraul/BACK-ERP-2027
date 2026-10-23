'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, or, isNull, gt, and } = require('drizzle-orm')

/**
 * Repositorio de Roles y Permisos de Roles (Persistencia Drizzle ORM)
 */
const rolesRepository = {
  // Obtener roles aplicando RLS de empresa y jerarquía de niveles
  async getRoles({ empresaId, rolNivel, esSuperAdmin = false }) {
    let baseQuery = db.select().from(schema.roles)

    if (!esSuperAdmin) {
      const conditions = [
        or(
          eq(schema.roles.empresa_id, empresaId),
          isNull(schema.roles.empresa_id) // roles del sistema
        )
      ]

      // Jerarquía de roles: No puede ver roles de nivel igual o superior al suyo (menor o igual numéricamente)
      if (rolNivel !== undefined && rolNivel !== null) {
        conditions.push(gt(schema.roles.nivel, rolNivel))
      }

      baseQuery = baseQuery.where(and(...conditions))
    }

    return baseQuery
  },

  // Obtener un rol por su ID
  async getRolById(id) {
    const [rol] = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, id))
      .limit(1)
    return rol || null
  },

  // Crear nuevo rol
  async createRol(payload) {
    const [nuevo] = await db.insert(schema.roles).values(payload).returning()
    return nuevo
  },

  // Actualizar rol
  async updateRol(id, payload) {
    const [updated] = await db
      .update(schema.roles)
      .set(payload)
      .where(eq(schema.roles.id, id))
      .returning()
    return updated || null
  },

  // Inactivar rol (Baja lógica / Soft delete)
  async deleteRol(id) {
    const [inactivado] = await db
      .update(schema.roles)
      .set({
        activo: false,
        updated_at: new Date().toISOString()
      })
      .where(eq(schema.roles.id, id))
      .returning()
    return inactivado || null
  },

  // Obtener los IDs de permisos asignados a un rol
  async getPermisosByRolId(rolId) {
    const records = await db
      .select({ permiso_id: schema.rol_permisos.permiso_id })
      .from(schema.rol_permisos)
      .where(eq(schema.rol_permisos.rol_id, rolId))

    return records.map((r) => r.permiso_id)
  },

  // Sincronizar permisos de un rol dentro de una transacción atómica
  async syncPermisosRolTx(tx, { rolId, permisosIds = [] }) {
    // 1. Eliminar permisos actuales del rol
    await tx.delete(schema.rol_permisos).where(eq(schema.rol_permisos.rol_id, rolId))

    // 2. Insertar los nuevos permisos
    if (permisosIds && permisosIds.length > 0) {
      const insertData = permisosIds.map((permisoId) => ({
        rol_id: rolId,
        permiso_id: permisoId
      }))
      await tx.insert(schema.rol_permisos).values(insertData)
    }
  }
}

module.exports = rolesRepository
