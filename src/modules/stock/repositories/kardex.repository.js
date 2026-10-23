'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, desc, sql } = require('drizzle-orm')

/**
 * Repositorio de Kárdex Histórico (tabla stock)
 */
const kardexRepository = {
  // Consultar movimientos históricos del kárdex con filtros
  async getMovimientos({ productoId, presentacionId, almacenId, tipoMov, fechaInicio, fechaFin, branchId, esSuperAdmin = false }) {
    const conditions = [eq(schema.stock.producto_id, productoId)]

    if (!esSuperAdmin && branchId) {
      conditions.push(eq(schema.stock.branch_id, branchId))
    }
    if (presentacionId) {
      conditions.push(eq(schema.stock.presentacion_id, presentacionId))
    }
    if (almacenId) {
      conditions.push(eq(schema.stock.almacen_id, almacenId))
    }
    if (tipoMov && (String(tipoMov) === '1' || String(tipoMov) === '2')) {
      conditions.push(eq(schema.stock.tipo_mov, Number(tipoMov)))
    }
    if (fechaInicio) {
      conditions.push(sql`DATE(${schema.stock.created_at}) >= ${fechaInicio}::date`)
    }
    if (fechaFin) {
      conditions.push(sql`DATE(${schema.stock.created_at}) <= ${fechaFin}::date`)
    }

    return db
      .select({
        id: schema.stock.id,
        producto_id: schema.stock.producto_id,
        producto_nombre: schema.productos.nombre,
        producto_codigo: schema.productos.codigo,
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
      .leftJoin(schema.productos, eq(schema.stock.producto_id, schema.productos.id))
      .leftJoin(schema.presentaciones, eq(schema.stock.presentacion_id, schema.presentaciones.id))
      .leftJoin(schema.usuarios, eq(schema.stock.usuario_id, schema.usuarios.id))
      .leftJoin(schema.almacenes, eq(schema.stock.almacen_id, schema.almacenes.id))
      .where(and(...conditions))
      .orderBy(desc(schema.stock.created_at))
  },

  // Insertar un movimiento de kárdex dentro de una transacción
  async insertMovimientoTx(tx, {
    productoId,
    presentacionId,
    lotesId = null,
    cantidad,
    multiplicaPor,
    cantidadBase,
    saldo,
    documentoId = null,
    documento,
    tipoMov,
    concepto,
    usuarioId,
    branchId,
    almacenId
  }) {
    const [movimiento] = await tx
      .insert(schema.stock)
      .values({
        producto_id: productoId,
        presentacion_id: presentacionId,
        lotes_id: lotesId,
        cantidad,
        multiplica_por: multiplicaPor,
        cantidad_base: cantidadBase,
        saldo,
        documento_id: documentoId,
        documento,
        tipo_mov: tipoMov,
        concepto,
        usuario_id: usuarioId,
        branch_id: branchId,
        almacen_id: almacenId
      })
      .returning()

    return movimiento
  }
}

module.exports = kardexRepository
