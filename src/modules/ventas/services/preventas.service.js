'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, sql, inArray } = require('drizzle-orm')
const preventasRepository = require('../repositories/preventas.repository')
const { calcularTotalesVenta } = require('../../../utils/Operaciones')
const {
  getFactores,
  toVolumenInt,
  toVolumenVisual
} = require('../../../utils/factores')

const isUUID = (str) =>
  Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

/**
 * Servicio de Dominio para Gestión y Consulta de Pre-Ventas
 */
const preventasService = {
  // Listar preventas con filtros
  async listarPreventas({ fechaInicio, fechaFin, estado, q, branchId, esSuperAdmin, limit, offset }) {
    const { factorPrecio } = await getFactores()
    return preventasRepository.getPreventas({
      fechaInicio,
      fechaFin,
      estado,
      q,
      branchId,
      esSuperAdmin,
      factorPrecio,
      limit,
      offset
    })
  },

  // Obtener detalle completo de una preventa (con desglose de combos)
  async obtenerPreventaPorId(id) {
    const { factorPrecio, factorVolumen } = await getFactores()

    const preventa = await preventasRepository.getPreventaById(id, factorPrecio)
    if (!preventa) {
      const error = new Error('Preventa no encontrada')
      error.statusCode = 404
      throw error
    }

    const rawItems = await preventasRepository.getDetallePreventa(id, factorPrecio)
    const detalleIds = rawItems.map((it) => it.id).filter(Boolean)

    const comboDetallesMap = await preventasRepository.getComboDetallesByPreventaDetalleIds(detalleIds, factorVolumen)

    const items = rawItems.map((it) => ({
      ...it,
      cantidad: toVolumenVisual(it.cantidad, factorVolumen),
      cantidad_raw: Number(it.cantidad || 0),
      combo_detalles: comboDetallesMap[it.id] || []
    }))

    return {
      ...preventa,
      items,
      detalles: items
    }
  },

  // Crear nueva preventa transaccional
  async crearPreventa(payload, { branchId, usuarioId }) {
    const {
      cliente_id,
      tipo_documento, // 'factura', 'boleta', 'vale'
      placa,
      alias,
      items = [],
      total = 0
    } = payload

    if (!items || items.length === 0) {
      const error = new Error('La preventa debe contener al menos un producto')
      error.statusCode = 400
      throw error
    }

    if (!branchId) {
      const error = new Error('El usuario no tiene una sucursal activa')
      error.statusCode = 400
      throw error
    }

    // Obtener turno activo si existe
    const [turnoActivo] = await db
      .select({ id: schema.caja_turnos.id })
      .from(schema.caja_turnos)
      .where(and(eq(schema.caja_turnos.branch_id, branchId), eq(schema.caja_turnos.estado, 'ABIERTA')))
      .limit(1)

    const tipoComprobanteId =
      tipo_documento === 'factura' ? '01' : tipo_documento === 'boleta' ? '03' : 'VL'

    const { factorPrecio, factorVolumen } = await getFactores()

    return db.transaction(async (tx) => {
      // Pre-cargar tipo_tributo de BD para productos si no vienen explícitos
      const prodIds = items.map((i) => i.producto_id).filter(isUUID)
      let prodsMap = {}
      if (prodIds.length > 0) {
        const prodsDb = await tx
          .select({
            id: schema.productos.id,
            tipo_tributo: schema.productos.tipo_tributo,
            es_combo: schema.productos.es_combo
          })
          .from(schema.productos)
          .where(inArray(schema.productos.id, prodIds))
        prodsDb.forEach((p) => {
          prodsMap[p.id] = {
            tipo_tributo: p.tipo_tributo,
            es_combo: p.es_combo
          }
        })
      }

      // Calcular bases fiscales mediante la utilidad centralizada Operaciones.js
      const itemsConAfectacion = items.map((item) => ({
        ...item,
        tipo_afectacion_igv: item.tipo_afectacion_igv || prodsMap[item.producto_id]?.tipo_tributo || '10'
      }))

      const totalesCalc = calcularTotalesVenta(itemsConAfectacion)
      const itemsProcesados = totalesCalc.itemsProcesados

      const gravadasTotalCalc = totalesCalc.gravado
      const igvTotalCalc = totalesCalc.igv
      const exoneradasTotalCalc = totalesCalc.exonerado
      const inafectasTotalCalc = totalesCalc.inafecto

      const totalVisual = Number(total || 0) > 0 ? Number(total) : totalesCalc.total

      const gravadasInt = Math.round(gravadasTotalCalc * factorPrecio)
      const exoneradasInt = Math.round(exoneradasTotalCalc * factorPrecio)
      const inafectasInt = Math.round(inafectasTotalCalc * factorPrecio)
      const igvInt = Math.round(igvTotalCalc * factorPrecio)
      const totalVentaInt = Math.round(totalVisual * factorPrecio)

      // A. Insertar cabecera pre_ventas
      const [nuevaPreventa] = await tx
        .insert(schema.pre_ventas)
        .values({
          branch_id: branchId,
          caja_turno_id: turnoActivo?.id || null,
          usuario_id: usuarioId,
          cliente_id: isUUID(cliente_id) ? cliente_id : null,
          tipo_comprobante_id: tipoComprobanteId,
          alias: alias || placa || null,
          moneda: 'PEN',
          tipo_cambio: 1,
          gravadas: gravadasInt,
          exoneradas: exoneradasInt,
          inafectas: inafectasInt,
          igv: igvInt,
          total_venta: totalVentaInt,
          estado: 'PENDIENTE',
          fecha_emision: sql`NOW()`
        })
        .returning()

      // B. Insertar detalle_pre_ventas
      for (const item of itemsProcesados) {
        let presId = item.presentacion_id
        if (!presId && item.producto_id) {
          const [pres] = await tx
            .select({ id: schema.presentaciones.id })
            .from(schema.presentaciones)
            .where(eq(schema.presentaciones.producto_uuid, item.producto_id))
            .limit(1)
          presId = pres?.id || null
        }

        if (!presId) {
          const [nuevaPres] = await tx
            .insert(schema.presentaciones)
            .values({
              producto_uuid: item.producto_id,
              nombre: item.nombre_completo || 'UNIDAD',
              precio_venta: Math.round(Number(item.precioVisual || 0) * factorPrecio)
            })
            .returning()
          presId = nuevaPres.id
        }

        const cantInt = toVolumenInt(item.cantVisual, factorVolumen)
        const precioInt = Math.round(item.precioVisual * factorPrecio)
        const itemTotalInt = Math.round(item.itemTotalVisual * factorPrecio)
        const itemSubtotalInt = Math.round(item.itemSubtotalVisual * factorPrecio)
        const itemIgvInt = Math.round(item.itemIgvVisual * factorPrecio)

        const [nuevoDetalle] = await tx
          .insert(schema.detalle_pre_ventas)
          .values({
            preventa_id: nuevaPreventa.id,
            producto_id: item.producto_id,
            presentacion_id: presId,
            cantidad: cantInt,
            precio_unitario: precioInt,
            subtotal: itemSubtotalInt,
            igv: itemIgvInt,
            total: itemTotalInt
          })
          .returning()

        // C. Si es combo, registrar desglose de componentes en combo_detalle_pre_ventas
        const esCombo = Boolean(prodsMap[item.producto_id]?.es_combo)
        if (presId && (esCombo || item.es_combo)) {
          const componentes = await tx
            .select({
              id: schema.combo_detalles.id,
              presentacion_componente_id: schema.combo_detalles.presentacion_componente_id,
              cantidad: schema.combo_detalles.cantidad,
              comp_nombre: schema.presentaciones.nombre,
              comp_producto_uuid: schema.presentaciones.producto_uuid,
              comp_multiplica_por: schema.presentaciones.multiplica_por,
              prod_nombre: schema.productos.nombre
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
                eq(schema.combo_detalles.presentacion_combo_id, presId),
                eq(schema.combo_detalles.activo, true)
              )
            )

          for (const comp of componentes) {
            const cantCompItem = Number(comp.cantidad || 1)
            const multiplicaComp = Math.max(1, Number(comp.comp_multiplica_por || 1))
            const cantBasePrevistaComp = toVolumenInt(
              item.cantVisual * cantCompItem * multiplicaComp,
              factorVolumen
            )

            await tx.insert(schema.combo_detalle_pre_ventas).values({
              branch_id: branchId,
              detalle_pre_venta_id: nuevoDetalle.id,
              producto_componente_id: comp.comp_producto_uuid,
              presentacion_componente_id: comp.presentacion_componente_id,
              producto_nombre_snapshot: comp.prod_nombre || 'COMPONENTE',
              presentacion_nombre_snapshot: comp.comp_nombre || 'UNIDAD',
              cantidad_base_prevista: cantBasePrevistaComp,
              multiplica_por_snapshot: multiplicaComp
            })
          }
        }
      }

      return nuevaPreventa
    })
  },

  // Actualizar preventa existente
  async actualizarPreventa(id, payload) {
    const {
      cliente_id,
      tipo_documento,
      placa,
      alias,
      items = [],
      total = 0
    } = payload

    const [existente] = await db
      .select()
      .from(schema.pre_ventas)
      .where(eq(schema.pre_ventas.id, id))

    if (!existente) {
      const error = new Error('Preventa no encontrada para actualizar')
      error.statusCode = 404
      throw error
    }

    if (existente.estado === 'PROCESADA') {
      const error = new Error('No se puede editar una preventa que ya fue PROCESADA')
      error.statusCode = 400
      throw error
    }

    const tipoComprobanteId =
      tipo_documento === 'factura' ? '01' : tipo_documento === 'boleta' ? '03' : tipo_documento === 'vale' ? 'VL' : (existente.tipo_comprobante_id || 'VL')

    const { factorPrecio, factorVolumen } = await getFactores()

    await db.transaction(async (tx) => {
      // Pre-cargar tipo_tributo de BD para productos si no vienen explícitos
      const prodIds = items.map((i) => i.producto_id || i.id).filter(isUUID)
      let prodsMap = {}
      if (prodIds.length > 0) {
        const prodsDb = await tx
          .select({
            id: schema.productos.id,
            tipo_tributo: schema.productos.tipo_tributo,
            es_combo: schema.productos.es_combo
          })
          .from(schema.productos)
          .where(inArray(schema.productos.id, prodIds))
        prodsDb.forEach((p) => {
          prodsMap[p.id] = {
            tipo_tributo: p.tipo_tributo,
            es_combo: p.es_combo
          }
        })
      }

      let gravadasTotalCalc = 0
      let exoneradasTotalCalc = 0
      let inafectasTotalCalc = 0
      let gratuitasTotalCalc = 0
      let igvTotalCalc = 0

      const itemsProcesados = items.map((item) => {
        const prodId = item.producto_id || item.id
        const cantVisual = Number(item.cantidad || 1)
        const precioVisual = Number(item.precio_unitario || item.precio || 0)
        const descVisual = Number(item.descuento || 0)
        const isGratuito = Boolean(item.gratuito || item.es_gratuito)

        const afectacionRaw = String(item.tipo_afectacion_igv || prodsMap[prodId]?.tipo_tributo || '10').trim()
        const afectacionNum = parseInt(afectacionRaw, 10) || 10

        let itemSubtotalVisual = 0
        let itemIgvVisual = 0
        let itemTotalVisual = 0

        if (isGratuito || (afectacionNum >= 11 && afectacionNum <= 16) || afectacionNum === 21 || (afectacionNum >= 31 && afectacionNum <= 37)) {
          itemTotalVisual = 0
          itemSubtotalVisual = 0
          itemIgvVisual = 0
          gratuitasTotalCalc += Number((cantVisual * precioVisual).toFixed(2))
        } else if (afectacionNum === 20) {
          itemTotalVisual = Math.max(0, Number((cantVisual * precioVisual - descVisual).toFixed(2)))
          itemSubtotalVisual = itemTotalVisual
          itemIgvVisual = 0
          exoneradasTotalCalc += itemSubtotalVisual
        } else if (afectacionNum === 30 || afectacionNum === 40) {
          itemTotalVisual = Math.max(0, Number((cantVisual * precioVisual - descVisual).toFixed(2)))
          itemSubtotalVisual = itemTotalVisual
          itemIgvVisual = 0
          inafectasTotalCalc += itemSubtotalVisual
        } else {
          itemTotalVisual = Math.max(0, Number((cantVisual * precioVisual - descVisual).toFixed(2)))
          itemSubtotalVisual = Number((itemTotalVisual / 1.18).toFixed(2))
          itemIgvVisual = Number((itemTotalVisual - itemSubtotalVisual).toFixed(2))
          gravadasTotalCalc += itemSubtotalVisual
          igvTotalCalc += itemIgvVisual
        }

        return {
          ...item,
          prodId,
          cantVisual,
          precioVisual,
          descVisual,
          afectacionNum,
          itemTotalVisual,
          itemSubtotalVisual,
          itemIgvVisual
        }
      })

      const totalVisual = Number(total || 0) > 0
        ? Number(total)
        : Number((gravadasTotalCalc + igvTotalCalc + exoneradasTotalCalc + inafectasTotalCalc).toFixed(2))

      const gravadasInt = Math.round(gravadasTotalCalc * factorPrecio)
      const exoneradasInt = Math.round(exoneradasTotalCalc * factorPrecio)
      const inafectasInt = Math.round(inafectasTotalCalc * factorPrecio)
      const igvInt = Math.round(igvTotalCalc * factorPrecio)
      const totalVentaInt = Math.round(totalVisual * factorPrecio)

      // A. Actualizar cabecera
      const aliasFinal = alias !== undefined ? alias : (placa !== undefined ? placa : existente.alias)
      await tx
        .update(schema.pre_ventas)
        .set({
          cliente_id: isUUID(cliente_id) ? cliente_id : (existente.cliente_id || null),
          tipo_comprobante_id: tipoComprobanteId,
          alias: aliasFinal,
          gravadas: gravadasInt,
          exoneradas: exoneradasInt,
          inafectas: inafectasInt,
          igv: igvInt,
          total_venta: totalVentaInt,
          updated_at: sql`NOW()`
        })
        .where(eq(schema.pre_ventas.id, id))

      // B. Reemplazar detalle si vienen ítems
      if (itemsProcesados && itemsProcesados.length > 0) {
        const detallesAnteriores = await tx
          .select({ id: schema.detalle_pre_ventas.id })
          .from(schema.detalle_pre_ventas)
          .where(eq(schema.detalle_pre_ventas.preventa_id, id))

        if (detallesAnteriores.length > 0) {
          const antDetIds = detallesAnteriores.map((d) => d.id)
          await tx
            .delete(schema.combo_detalle_pre_ventas)
            .where(inArray(schema.combo_detalle_pre_ventas.detalle_pre_venta_id, antDetIds))
        }

        await tx.delete(schema.detalle_pre_ventas).where(eq(schema.detalle_pre_ventas.preventa_id, id))

        for (const item of itemsProcesados) {
          const prodId = item.prodId
          if (!prodId || !isUUID(prodId)) continue

          let presId = isUUID(item.presentacion_id) ? item.presentacion_id : null
          if (!presId) {
            const [pres] = await tx
              .select({ id: schema.presentaciones.id })
              .from(schema.presentaciones)
              .where(eq(schema.presentaciones.producto_uuid, prodId))
              .limit(1)
            presId = pres?.id || null
          }

          if (!presId) {
            const [nuevaPres] = await tx
              .insert(schema.presentaciones)
              .values({
                producto_uuid: prodId,
                nombre: item.nombre_completo || item.producto_nombre || 'UNIDAD',
                precio_venta: Math.round(Number(item.precioVisual || 0) * factorPrecio)
              })
              .returning()
            presId = nuevaPres.id
          }

          const cantInt = toVolumenInt(item.cantVisual, factorVolumen)
          const precioInt = Math.round(item.precioVisual * factorPrecio)
          const itemTotalInt = Math.round(item.itemTotalVisual * factorPrecio)
          const itemSubtotalInt = Math.round(item.itemSubtotalVisual * factorPrecio)
          const itemIgvInt = Math.round(item.itemIgvVisual * factorPrecio)

          const [nuevoDetalle] = await tx
            .insert(schema.detalle_pre_ventas)
            .values({
              preventa_id: id,
              producto_id: prodId,
              presentacion_id: presId,
              cantidad: cantInt,
              precio_unitario: precioInt,
              subtotal: itemSubtotalInt,
              igv: itemIgvInt,
              total: itemTotalInt
            })
            .returning()

          // C. Si es combo, registrar componentes
          const esCombo = Boolean(prodsMap[prodId]?.es_combo)
          if (presId && (esCombo || item.es_combo)) {
            const componentes = await tx
              .select({
                id: schema.combo_detalles.id,
                presentacion_componente_id: schema.combo_detalles.presentacion_componente_id,
                cantidad: schema.combo_detalles.cantidad,
                comp_nombre: schema.presentaciones.nombre,
                comp_producto_uuid: schema.presentaciones.producto_uuid,
                comp_multiplica_por: schema.presentaciones.multiplica_por,
                prod_nombre: schema.productos.nombre
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
                  eq(schema.combo_detalles.presentacion_combo_id, presId),
                  eq(schema.combo_detalles.activo, true)
                )
              )

            for (const comp of componentes) {
              const cantCompItem = Number(comp.cantidad || 1)
              const multiplicaComp = Math.max(1, Number(comp.comp_multiplica_por || 1))
              const cantBasePrevistaComp = toVolumenInt(
                item.cantVisual * cantCompItem * multiplicaComp,
                factorVolumen
              )

              await tx.insert(schema.combo_detalle_pre_ventas).values({
                branch_id: existente.branch_id,
                detalle_pre_venta_id: nuevoDetalle.id,
                producto_componente_id: comp.comp_producto_uuid,
                presentacion_componente_id: comp.presentacion_componente_id,
                producto_nombre_snapshot: comp.prod_nombre || 'COMPONENTE',
                presentacion_nombre_snapshot: comp.comp_nombre || 'UNIDAD',
                cantidad_base_prevista: cantBasePrevistaComp,
                multiplica_por_snapshot: multiplicaComp
              })
            }
          }
        }
      }
    })

    return { id }
  },

  // Anulación lógica de preventa (Soft Delete / Inactivación)
  async anularPreventa(id, { branchId, esSuperAdmin }) {
    const preventa = await preventasRepository.getRawPreventaById(id, { branchId, esSuperAdmin })
    if (!preventa) {
      const error = new Error('La pre-venta no existe o no pertenece a su sucursal activa')
      error.statusCode = 404
      throw error
    }

    const estadoActual = String(preventa.estado || '').toUpperCase()
    if (estadoActual === 'PROCESADA') {
      const error = new Error('No se puede anular una pre-venta que ya ha sido procesada/cobrada')
      error.statusCode = 400
      throw error
    }

    if (estadoActual === 'ANULADO' || estadoActual === 'CANCELADA') {
      const error = new Error('La pre-venta ya se encuentra anulada')
      error.statusCode = 400
      throw error
    }

    return preventasRepository.inactivatePreventa(id)
  }
}

module.exports = preventasService
