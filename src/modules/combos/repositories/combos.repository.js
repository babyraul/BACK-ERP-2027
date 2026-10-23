'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, ilike, desc, sql, inArray } = require('drizzle-orm')

/**
 * Repositorio de Combos Promocionales (Persistencia Drizzle ORM)
 */
const combosRepository = {
  // Obtener cabeceras de combos con filtros RLS
  async getCombosHeader({ q, activo, empresaId, esSuperAdmin = false }) {
    const conditions = [eq(schema.productos.es_combo, true)]

    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`))
    }

    if (activo !== undefined && activo !== '') {
      conditions.push(eq(schema.productos.activo, activo === 'true' || activo === true))
    }

    if (q && q.trim() !== '') {
      const search = `%${q.trim()}%`
      conditions.push(
        or(
          ilike(schema.productos.nombre, search),
          ilike(schema.productos.codigo_barra, search),
          ilike(schema.productos.codigo, search)
        )
      )
    }

    return db
      .select({
        id: schema.productos.id,
        IdCombo: schema.productos.id,
        codigo: schema.productos.codigo,
        nombre: schema.productos.nombre,
        Nombre: schema.productos.nombre,
        codigo_barra: schema.productos.codigo_barra,
        CodigoBarras: schema.productos.codigo_barra,
        descripcion: schema.productos.descripcion,
        activo: schema.productos.activo,
        Estado: sql`CASE WHEN ${schema.productos.activo} = true THEN 'Activo' ELSE 'Inactivo' END`,
        created_at: schema.productos.created_at,
        updated_at: schema.productos.updated_at
      })
      .from(schema.productos)
      .where(and(...conditions))
      .orderBy(desc(schema.productos.created_at))
  },

  // Obtener combo por ID
  async getComboById(id, { empresaId, esSuperAdmin = false }) {
    const conditions = [eq(schema.productos.id, id), eq(schema.productos.es_combo, true)]
    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`))
    }

    const [combo] = await db
      .select({
        id: schema.productos.id,
        IdCombo: schema.productos.id,
        codigo: schema.productos.codigo,
        nombre: schema.productos.nombre,
        Nombre: schema.productos.nombre,
        codigo_barra: schema.productos.codigo_barra,
        CodigoBarras: schema.productos.codigo_barra,
        descripcion: schema.productos.descripcion,
        activo: schema.productos.activo,
        Estado: sql`CASE WHEN ${schema.productos.activo} = true THEN 'Activo' ELSE 'Inactivo' END`,
        created_at: schema.productos.created_at,
        updated_at: schema.productos.updated_at
      })
      .from(schema.productos)
      .where(and(...conditions))
      .limit(1)

    return combo || null
  },

  // Obtener presentaciones de combos por IDs de productos
  async getPresentacionesByComboIds(comboIds) {
    if (!comboIds || comboIds.length === 0) return []
    return db
      .select()
      .from(schema.presentaciones)
      .where(inArray(schema.presentaciones.producto_uuid, comboIds))
  },

  // Obtener presentación principal de un combo
  async getPresentacionByComboId(comboId) {
    const [pres] = await db
      .select()
      .from(schema.presentaciones)
      .where(eq(schema.presentaciones.producto_uuid, comboId))
      .limit(1)
    return pres || null
  },

  // Obtener detalles enriquecidos de combos por IDs de presentaciones combo
  async getDetallesByPresComboIds(presComboIds) {
    if (!presComboIds || presComboIds.length === 0) return []
    return db
      .select({
        id: schema.combo_detalles.id,
        presentacion_combo_id: schema.combo_detalles.presentacion_combo_id,
        presentacion_componente_id: schema.combo_detalles.presentacion_componente_id,
        cantidad: schema.combo_detalles.cantidad,
        tipo_ajuste: schema.combo_detalles.tipo_ajuste,
        valor_ajuste: schema.combo_detalles.valor_ajuste,
        precio_final: schema.combo_detalles.precio_final,
        activo: schema.combo_detalles.activo,
        // Info de la presentación componente
        comp_nombre: schema.presentaciones.nombre,
        comp_producto_uuid: schema.presentaciones.producto_uuid,
        comp_precio_costo: schema.presentaciones.precio_costo,
        comp_precio_venta: schema.presentaciones.precio_venta,
        comp_multiplica_por: schema.presentaciones.multiplica_por,
        comp_unidad_medida_id: schema.presentaciones.unidad_medida_id,
        // Info del producto componente
        prod_nombre: schema.productos.nombre,
        prod_codigo: schema.productos.codigo,
        prod_codigo_barra: schema.productos.codigo_barra
      })
      .from(schema.combo_detalles)
      .leftJoin(
        schema.presentaciones,
        eq(schema.combo_detalles.presentacion_componente_id, schema.presentaciones.id)
      )
      .leftJoin(
        schema.productos,
        eq(schema.presentaciones.producto_uuid, schema.productos.id)
      )
      .where(
        and(
          inArray(schema.combo_detalles.presentacion_combo_id, presComboIds),
          eq(schema.combo_detalles.activo, true)
        )
      )
  },

  // Obtener stock actual de productos en sucursal
  async getStockActualPorProductos(productIds, branchId) {
    if (!productIds || productIds.length === 0) return []
    const conds = [inArray(schema.stock_actual.producto_id, productIds)]
    if (branchId) {
      conds.push(eq(schema.stock_actual.branch_id, branchId))
    }

    return db
      .select({
        producto_id: schema.stock_actual.producto_id,
        saldo_actual: schema.stock_actual.saldo_actual
      })
      .from(schema.stock_actual)
      .where(and(...conds))
  },

  // Validar código de barras duplicado
  async checkCodigoBarraDuplicado(codigoBarras, empresaId, excludeId = null) {
    if (!codigoBarras) return null
    const conditions = [
      eq(schema.productos.codigo_barra, codigoBarras),
      empresaId ? eq(schema.productos.empresa_id, empresaId) : sql`true`
    ]
    if (excludeId) {
      conditions.push(sql`${schema.productos.id} != ${excludeId}`)
    }

    const [existe] = await db
      .select({ id: schema.productos.id })
      .from(schema.productos)
      .where(and(...conditions))
      .limit(1)

    return existe || null
  },

  // Obtener presentación componente por ID
  async getPresentacionComponente(presId, tx = db) {
    const [pres] = await tx
      .select({
        id: schema.presentaciones.id,
        precio_costo: schema.presentaciones.precio_costo,
        precio_venta: schema.presentaciones.precio_venta
      })
      .from(schema.presentaciones)
      .where(eq(schema.presentaciones.id, presId))
      .limit(1)
    return pres || null
  },

  // Soft Delete / Inactivación visual de combo
  async inactivateCombo(id) {
    return db.transaction(async (tx) => {
      // Inactivar producto cabecera
      const [inactivado] = await tx
        .update(schema.productos)
        .set({ activo: false, updated_at: sql`NOW()` })
        .where(eq(schema.productos.id, id))
        .returning()

      // Inactivar presentaciones asociadas
      await tx
        .update(schema.presentaciones)
        .set({ activo: false, updated_at: sql`NOW()` })
        .where(eq(schema.presentaciones.producto_uuid, id))

      // Inactivar detalles de combos
      const presRows = await tx
        .select({ id: schema.presentaciones.id })
        .from(schema.presentaciones)
        .where(eq(schema.presentaciones.producto_uuid, id))

      const presIds = presRows.map((p) => p.id)
      if (presIds.length > 0) {
        await tx
          .update(schema.combo_detalles)
          .set({ activo: false, updated_at: sql`NOW()` })
          .where(inArray(schema.combo_detalles.presentacion_combo_id, presIds))
      }

      return inactivado
    })
  },

  // Cambiar estado activo/inactivo
  async updateEstado(id, nuevoActivo) {
    return db.transaction(async (tx) => {
      await tx
        .update(schema.productos)
        .set({ activo: nuevoActivo, updated_at: sql`NOW()` })
        .where(eq(schema.productos.id, id))

      await tx
        .update(schema.presentaciones)
        .set({ activo: nuevoActivo, updated_at: sql`NOW()` })
        .where(eq(schema.presentaciones.producto_uuid, id))
    })
  }
}

module.exports = combosRepository
