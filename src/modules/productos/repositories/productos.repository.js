'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, ilike, desc, sql, inArray } = require('drizzle-orm')

/**
 * Repositorio de Productos, Presentaciones y Kárdex (Persistencia Drizzle ORM)
 */
const productosRepository = {
  // Obtener catálogo de productos con joins a categorías, subcategorías y unidades
  async getProductos({ q, categoriaId, activo, empresaId, esSuperAdmin = false, limit, offset }) {
    const conditions = []

    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`))
    }

    if (activo !== undefined) {
      conditions.push(eq(schema.productos.activo, activo === 'true' || activo === true))
    }

    if (categoriaId) {
      conditions.push(eq(schema.productos.categoria, categoriaId))
    }

    if (q && q.trim() !== '') {
      const search = `%${q.trim()}%`
      conditions.push(
        or(
          ilike(schema.productos.nombre, search),
          ilike(schema.productos.codigo, search),
          ilike(schema.productos.codigo_barra, search),
          ilike(schema.productos.palabra_clave, search)
        )
      )
    }

    let query = db
      .select({
        id: schema.productos.id,
        codigo: schema.productos.codigo,
        nombre: schema.productos.nombre,
        descripcion: schema.productos.descripcion,
        codigo_barra: schema.productos.codigo_barra,
        palabra_clave: schema.productos.palabra_clave,
        codigo_sunat: schema.productos.codigo_sunat,
        unidad_medida_id: schema.productos.unidad_medida_id,
        es_facturable: schema.productos.es_facturable,
        es_vendible: schema.productos.es_vendible,
        es_insumo: schema.productos.es_insumo,
        es_producido: schema.productos.es_producido,
        es_combo: schema.productos.es_combo,
        activo: schema.productos.activo,
        stock_minimo: schema.productos.stock_minimo,
        categoria_id: schema.productos.categoria,
        sub_categoria_id: schema.productos.sub_categoria,
        tipo_existencia_id: schema.productos.tipo_existencia,
        tipo_tributo_id: schema.productos.tipo_tributo,
        empresa_id: schema.productos.empresa_id,
        created_at: schema.productos.created_at,
        updated_at: schema.productos.updated_at,
        categoria_nombre: schema.categorias.nombre,
        sub_categoria_nombre: schema.subcategoria.Nombre,
        unidad_medida_descripcion: schema.tipo_unidades_medida.descripcion
      })
      .from(schema.productos)
      .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))
      .leftJoin(schema.subcategoria, eq(schema.productos.sub_categoria, schema.subcategoria.id))
      .leftJoin(schema.tipo_unidades_medida, eq(schema.productos.unidad_medida_id, schema.tipo_unidades_medida.codigo))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    query = query.orderBy(desc(schema.productos.created_at))

    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.offset(offset)
    }

    return query
  },

  // Obtener producto único por ID con sus joins
  async getProductoById(id) {
    const [producto] = await db
      .select({
        id: schema.productos.id,
        codigo: schema.productos.codigo,
        nombre: schema.productos.nombre,
        descripcion: schema.productos.descripcion,
        codigo_barra: schema.productos.codigo_barra,
        palabra_clave: schema.productos.palabra_clave,
        codigo_sunat: schema.productos.codigo_sunat,
        unidad_medida_id: schema.productos.unidad_medida_id,
        es_facturable: schema.productos.es_facturable,
        es_vendible: schema.productos.es_vendible,
        es_insumo: schema.productos.es_insumo,
        es_producido: schema.productos.es_producido,
        es_combo: schema.productos.es_combo,
        activo: schema.productos.activo,
        stock_minimo: schema.productos.stock_minimo,
        categoria_id: schema.productos.categoria,
        sub_categoria_id: schema.productos.sub_categoria,
        tipo_existencia_id: schema.productos.tipo_existencia,
        tipo_tributo_id: schema.productos.tipo_tributo,
        empresa_id: schema.productos.empresa_id,
        created_at: schema.productos.created_at,
        updated_at: schema.productos.updated_at,
        categoria_nombre: schema.categorias.nombre,
        sub_categoria_nombre: schema.subcategoria.Nombre,
        unidad_medida_descripcion: schema.tipo_unidades_medida.descripcion
      })
      .from(schema.productos)
      .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))
      .leftJoin(schema.subcategoria, eq(schema.productos.sub_categoria, schema.subcategoria.id))
      .leftJoin(schema.tipo_unidades_medida, eq(schema.productos.unidad_medida_id, schema.tipo_unidades_medida.codigo))
      .where(eq(schema.productos.id, id))
      .limit(1)

    return producto || null
  },

  // Obtener unidades de medida (mapa de descripciones)
  async getUnidadesMedidaMap() {
    const rows = await db
      .select({
        codigo: schema.tipo_unidades_medida.codigo,
        descripcion: schema.tipo_unidades_medida.descripcion
      })
      .from(schema.tipo_unidades_medida)

    const map = {}
    rows.forEach((u) => {
      if (u.codigo) map[u.codigo] = u.descripcion
    })
    return map
  },

  // Obtener presentaciones por lista de IDs de producto
  async getPresentacionesByProdIds(prodIds = []) {
    if (!prodIds.length) return []
    return db
      .select()
      .from(schema.presentaciones)
      .where(inArray(schema.presentaciones.producto_uuid, prodIds))
  },

  // Obtener stock_actual por lista de IDs de producto y sucursal
  async getStockActualByProdIds(prodIds = [], branchId = null) {
    if (!prodIds.length) return []
    const stockConds = [inArray(schema.stock_actual.producto_id, prodIds)]
    if (branchId) {
      stockConds.push(eq(schema.stock_actual.branch_id, branchId))
    }
    return db
      .select()
      .from(schema.stock_actual)
      .where(and(...stockConds))
  },

  // Obtener componentes de combo_detalles por presentaciones de combo
  async getComboDetallesByComboPresIds(comboPresIds = []) {
    if (!comboPresIds.length) return []
    return db
      .select({
        presentacion_combo_id: schema.combo_detalles.presentacion_combo_id,
        presentacion_componente_id: schema.combo_detalles.presentacion_componente_id,
        cantidad: schema.combo_detalles.cantidad,
        tipo_ajuste: schema.combo_detalles.tipo_ajuste,
        valor_ajuste: schema.combo_detalles.valor_ajuste,
        precio_final: schema.combo_detalles.precio_final,
        comp_multiplica_por: schema.presentaciones.multiplica_por,
        comp_precio_costo: schema.presentaciones.precio_costo,
        comp_precio_venta: schema.presentaciones.precio_venta,
        comp_producto_uuid: schema.presentaciones.producto_uuid
      })
      .from(schema.combo_detalles)
      .leftJoin(
        schema.presentaciones,
        eq(schema.combo_detalles.presentacion_componente_id, schema.presentaciones.id)
      )
      .where(
        and(
          inArray(schema.combo_detalles.presentacion_combo_id, comboPresIds),
          eq(schema.combo_detalles.activo, true)
        )
      )
  },

  // Consultar kárdex histórico de un producto específico
  async getKardexByProductoId(productoId, branchId = null) {
    const conditions = [eq(schema.stock.producto_id, productoId)]
    if (branchId) {
      conditions.push(eq(schema.stock.branch_id, branchId))
    }
    return db
      .select({
        id: schema.stock.id,
        producto_id: schema.stock.producto_id,
        presentacion_id: schema.stock.presentacion_id,
        presentacion_nombre: schema.presentaciones.nombre,
        lotes_id: schema.stock.lotes_id,
        cantidad: schema.stock.cantidad,
        multiplica_por: schema.stock.multiplica_por,
        cantidad_base: schema.stock.cantidad_base,
        saldo: schema.stock.saldo,
        documento_id: schema.stock.documento_id,
        documento: schema.stock.documento,
        tipo_mov: schema.stock.tipo_mov,
        concepto: schema.stock.concepto,
        usuario_id: schema.stock.usuario_id,
        usuario_nombre: schema.usuarios.nombre,
        branch_id: schema.stock.branch_id,
        almacen_id: schema.stock.almacen_id,
        almacen_nombre: schema.almacenes.nombre,
        created_at: schema.stock.created_at
      })
      .from(schema.stock)
      .leftJoin(schema.presentaciones, eq(schema.stock.presentacion_id, schema.presentaciones.id))
      .leftJoin(schema.usuarios, eq(schema.stock.usuario_id, schema.usuarios.id))
      .leftJoin(schema.almacenes, eq(schema.stock.almacen_id, schema.almacenes.id))
      .where(and(...conditions))
      .orderBy(desc(schema.stock.created_at))
  },

  // Generar código autoincrementado (P0000001) dentro de transacción
  async generarCodigoProductoTx(tx) {
    const [ultimo] = await tx
      .select({ codigo: schema.productos.codigo })
      .from(schema.productos)
      .where(sql`${schema.productos.codigo} ~ '^P[0-9]+$'`)
      .orderBy(desc(sql`CAST(SUBSTRING(${schema.productos.codigo} FROM 2) AS INTEGER)`))
      .limit(1)

    let correlativo = 1
    if (ultimo && ultimo.codigo) {
      const match = ultimo.codigo.match(/^P(\d+)$/)
      if (match) {
        correlativo = parseInt(match[1], 10) + 1
      }
    }
    return `P${String(correlativo).padStart(7, '0')}`
  },

  // Insertar producto dentro de transacción
  async insertProductoTx(tx, data) {
    const [nuevo] = await tx.insert(schema.productos).values(data).returning()
    return nuevo
  },

  // Insertar presentaciones dentro de transacción
  async insertPresentacionesTx(tx, presentaciones = []) {
    if (!presentaciones.length) return []
    return tx.insert(schema.presentaciones).values(presentaciones).returning()
  },

  // Actualizar producto dentro de transacción
  async updateProductoTx(tx, id, data) {
    const [updated] = await tx
      .update(schema.productos)
      .set({ ...data, updated_at: sql`NOW()` })
      .where(eq(schema.productos.id, id))
      .returning()
    return updated || null
  },

  // Eliminar presentaciones existentes de un producto dentro de transacción
  async deletePresentacionesByProductoIdTx(tx, productoId) {
    return tx.delete(schema.presentaciones).where(eq(schema.presentaciones.producto_uuid, productoId))
  },

  // Inactivar producto (Soft delete / Baja lógica)
  async deleteProducto(id) {
    const [inactivado] = await db
      .update(schema.productos)
      .set({ activo: false, updated_at: new Date().toISOString() })
      .where(eq(schema.productos.id, id))
      .returning()
    return inactivado || null
  },

  // Listar presentaciones con datos de producto para gestión masiva de precios
  async getPresentacionesConProducto({ q, categoriaId, activo = true, empresaId, esSuperAdmin = false, limit = 500, offset = 0 }) {
    const conditions = []

    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`))
    }

    if (activo !== undefined) {
      const isActivo = activo === 'true' || activo === true
      conditions.push(eq(schema.productos.activo, isActivo))
      conditions.push(eq(schema.presentaciones.activo, isActivo))
    }

    if (categoriaId) {
      conditions.push(eq(schema.productos.categoria, categoriaId))
    }

    if (q && q.trim() !== '') {
      const search = `%${q.trim()}%`
      conditions.push(
        or(
          ilike(schema.productos.nombre, search),
          ilike(schema.productos.codigo, search),
          ilike(schema.productos.codigo_barra, search),
          ilike(schema.presentaciones.nombre, search),
          ilike(schema.presentaciones.cod_barra, search)
        )
      )
    }

    let query = db
      .select({
        presentacion_id: schema.presentaciones.id,
        producto_id: schema.productos.id,
        producto_codigo: schema.productos.codigo,
        producto_nombre: schema.productos.nombre,
        es_combo: schema.productos.es_combo,
        categoria_id: schema.productos.categoria,
        categoria_nombre: schema.categorias.nombre,
        presentacion_nombre: schema.presentaciones.nombre,
        cod_barra: schema.presentaciones.cod_barra,
        unidad_medida_id: schema.presentaciones.unidad_medida_id,
        multiplica_por: schema.presentaciones.multiplica_por,
        precio_costo: schema.presentaciones.precio_costo,
        precio_venta: schema.presentaciones.precio_venta,
        precio_mayor: schema.presentaciones.precio_mayor,
        precio_especial: schema.presentaciones.precio_especial,
        precio_otros: schema.presentaciones.precio_otros,
        descuento_predefinido: schema.presentaciones.descuento_predefinido,
        updated_at: schema.presentaciones.updated_at
      })
      .from(schema.presentaciones)
      .innerJoin(schema.productos, eq(schema.presentaciones.producto_uuid, schema.productos.id))
      .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    return query
      .orderBy(schema.productos.nombre, schema.presentaciones.multiplica_por)
      .limit(limit)
      .offset(offset)
  },

  // Validar existencia y pertenencia multi-tenant de presentaciones en transacción
  async getPresentacionesParaActualizarTx(tx, presentacionIds = [], { empresaId, esSuperAdmin = false } = {}) {
    if (!presentacionIds.length) return []
    const conditions = [inArray(schema.presentaciones.id, presentacionIds)]
    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`))
    }

    return tx
      .select({
        id: schema.presentaciones.id,
        producto_uuid: schema.presentaciones.producto_uuid,
        empresa_id: schema.productos.empresa_id,
        es_combo: schema.productos.es_combo
      })
      .from(schema.presentaciones)
      .innerJoin(schema.productos, eq(schema.presentaciones.producto_uuid, schema.productos.id))
      .where(and(...conditions))
  },

  // Actualizar precios de una presentación dentro de transacción
  async updatePresentacionPreciosTx(tx, presentacionId, campos) {
    const [updated] = await tx
      .update(schema.presentaciones)
      .set({ ...campos, updated_at: sql`NOW()` })
      .where(eq(schema.presentaciones.id, presentacionId))
      .returning()
    return updated || null
  }
}

module.exports = productosRepository
