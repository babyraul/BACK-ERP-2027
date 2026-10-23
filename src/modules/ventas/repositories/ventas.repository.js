'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, ilike, desc, sql, inArray } = require('drizzle-orm')
const { toVolumenVisual } = require('../../../utils/factores')

/**
 * Repositorio de Persistencia y Consultas para el Dominio de Ventas
 */
const ventasRepository = {
  // Listar ventas con filtros y RLS por sucursal
  async getVentas({ fechaInicio, fechaFin, estado, tipoDocumento, q, branchId, esSuperAdmin = false, factorPrecio, limit, offset }) {
    const conditions = []

    if (!esSuperAdmin && branchId) {
      conditions.push(eq(schema.ventas.branch_id, branchId))
    }

    if (estado) {
      conditions.push(eq(schema.ventas.estado, estado))
    }

    if (tipoDocumento) {
      const tipoId = tipoDocumento === 'factura' ? '01' : tipoDocumento === 'boleta' ? '03' : 'VL'
      conditions.push(eq(schema.ventas.tipo_comprobante_id, tipoId))
    }

    // Normalizar fecha real de emisión
    const fechaEfectivaExpr = sql`CASE 
      WHEN ${schema.ventas.created_at} IS NOT NULL 
       AND ${schema.ventas.fecha_emision} > (${schema.ventas.created_at} + INTERVAL '4 hours')
      THEN ${schema.ventas.created_at}
      ELSE COALESCE(${schema.ventas.fecha_emision}, ${schema.ventas.created_at})
    END`

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
          ilike(schema.ventas.serie, queryTerm),
          sql`CAST(${schema.ventas.correlativo} AS text) ILIKE ${queryTerm}`
        )
      )
    }

    let query = db
      .select({
        id: schema.ventas.id,
        numero: sql`CONCAT(COALESCE(${schema.ventas.serie}, 'S/N'), '-', LPAD(CAST(COALESCE(${schema.ventas.correlativo}, 0) AS text), 8, '0'))`,
        serie: schema.ventas.serie,
        correlativo: schema.ventas.correlativo,
        branch_id: schema.ventas.branch_id,
        sucursal_nombre: sql`COALESCE(${schema.sucursales.sucursal_nombre}, ${schema.sucursales.razon_social}, 'Principal')`,
        preventa_id: schema.ventas.preventa_id,
        caja_turno_id: schema.ventas.caja_turno_id,
        usuario_id: schema.ventas.usuario_id,
        cliente_id: schema.ventas.cliente_id,
        cliente_nombre: schema.clientes.nombre_razon_social,
        cliente_numero_documento: schema.clientes.numero_documento,
        cliente_tipo_documento_id: schema.clientes.tipo_documento_id,
        tipo_comprobante_id: schema.ventas.tipo_comprobante_id,
        tipo_documento: sql`CASE 
          WHEN ${schema.ventas.tipo_comprobante_id} = '01' THEN 'factura'
          WHEN ${schema.ventas.tipo_comprobante_id} = '03' THEN 'boleta'
          ELSE 'vale'
        END`,
        placa: schema.ventas.alias,
        moneda: schema.ventas.moneda,
        fecha_emision: fechaEfectivaExpr,
        gravadas: sql`ROUND(CAST(COALESCE(${schema.ventas.gravadas}, 0) AS numeric) / ${factorPrecio}, 2)`,
        exoneradas: sql`ROUND(CAST(COALESCE(${schema.ventas.exoneradas}, 0) AS numeric) / ${factorPrecio}, 2)`,
        inafectas: sql`ROUND(CAST(COALESCE(${schema.ventas.inafectas}, 0) AS numeric) / ${factorPrecio}, 2)`,
        igv: sql`ROUND(CAST(COALESCE(${schema.ventas.igv}, 0) AS numeric) / ${factorPrecio}, 2)`,
        descuento: sql`ROUND(CAST(COALESCE(${schema.ventas.descuento}, 0) AS numeric) / ${factorPrecio}, 2)`,
        total: sql`ROUND(CAST(COALESCE(${schema.ventas.total_venta}, 0) AS numeric) / ${factorPrecio}, 2)`,
        total_venta: sql`ROUND(CAST(COALESCE(${schema.ventas.total_venta}, 0) AS numeric) / ${factorPrecio}, 2)`,
        total_redondeo: sql`ROUND(CAST(COALESCE(${schema.ventas.total_venta}, 0) AS numeric) / ${factorPrecio}, 2)`,
        redondeo: sql`0.00`,
        estado: schema.ventas.estado,
        estado_pago: schema.ventas.estado_pago,
        tipo_pago_id: schema.ventas.tipo_pago_id,
        modalidad_pago: sql`CASE WHEN ${schema.ventas.tipo_pago_id} = '2' THEN 'Crédito' ELSE 'Contado' END`,
        facturado: schema.ventas.facturado,
        xml_url: schema.ventas.xml_url,
        cdr_url: schema.ventas.cdr_url,
        pdf_url: schema.ventas.pdf_url,
        observacion_sunat: schema.ventas.observacion_sunat,
        created_at: schema.ventas.created_at,
        tipos_pago: sql`(
          SELECT STRING_AGG(COALESCE(tmp.nombre, 'Efectivo'), ', ')
          FROM ${schema.ventas_pagos} vp
          LEFT JOIN ${schema.tipo_metodo_pago} tmp ON vp.metodo_pago_id = tmp.id
          WHERE vp.venta_id = ${schema.ventas.id}
        )`,
        montos_pago: sql`(
          SELECT STRING_AGG(TO_CHAR(ROUND(CAST(vp.monto AS numeric) / ${factorPrecio}, 2), 'FM999999990.00'), ', ')
          FROM ${schema.ventas_pagos} vp
          WHERE vp.venta_id = ${schema.ventas.id}
        )`
      })
      .from(schema.ventas)
      .leftJoin(schema.clientes, eq(schema.ventas.cliente_id, schema.clientes.id))
      .leftJoin(schema.sucursales, eq(schema.ventas.branch_id, schema.sucursales.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.ventas.fecha_emision))

    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.offset(offset)
    }

    return query
  },

  // Obtener cabecera de venta por ID
  async getVentaById(id, factorPrecio) {
    const [venta] = await db
      .select({
        id: schema.ventas.id,
        numero: sql`CONCAT(COALESCE(${schema.ventas.serie}, 'S/N'), '-', LPAD(CAST(COALESCE(${schema.ventas.correlativo}, 0) AS text), 8, '0'))`,
        serie: schema.ventas.serie,
        correlativo: schema.ventas.correlativo,
        branch_id: schema.ventas.branch_id,
        preventa_id: schema.ventas.preventa_id,
        caja_turno_id: schema.ventas.caja_turno_id,
        usuario_id: schema.ventas.usuario_id,
        cliente_id: schema.ventas.cliente_id,
        cliente_nombre: schema.clientes.nombre_razon_social,
        cliente_numero_documento: schema.clientes.numero_documento,
        tipo_comprobante_id: schema.ventas.tipo_comprobante_id,
        tipo_documento: sql`CASE 
          WHEN ${schema.ventas.tipo_comprobante_id} = '01' THEN 'factura'
          WHEN ${schema.ventas.tipo_comprobante_id} = '03' THEN 'boleta'
          ELSE 'vale'
        END`,
        placa: schema.ventas.alias,
        moneda: schema.ventas.moneda,
        fecha_emision: sql`CASE 
          WHEN ${schema.ventas.created_at} IS NOT NULL 
           AND ${schema.ventas.fecha_emision} > (${schema.ventas.created_at} + INTERVAL '4 hours')
          THEN ${schema.ventas.created_at}
          ELSE COALESCE(${schema.ventas.fecha_emision}, ${schema.ventas.created_at})
        END`,
        gravadas: sql`ROUND(CAST(${schema.ventas.gravadas} AS numeric) / ${factorPrecio}, 2)`,
        igv: sql`ROUND(CAST(${schema.ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
        total: sql`ROUND(CAST(${schema.ventas.total_venta} AS numeric) / ${factorPrecio}, 2)`,
        estado: schema.ventas.estado,
        facturado: schema.ventas.facturado,
        xml_url: schema.ventas.xml_url,
        cdr_url: schema.ventas.cdr_url,
        pdf_url: schema.ventas.pdf_url
      })
      .from(schema.ventas)
      .leftJoin(schema.clientes, eq(schema.ventas.cliente_id, schema.clientes.id))
      .where(eq(schema.ventas.id, id))

    return venta || null
  },

  // Obtener ítems detallados de una venta
  async getDetalleVenta(ventaId, factorPrecio) {
    return db
      .select({
        id: schema.detalle_ventas.id,
        producto_id: schema.detalle_ventas.producto_id,
        producto_codigo: schema.productos.codigo,
        producto_nombre: schema.productos.nombre,
        producto_unidad_medida_id: schema.productos.unidad_medida_id,
        presentacion_id: schema.detalle_ventas.presentacion_id,
        presentacion_nombre: schema.presentaciones.nombre,
        presentacion_unidad_medida_id: schema.presentaciones.unidad_medida_id,
        cod_barra: sql`COALESCE(${schema.presentaciones.cod_barra}, ${schema.productos.codigo_barra})`,
        precio_costo: sql`ROUND(CAST(COALESCE(${schema.presentaciones.precio_costo}, ${schema.productos.stock_minimo}, 0) AS numeric) / ${factorPrecio}, 2)`,
        precio_mayor: sql`ROUND(CAST(COALESCE(${schema.presentaciones.precio_mayor}, 0) AS numeric) / ${factorPrecio}, 2)`,
        precio_especial: sql`ROUND(CAST(COALESCE(${schema.presentaciones.precio_especial}, 0) AS numeric) / ${factorPrecio}, 2)`,
        cantidad: schema.detalle_ventas.cantidad,
        precio_unitario: sql`ROUND(CAST(${schema.detalle_ventas.precio_unitario} AS numeric) / ${factorPrecio}, 2)`,
        subtotal: sql`ROUND(CAST(${schema.detalle_ventas.subtotal} AS numeric) / ${factorPrecio}, 2)`,
        igv: sql`ROUND(CAST(${schema.detalle_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
        total: sql`ROUND(CAST(${schema.detalle_ventas.total} AS numeric) / ${factorPrecio}, 2)`
      })
      .from(schema.detalle_ventas)
      .leftJoin(schema.productos, eq(schema.detalle_ventas.producto_id, schema.productos.id))
      .leftJoin(schema.presentaciones, eq(schema.detalle_ventas.presentacion_id, schema.presentaciones.id))
      .where(eq(schema.detalle_ventas.venta_id, ventaId))
  },

  // Obtener desglose de combos asociados a detalles de ventas
  async getComboDetallesByVentaDetalleIds(detalleVentaIds, { factorPrecio, factorVolumen }) {
    if (!detalleVentaIds || detalleVentaIds.length === 0) return {}

    const rows = await db
      .select({
        id: schema.combo_detalle_ventas.id,
        detalle_venta_id: schema.combo_detalle_ventas.detalle_venta_id,
        producto_componente_id: schema.combo_detalle_ventas.producto_componente_id,
        presentacion_componente_id: schema.combo_detalle_ventas.presentacion_componente_id,
        producto_nombre: schema.combo_detalle_ventas.producto_nombre_snapshot,
        presentacion_nombre: schema.combo_detalle_ventas.presentacion_nombre_snapshot,
        cantidad_base: schema.combo_detalle_ventas.cantidad_base,
        multiplica_por: schema.combo_detalle_ventas.multiplica_por_snapshot,
        costo_unitario_base: schema.combo_detalle_ventas.costo_unitario_base_snapshot,
        costo_total: sql`ROUND(CAST(${schema.combo_detalle_ventas.costo_total_snapshot} AS numeric) / ${factorPrecio}, 2)`,
        precio_proporcional: sql`ROUND(CAST(${schema.combo_detalle_ventas.precio_proporcional_historico} AS numeric) / ${factorPrecio}, 2)`
      })
      .from(schema.combo_detalle_ventas)
      .where(inArray(schema.combo_detalle_ventas.detalle_venta_id, detalleVentaIds))

    const map = {}
    rows.forEach((r) => {
      if (!map[r.detalle_venta_id]) {
        map[r.detalle_venta_id] = []
      }
      map[r.detalle_venta_id].push({
        ...r,
        cantidad_base: toVolumenVisual(r.cantidad_base, factorVolumen)
      })
    })

    return map
  },

  // Obtener detalle de pagos asociados a la venta
  async getPagosByVentaId(ventaId, factorPrecio) {
    return db
      .select({
        id: schema.ventas_pagos.id,
        metodo_pago_id: schema.ventas_pagos.metodo_pago_id,
        metodo_nombre: schema.tipo_metodo_pago.nombre,
        monto: sql`ROUND(CAST(${schema.ventas_pagos.monto} AS numeric) / ${factorPrecio}, 2)`,
        numero_operacion: schema.ventas_pagos.numero_operacion
      })
      .from(schema.ventas_pagos)
      .leftJoin(schema.tipo_metodo_pago, eq(schema.ventas_pagos.metodo_pago_id, schema.tipo_metodo_pago.id))
      .where(eq(schema.ventas_pagos.venta_id, ventaId))
  },

  // Obtener cliente por ID para validación
  async getClienteDoc(clienteId) {
    const [cli] = await db
      .select({ numero_documento: schema.clientes.numero_documento })
      .from(schema.clientes)
      .where(eq(schema.clientes.id, clienteId))
      .limit(1)
    return cli?.numero_documento || null
  },

  // Obtener turno activo de cajero
  async getTurnoActivo(branchId, usuarioId) {
    const [turno] = await db
      .select({
        id: schema.caja_turnos.id,
        identificador_caja: schema.caja_turnos.identificador_caja,
        fecha_apertura: schema.caja_turnos.fecha_apertura
      })
      .from(schema.caja_turnos)
      .where(
        and(
          eq(schema.caja_turnos.branch_id, branchId),
          eq(schema.caja_turnos.usuario_id, usuarioId),
          eq(schema.caja_turnos.estado, 'ABIERTA')
        )
      )
      .limit(1)
    return turno || null
  },

  // Obtener estado de preventa
  async getPreventaEstado(preventaId) {
    const [pv] = await db
      .select({ id: schema.pre_ventas.id, estado: schema.pre_ventas.estado })
      .from(schema.pre_ventas)
      .where(eq(schema.pre_ventas.id, preventaId))
      .limit(1)
    return pv || null
  },

  // Obtener venta por ID para anulación
  async getRawVentaById(id, tx = db) {
    const [venta] = await tx
      .select()
      .from(schema.ventas)
      .where(eq(schema.ventas.id, id))
      .limit(1)
    return venta || null
  }
}

module.exports = ventasRepository
