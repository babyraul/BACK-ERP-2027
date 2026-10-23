'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq } = require('drizzle-orm')

/**
 * Repositorio de Empresas y Asignación de Módulos
 */
const empresasRepository = {
  // Obtener empresas con su descripción de ubigeo (aplica RLS para no-superadmin)
  async getEmpresas({ empresaId, esSuperAdmin = false }) {
    let baseQuery = db
      .select({
        empresa: schema.empresas,
        ubigeo: schema.ubigeo
      })
      .from(schema.empresas)
      .leftJoin(schema.ubigeo, eq(schema.empresas.ubigeo, schema.ubigeo.codigo))

    // Row-Level Security (RLS)
    if (!esSuperAdmin && empresaId) {
      baseQuery = baseQuery.where(eq(schema.empresas.id, empresaId))
    }

    const rawData = await baseQuery

    return rawData.map((row) => ({
      ...row.empresa,
      ubigeo_descripcion: row.ubigeo
        ? `${row.ubigeo.departamento}, ${row.ubigeo.provincia}, ${row.ubigeo.distrito}`
        : null
    }))
  },

  // Obtener una empresa por ID
  async getEmpresaById(id) {
    const [empresa] = await db
      .select()
      .from(schema.empresas)
      .where(eq(schema.empresas.id, id))
      .limit(1)
    return empresa || null
  },

  // Creación en cascada dentro de transacción: Empresa -> Sucursal Principal -> Almacén Principal
  async createEmpresaCascadaTx(tx, datosEmpresa) {
    // 1. Crear Empresa
    const [nuevaEmpresa] = await tx
      .insert(schema.empresas)
      .values({
        ruc: datosEmpresa.ruc,
        razon_social: datosEmpresa.razon_social,
        nombre_comercial: datosEmpresa.nombre_comercial,
        direccion: datosEmpresa.direccion,
        ubigeo: datosEmpresa.ubigeo,
        telefono1: datosEmpresa.telefono1,
        email1: datosEmpresa.email1
      })
      .returning()

    // 2. Crear Sucursal Principal
    const [nuevaSucursal] = await tx
      .insert(schema.sucursales)
      .values({
        empresa_id: nuevaEmpresa.id,
        ruc: nuevaEmpresa.ruc,
        razon_social: nuevaEmpresa.razon_social,
        nombre_comercial: nuevaEmpresa.nombre_comercial,
        sucursal_nombre: 'SEDE PRINCIPAL',
        codigo_anexo: '0000',
        direccion: nuevaEmpresa.direccion,
        ubigeo: nuevaEmpresa.ubigeo
      })
      .returning()

    // 3. Crear Almacén Principal
    const [nuevoAlmacen] = await tx
      .insert(schema.almacenes)
      .values({
        branch_id: nuevaSucursal.id,
        nombre: 'ALMACÉN PRINCIPAL',
        direccion: nuevaSucursal.direccion,
        es_principal: true
      })
      .returning()

    return {
      empresa: nuevaEmpresa,
      sucursal: nuevaSucursal,
      almacen: nuevoAlmacen
    }
  },

  // Actualizar empresa
  async updateEmpresa(id, datos) {
    const [updated] = await db
      .update(schema.empresas)
      .set(datos)
      .where(eq(schema.empresas.id, id))
      .returning()
    return updated || null
  },

  // Inactivar empresa (Baja lógica / Soft delete)
  async deleteEmpresa(id) {
    const [inactivado] = await db
      .update(schema.empresas)
      .set({
        activo: false,
        updated_at: new Date().toISOString()
      })
      .where(eq(schema.empresas.id, id))
      .returning()
    return inactivado || null
  },

  // Obtener módulos asignados a una empresa
  async getModulosByEmpresaId(empresaId) {
    const records = await db
      .select({ modulo_id: schema.empresa_modulos.modulo_id })
      .from(schema.empresa_modulos)
      .where(eq(schema.empresa_modulos.empresa_id, empresaId))

    return records.map((r) => r.modulo_id)
  },

  // Asignar módulos a una empresa de forma atómica
  async syncModulosEmpresaTx(tx, { empresaId, modulosIds = [] }) {
    // 1. Eliminar módulos actuales de la empresa
    await tx.delete(schema.empresa_modulos).where(eq(schema.empresa_modulos.empresa_id, empresaId))

    // 2. Insertar los nuevos módulos
    if (modulosIds && modulosIds.length > 0) {
      const insertData = modulosIds.map((moduloId) => ({
        empresa_id: empresaId,
        modulo_id: moduloId,
        activo: true
      }))
      await tx.insert(schema.empresa_modulos).values(insertData)
    }
  }
}

module.exports = empresasRepository
