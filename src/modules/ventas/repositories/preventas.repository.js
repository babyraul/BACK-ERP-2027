'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, ilike, desc, sql, inArray } = require('drizzle-orm')
const { toVolumenVisual } = require('../../../utils/factores')

const fechaEfectivaExpr = sql`CASE 
  WHEN ${schema.pre_ventas.created_at} IS NOT NULL 
   AND ${schema.pre_ventas.fecha_emision} > (${schema.pre_ventas.created_at} + INTERVAL '4 hours')
  THEN ${schema.pre_ventas.created_at}
  ELSE COALESCE(${schema.pre_ventas.fecha_emision}, ${schema.pre_ventas.created_at})
END`

/**
 * Repositorio de Persistencia y Consultas para el Dominio de Preventas
 */
const preventasRepository = {
  // Listar preventas con filtros y RLS por sucursal
  async getPreventas({ fechaInicio, fechaFin, estado, q, branchId, esSuperAdmin = false, factorPrecio }) {
    const conditions = []

    if (!esSuperAdmin && branchId) {
      conditions.push(eq(schema.pre_ventas.branch_id, branchId))
    }

    const estadoFiltro = estado !== undefined ? (estado || undefined) : 'PENDIENTE'
    if (estadoFiltro) {
      conditions.push(eq(schema.pre_ventas.estado, estadoFiltro))
    }

    if (fechaInicio) {
      conditions.push(sql`DATE(${fechaEfectivaExpr}) >= ${fechaInicio}::date`)
    }

    if (fechaFin) {
      conditions.push(sql`DATE(${fechaEfectivaExpr}) <= ${fechaFin}::date`)
    }

    if (q && q.trim()) {
      const queryTerm = `%${q.trim()}%`
      conditions.push(
        or(
          ilike(schema.clientes.nombre_razon_social, queryTerm),
          ilike(schema.clientes.numero_documento, queryTerm),
          ilike(schema.pre_ventas.alias, queryTerm),
          ilike(schema.usuarios.nombre, queryTerm),
          sql`CAST(${schema.pre_ventas.id} AS text) ILIKE ${queryTerm}`
        )
      )
    }

    return db
      .select({
        id: schema.pre_ventas.id,
        codigo: sql`CONCAT('PV-', SUBSTRING(CAST(${schema.pre_ventas.id} AS text), 1, 4))`,
        branch_id: schema.pre_ventas.branch_id,
        caja_turno_id: schema.pre_ventas.caja_turno_id,
        usuario_id: schema.pre_ventas.usuario_id,
        usuario_nombre: schema.usuarios.nombre,
        usuario: schema.usuarios.usuario,
        cliente_id: schema.pre_ventas.cliente_id,
        cliente_nombre: schema.clientes.nombre_razon_social,
        cliente_numero_documento: schema.clientes.numero_documento,
        cliente_direccion: schema.clientes.direccion_1,
        tipo_comprobante_id: schema.pre_ventas.tipo_comprobante_id,
        tipo_documento: sql`CASE 
          WHEN ${schema.pre_ventas.tipo_comprobante_id} = '01' THEN 'factura'
          WHEN ${schema.pre_ventas.tipo_comprobante_id} = '03' THEN 'boleta'
          ELSE 'vale'
        END`,
        alias: schema.pre_ventas.alias,
        placa: schema.pre_ventas.alias,
        moneda: schema.pre_ventas.moneda,
        fecha_emision: fechaEfectivaExpr,
        gravadas: sql`ROUND(CAST(${schema.pre_ventas.gravadas} AS numeric) / ${factorPrecio}, 2)`,
        igv: sql`ROUND(CAST(${schema.pre_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
        total: sql`ROUND(CAST(${schema.pre_ventas.total_venta} AS numeric) / ${factorPrecio}, 2)`,
        total_preventa: sql`ROUND(CAST(${schema.pre_ventas.total_venta} AS numeric) / ${factorPrecio}, 2)`,
        estado: schema.pre_ventas.estado,
        created_at: schema.pre_ventas.created_at,
        updated_at: schema.pre_ventas.updated_at
      })
      .from(schema.pre_ventas)
      .leftJoin(schema.clientes, eq(schema.pre_ventas.cliente_id, schema.clientes.id))
      .leftJoin(schema.usuarios, eq(schema.pre_ventas.usuario_id, schema.usuarios.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.pre_ventas.created_at))
  },

  // Obtener preventa por ID con información de cliente y usuario
  async getPreventaById(id, factorPrecio) {
    const [preventa] = await db
      .select({
        id: schema.pre_ventas.id,
        codigo: sql`CONCAT('PV-', SUBSTRING(CAST(${schema.pre_ventas.id} AS text), 1, 4))`,
        branch_id: schema.pre_ventas.branch_id,
        caja_turno_id: schema.pre_ventas.caja_turno_id,
        usuario_id: schema.pre_ventas.usuario_id,
        usuario_nombre: schema.usuarios.nombre,
        usuario: schema.usuarios.usuario,
        cliente_id: schema.pre_ventas.cliente_id,
        cliente_nombre: schema.clientes.nombre_razon_social,
        cliente_numero_documento: schema.clientes.numero_documento,
        cliente_direccion: schema.clientes.direccion_1,
        tipo_comprobante_id: schema.pre_ventas.tipo_comprobante_id,
        tipo_documento: sql`CASE 
          WHEN ${schema.pre_ventas.tipo_comprobante_id} = '01' THEN 'factura'
          WHEN ${schema.pre_ventas.tipo_comprobante_id} = '03' THEN 'boleta'
          ELSE 'vale'
        END`,
        alias: schema.pre_ventas.alias,
        placa: schema.pre_ventas.alias,
        moneda: schema.pre_ventas.moneda,
        fecha_emision: fechaEfectivaExpr,
        gravadas: sql`ROUND(CAST(${schema.pre_ventas.gravadas} AS numeric) / ${factorPrecio}, 2)`,
        igv: sql`ROUND(CAST(${schema.pre_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
        total: sql`ROUND(CAST(${schema.pre_ventas.total_venta} AS numeric) / ${factorPrecio}, 2)`,
        estado: schema.pre_ventas.estado,
        created_at: schema.pre_ventas.created_at
      })
      .from(schema.pre_ventas)
      .leftJoin(schema.clientes, eq(schema.pre_ventas.cliente_id, schema.clientes.id))
      .leftJoin(schema.usuarios, eq(schema.pre_ventas.usuario_id, schema.usuarios.id))
      .where(eq(schema.pre_ventas.id, id))

    return preventa || null
  },

  // Obtener detalle de ítems de una preventa
  async getDetallePreventa(preventaId, factorPrecio) {
    return db
      .select({
        id: schema.detalle_pre_ventas.id,
        preventa_id: schema.detalle_pre_ventas.preventa_id,
        producto_id: schema.detalle_pre_ventas.producto_id,
        producto_nombre: schema.productos.nombre,
        unidad_medida_id: schema.productos.unidad_medida_id,
        nombre_completo: schema.presentaciones.nombre,
        presentacion_id: schema.detalle_pre_ventas.presentacion_id,
        cantidad: schema.detalle_pre_ventas.cantidad,
        precio_unitario: sql`ROUND(CAST(${schema.detalle_pre_ventas.precio_unitario} AS numeric) / ${factorPrecio}, 2)`,
        subtotal: sql`ROUND(CAST(${schema.detalle_pre_ventas.subtotal} AS numeric) / ${factorPrecio}, 2)`,
        igv: sql`ROUND(CAST(${schema.detalle_pre_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
        total: sql`ROUND(CAST(${schema.detalle_pre_ventas.total} AS numeric) / ${factorPrecio}, 2)`
      })
      .from(schema.detalle_pre_ventas)
      .leftJoin(schema.productos, eq(schema.detalle_pre_ventas.producto_id, schema.productos.id))
      .leftJoin(schema.presentaciones, eq(schema.detalle_pre_ventas.presentacion_id, schema.presentaciones.id))
      .where(eq(schema.detalle_pre_ventas.preventa_id, preventaId))
  },

  // Obtener desglose de combos en preventas
  async getComboDetallesByPreventaDetalleIds(detalleIds, factorVolumen) {
    if (!detalleIds || detalleIds.length === 0) return {}

    const rows = await db
      .select({
        id: schema.combo_detalle_pre_ventas.id,
        detalle_pre_venta_id: schema.combo_detalle_pre_ventas.detalle_pre_venta_id,
        producto_componente_id: schema.combo_detalle_pre_ventas.producto_componente_id,
        presentacion_componente_id: schema.combo_detalle_pre_ventas.presentacion_componente_id,
        producto_nombre: schema.combo_detalle_pre_ventas.producto_nombre_snapshot,
        presentacion_nombre: schema.combo_detalle_pre_ventas.presentacion_nombre_snapshot,
        cantidad_base_prevista: schema.combo_detalle_pre_ventas.cantidad_base_prevista,
        multiplica_por: schema.combo_detalle_pre_ventas.multiplica_por_snapshot
      })
      .from(schema.combo_detalle_pre_ventas)
      .where(inArray(schema.combo_detalle_pre_ventas.detalle_pre_venta_id, detalleIds))

    const map = {}
    rows.forEach((r) => {
      if (!map[r.detalle_pre_venta_id]) {
        map[r.detalle_pre_venta_id] = []
      }
      map[r.detalle_pre_venta_id].push({
        ...r,
        cantidad_base_prevista: toVolumenVisual(r.cantidad_base_prevista, factorVolumen)
      })
    })

    return map
  },

  // Obtener preventa pura por ID para operaciones de modificación / anulación
  async getRawPreventaById(id, { branchId, esSuperAdmin = false }) {
    const conditions = [eq(schema.pre_ventas.id, id)]
    if (!esSuperAdmin && branchId) {
      conditions.push(eq(schema.pre_ventas.branch_id, branchId))
    }

    const [preventa] = await db
      .select()
      .from(schema.pre_ventas)
      .where(and(...conditions))
      .limit(1)

    return preventa || null
  },

  // Anulación lógica de preventa (Soft Delete: estado = 'ANULADO')
  async inactivatePreventa(id) {
    const [inactivado] = await db
      .update(schema.pre_ventas)
      .set({
        estado: 'ANULADO',
        updated_at: sql`NOW()`
      })
      .where(eq(schema.pre_ventas.id, id))
      .returning()

    return inactivado || null
  }
}

module.exports = preventasRepository
