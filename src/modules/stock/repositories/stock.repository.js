'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, ilike, desc, inArray, sql } = require('drizzle-orm')
const crypto = require('crypto')

/**
 * Adquiere un bloqueo consultivo a nivel de transacción (pg_advisory_xact_lock)
 * para la combinación (almacen_id, producto_id).
 */
async function acquireProductStockLock(tx, almacenId, productoId) {
  const hash = crypto.createHash('sha256').update(`${almacenId}:${productoId}`).digest()
  const key1 = hash.readInt32BE(0)
  const key2 = hash.readInt32BE(4)
  await tx.execute(sql`SELECT pg_advisory_xact_lock(${key1}, ${key2})`)
}

/**
 * Repositorio de Stock y Almacenes para operaciones de base de datos con Drizzle ORM
 */
const stockRepository = {
  acquireProductStockLock,

  // Obtener almacenes activos según sucursal
  async getAlmacenes(branchId, esSuperAdmin = false) {
    const almacenConds = [eq(schema.almacenes.activo, true)]
    if (!esSuperAdmin && branchId) {
      almacenConds.push(eq(schema.almacenes.branch_id, branchId))
    }
    return db
      .select()
      .from(schema.almacenes)
      .where(and(...almacenConds))
      .orderBy(desc(schema.almacenes.es_principal))
  },

  // Validar o resolver almacén dentro de una transacción
  async getOrResolveAlmacenTx(tx, { almacenId, branchId }) {
    if (almacenId) {
      const [almValido] = await tx
        .select({ id: schema.almacenes.id })
        .from(schema.almacenes)
        .where(
          and(
            eq(schema.almacenes.id, almacenId),
            eq(schema.almacenes.branch_id, branchId),
            eq(schema.almacenes.activo, true)
          )
        )
        .limit(1)

      if (!almValido) {
        const error = new Error('El almacén especificado no existe, está inactivo o no pertenece a la sucursal activa.')
        error.statusCode = 400
        throw error
      }
      return almacenId
    }

    const [alm] = await tx
      .select({ id: schema.almacenes.id })
      .from(schema.almacenes)
      .where(and(eq(schema.almacenes.branch_id, branchId), eq(schema.almacenes.activo, true)))
      .orderBy(desc(schema.almacenes.es_principal))
      .limit(1)

    if (alm) {
      return alm.id
    }

    const [nuevoAlm] = await tx
      .insert(schema.almacenes)
      .values({
        branch_id: branchId,
        nombre: 'ALMACÉN PRINCIPAL',
        codigo: 'ALM-01',
        es_principal: true,
        activo: true
      })
      .returning({ id: schema.almacenes.id })

    return nuevoAlm.id
  },

  // Obtener catálogo de productos filtrados
  async getProductosFiltrados({ empresaId, categoriaId, q, activo, esSuperAdmin = false, limit, offset }) {
    const prodConds = []
    if (activo !== undefined && activo !== 'todos' && activo !== '') {
      prodConds.push(eq(schema.productos.activo, activo === 'true' || activo === true))
    }
    if (!esSuperAdmin && empresaId) {
      prodConds.push(
        or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`)
      )
    }
    if (categoriaId) {
      prodConds.push(eq(schema.productos.categoria, categoriaId))
    }
    if (q && q.trim() !== '') {
      const search = `%${q.trim()}%`
      prodConds.push(
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
        unidad_medida_id: schema.productos.unidad_medida_id,
        stock_minimo: schema.productos.stock_minimo,
        es_facturable: schema.productos.es_facturable,
        activo: schema.productos.activo,
        es_combo: schema.productos.es_combo,
        categoria_id: schema.productos.categoria,
        categoria_nombre: schema.categorias.nombre,
        sub_categoria_nombre: schema.subcategoria.Nombre,
        empresa_id: schema.productos.empresa_id
      })
      .from(schema.productos)
      .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))
      .leftJoin(schema.subcategoria, eq(schema.productos.sub_categoria, schema.subcategoria.id))
      .where(prodConds.length > 0 ? and(...prodConds) : undefined)
      .orderBy(desc(schema.productos.created_at))

    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.offset(offset)
    }

    return query
  },

  // Obtener presentaciones de una lista de productos
  async getPresentacionesByProdIds(prodIds = []) {
    if (!prodIds.length) return []
    return db
      .select()
      .from(schema.presentaciones)
      .where(inArray(schema.presentaciones.producto_uuid, prodIds))
  },

  // Obtener stock actual de una lista de productos
  async getStockActualByProdIds({ prodIds = [], branchId, almacenId, esSuperAdmin = false }) {
    if (!prodIds.length) return []
    const stockConds = [inArray(schema.stock_actual.producto_id, prodIds)]
    if (!esSuperAdmin && branchId) {
      stockConds.push(eq(schema.stock_actual.branch_id, branchId))
    }
    if (almacenId) {
      stockConds.push(eq(schema.stock_actual.almacen_id, almacenId))
    }

    return db
      .select({
        id: schema.stock_actual.id,
        branch_id: schema.stock_actual.branch_id,
        almacen_id: schema.stock_actual.almacen_id,
        almacen_nombre: schema.almacenes.nombre,
        producto_id: schema.stock_actual.producto_id,
        presentacion_id: schema.stock_actual.presentacion_id,
        lotes_id: schema.stock_actual.lotes_id,
        saldo_actual: schema.stock_actual.saldo_actual,
        updated_at: schema.stock_actual.updated_at
      })
      .from(schema.stock_actual)
      .leftJoin(schema.almacenes, eq(schema.stock_actual.almacen_id, schema.almacenes.id))
      .where(and(...stockConds))
  },

  // Validar pertenencia del producto a la empresa
  async validarProductoEmpresaTx(tx, { productoId, empresaId, esSuperAdmin = false }) {
    const prodConds = [eq(schema.productos.id, productoId)]
    if (!esSuperAdmin && empresaId) {
      prodConds.push(
        or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`)
      )
    }

    const [productoValido] = await tx
      .select({ id: schema.productos.id })
      .from(schema.productos)
      .where(and(...prodConds))
      .limit(1)

    if (!productoValido) {
      const error = new Error(`El producto ${productoId} no existe o no pertenece a la empresa autorizada.`)
      error.statusCode = 400
      throw error
    }
    return productoValido
  },

  // Validar pertenencia de la presentación al producto
  async validarPresentacionProductoTx(tx, { presentacionId, productoId }) {
    const [pres] = await tx
      .select({
        id: schema.presentaciones.id,
        multiplica_por: schema.presentaciones.multiplica_por
      })
      .from(schema.presentaciones)
      .where(
        and(
          eq(schema.presentaciones.id, presentacionId),
          eq(schema.presentaciones.producto_uuid, productoId)
        )
      )
      .limit(1)

    if (!pres) {
      const error = new Error('La presentación especificada no pertenece al producto seleccionado o no existe.')
      error.statusCode = 400
      throw error
    }
    return pres
  },

  // Bloquear filas de stock_actual por producto y almacén
  async getStockActualProductoForUpdateTx(tx, { branchId, almacenId, productoId }) {
    return tx
      .select()
      .from(schema.stock_actual)
      .where(
        and(
          eq(schema.stock_actual.branch_id, branchId),
          eq(schema.stock_actual.almacen_id, almacenId),
          eq(schema.stock_actual.producto_id, productoId)
        )
      )
      .for('update')
  },

  // Actualizar fila de stock_actual
  async updateStockActualTx(tx, { id, saldoActual }) {
    return tx
      .update(schema.stock_actual)
      .set({
        saldo_actual: saldoActual,
        updated_at: sql`NOW()`
      })
      .where(eq(schema.stock_actual.id, id))
  },

  // Insertar nueva fila en stock_actual
  async insertStockActualTx(tx, { branchId, almacenId, productoId, presentacionId, saldoActual, lotesId = null }) {
    return tx.insert(schema.stock_actual).values({
      branch_id: branchId,
      almacen_id: almacenId,
      producto_id: productoId,
      presentacion_id: presentacionId,
      lotes_id: lotesId,
      saldo_actual: saldoActual,
      updated_at: sql`NOW()`
    })
  }
}

module.exports = stockRepository
