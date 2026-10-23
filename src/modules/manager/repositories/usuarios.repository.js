'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, ne, inArray } = require('drizzle-orm')

/**
 * Repositorio de Usuarios y Accesos Multi-Tenant (Persistencia Drizzle ORM)
 */
const usuariosRepository = {
  // Obtener todos los usuarios (para superadmin)
  async getAllUsuarios() {
    return db.select().from(schema.usuarios)
  },

  // Obtener accesos vinculados a una empresa
  async getAccesosByEmpresaId(empresaId) {
    return db
      .select({
        usuario_id: schema.usuario_accesos.usuario_id,
        rol_id: schema.usuario_accesos.rol_id
      })
      .from(schema.usuario_accesos)
      .where(eq(schema.usuario_accesos.empresa_id, empresaId))
  },

  // Obtener roles por lista de IDs
  async getRolesByIds(rolIds = []) {
    if (!rolIds.length) return []
    return db
      .select({ id: schema.roles.id, nivel: schema.roles.nivel })
      .from(schema.roles)
      .where(inArray(schema.roles.id, rolIds))
  },

  // Obtener usuarios por lista de IDs
  async getUsuariosByIds(userIds = []) {
    if (!userIds.length) return []
    return db
      .select()
      .from(schema.usuarios)
      .where(inArray(schema.usuarios.id, userIds))
  },

  // Obtener usuario por ID
  async getUsuarioById(id) {
    const [usuario] = await db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.id, id))
      .limit(1)
    return usuario || null
  },

  // Obtener usuario por nombre de usuario (para unicidad)
  async getUsuarioByUsername(username, excludeId = null) {
    let query = db.select().from(schema.usuarios).where(eq(schema.usuarios.usuario, username))
    if (excludeId) {
      query = db
        .select()
        .from(schema.usuarios)
        .where(and(eq(schema.usuarios.usuario, username), ne(schema.usuarios.id, excludeId)))
    }
    const [existing] = await query.limit(1)
    return existing || null
  },

  // Crear usuario con acceso inicial opcional dentro de una transacción
  async createUsuarioConAccesoTx(tx, { userPayload, accesoInicial }) {
    const [newUser] = await tx.insert(schema.usuarios).values(userPayload).returning()

    if (accesoInicial && accesoInicial.empresa_id && accesoInicial.branch_id && accesoInicial.rol_id) {
      await tx.insert(schema.usuario_accesos).values({
        usuario_id: newUser.id,
        empresa_id: accesoInicial.empresa_id,
        branch_id: accesoInicial.branch_id,
        rol_id: accesoInicial.rol_id,
        es_predeterminado: true,
        activo: true
      })
    }

    return newUser
  },

  // Actualizar datos de usuario
  async updateUsuario(id, payload) {
    const [updated] = await db
      .update(schema.usuarios)
      .set({ ...payload, updated_at: new Date().toISOString() })
      .where(eq(schema.usuarios.id, id))
      .returning()
    return updated || null
  },

  // Inactivar usuario (Soft delete)
  async deleteUsuario(id) {
    const [inactivado] = await db
      .update(schema.usuarios)
      .set({ activo: false, updated_at: new Date().toISOString() })
      .where(eq(schema.usuarios.id, id))
      .returning()
    return inactivado || null
  },

  // ==========================================
  // REPOSITORIO DE ACCESOS
  // ==========================================

  // Listar accesos de un usuario con joins
  async getAccesosByUsuarioId(userId) {
    return db
      .select({
        id: schema.usuario_accesos.id,
        empresa_id: schema.usuario_accesos.empresa_id,
        branch_id: schema.usuario_accesos.branch_id,
        rol_id: schema.usuario_accesos.rol_id,
        es_predeterminado: schema.usuario_accesos.es_predeterminado,
        activo: schema.usuario_accesos.activo,
        empresa_nombre: schema.empresas.razon_social,
        sucursal_nombre: schema.sucursales.sucursal_nombre,
        direccion: schema.sucursales.direccion,
        rol_nombre: schema.roles.nombre
      })
      .from(schema.usuario_accesos)
      .leftJoin(schema.empresas, eq(schema.usuario_accesos.empresa_id, schema.empresas.id))
      .leftJoin(schema.sucursales, eq(schema.usuario_accesos.branch_id, schema.sucursales.id))
      .leftJoin(schema.roles, eq(schema.usuario_accesos.rol_id, schema.roles.id))
      .where(eq(schema.usuario_accesos.usuario_id, userId))
  },

  // Obtener un acceso específico por ID
  async getAccesoById(accesoId) {
    const [acceso] = await db
      .select()
      .from(schema.usuario_accesos)
      .where(eq(schema.usuario_accesos.id, accesoId))
      .limit(1)
    return acceso || null
  },

  // Verificar si ya existe acceso a la misma sucursal
  async findAccesoPorSucursal(userId, branchId) {
    const [existing] = await db
      .select()
      .from(schema.usuario_accesos)
      .where(
        and(
          eq(schema.usuario_accesos.usuario_id, userId),
          eq(schema.usuario_accesos.branch_id, branchId)
        )
      )
      .limit(1)
    return existing || null
  },

  // Resetear flag es_predeterminado para los demás accesos del usuario
  async resetAccesosPredeterminados(userId) {
    return db
      .update(schema.usuario_accesos)
      .set({ es_predeterminado: false })
      .where(eq(schema.usuario_accesos.usuario_id, userId))
  },

  // Crear acceso
  async createAcceso(payload) {
    const [nuevo] = await db.insert(schema.usuario_accesos).values(payload).returning()
    return nuevo
  },

  // Actualizar acceso
  async updateAcceso(accesoId, payload) {
    const [updated] = await db
      .update(schema.usuario_accesos)
      .set({ ...payload, updated_at: new Date().toISOString() })
      .where(eq(schema.usuario_accesos.id, accesoId))
      .returning()
    return updated || null
  },

  // Inactivar acceso (Soft delete)
  async deleteAcceso(accesoId) {
    const [inactivado] = await db
      .update(schema.usuario_accesos)
      .set({ activo: false, updated_at: new Date().toISOString() })
      .where(eq(schema.usuario_accesos.id, accesoId))
      .returning()
    return inactivado || null
  }
}

module.exports = usuariosRepository
