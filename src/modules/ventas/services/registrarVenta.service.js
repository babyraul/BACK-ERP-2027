'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, sql, inArray, desc } = require('drizzle-orm')
const ventasRepository = require('../repositories/ventas.repository')
const { calcularTotalesVenta } = require('../../../utils/Operaciones')
const {
  getFactores,
  toVolumenInt,
  normalizeVolumenInt
} = require('../../../utils/factores')

const isUUID = (str) =>
  Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

/**
 * Caso de Uso Especializado: Registro y Procesamiento Transaccional de Venta
 */
const registrarVentaService = {
  async procesarVenta(payload, { branchId, usuarioId }) {
    const {
      preventa_id,
      tipo_documento, // 'factura', 'boleta', 'vale'
      cliente_id,
      placa,
      alias,
      observaciones,
      orden_compra,
      guia_remision,
      pagos = [],
      items = [],
      gravado = 0,
      exonerado = 0,
      inafecto = 0,
      gratuito = 0,
      icbper = 0,
      igv = 0,
      total = 0
    } = payload

    if (!branchId) {
      const error = new Error('El usuario no tiene una sucursal activa')
      error.statusCode = 400
      throw error
    }

    // Validar monto >= 700 para clientes anónimos (Regla Fiscal SUNAT RN-V03)
    let clienteDoc = null
    if (cliente_id && isUUID(cliente_id)) {
      clienteDoc = await ventasRepository.getClienteDoc(cliente_id)
    }

    const esClienteGenerico = !clienteDoc || clienteDoc === '99999999' || clienteDoc === '00000000'
    const totalNum = Number(total || 0)
    if (totalNum >= 700 && esClienteGenerico && tipo_documento !== 'vale') {
      const error = new Error('Para montos mayores o iguales a S/. 700.00 SUNAT exige identificar al cliente con DNI o RUC.')
      error.statusCode = 422
      throw error
    }

    // Obtener turno activo del usuario en la sucursal (RN-V01 y RN-V02)
    const turnoActivo = await ventasRepository.getTurnoActivo(branchId, usuarioId)
    if (!turnoActivo) {
      const error = new Error('No tiene un turno de caja abierto para registrar ventas. Por favor aperture un turno en el módulo Caja.')
      error.statusCode = 400
      throw error
    }

    // Validación RN-V02: Cierre vencido a las 03:30 AM del día siguiente
    if (turnoActivo.fecha_apertura) {
      const fechaApertura = new Date(turnoActivo.fecha_apertura)
      const ahora = new Date()
      const limiteVencimiento = new Date(fechaApertura)
      limiteVencimiento.setDate(limiteVencimiento.getDate() + 1)
      limiteVencimiento.setHours(3, 30, 0, 0)

      if (ahora > limiteVencimiento) {
        const error = new Error('El turno de caja activo está vencido (límite superado: 03:30 AM del día siguiente). Debe realizar el arqueo y cierre de caja antes de continuar vendiendo.')
        error.statusCode = 400
        throw error
      }
    }

    // Validación de concurrencia: Si proviene de preventa, verificar que no esté ya PROCESADA
    if (preventa_id) {
      const pv = await ventasRepository.getPreventaEstado(preventa_id)
      if (pv && pv.estado === 'PROCESADA') {
        const error = new Error('Esta preventa ya ha sido procesada previamente. No se puede cobrar dos veces.')
        error.statusCode = 400
        throw error
      }
    }

    const tipoDocNormalized = String(tipo_documento || 'boleta').toLowerCase()
    const tipoComprobanteId =
      tipoDocNormalized === 'factura' ? '01' : tipoDocNormalized === 'boleta' ? '03' : 'VL'

    // Iniciar Transacción Atómica
    return db.transaction(async (tx) => {
      // A. Asignar Serie y Correlativo atómico con bloqueo pesimista FOR UPDATE
      const [serieConfig] = await tx
        .select()
        .from(schema.caja_serie_correlativo)
        .where(
          and(
            eq(schema.caja_serie_correlativo.branch_id, branchId),
            eq(schema.caja_serie_correlativo.tipo_comprobante_id, tipoComprobanteId),
            eq(schema.caja_serie_correlativo.activo, true)
          )
        )
        .limit(1)
        .for('update')

      if (!serieConfig) {
        const docNombre = tipoComprobanteId === '01' ? 'Factura' : tipoComprobanteId === '03' ? 'Boleta' : 'Vale'
        const error = new Error(
          `No existe una serie activa configurada en caja_serie_correlativo para el tipo de comprobante ${docNombre} (${tipoComprobanteId}) en esta sucursal.`
        )
        error.statusCode = 400
        throw error
      }

      const serieAsignada = serieConfig.serie
      const correlativoAsignado = (serieConfig.correlativo || 0) + 1

      // Incrementar correlativo de forma atómica en la fila bloqueada
      await tx
        .update(schema.caja_serie_correlativo)
        .set({
          correlativo: correlativoAsignado,
          updated_at: sql`NOW()`
        })
        .where(eq(schema.caja_serie_correlativo.id, serieConfig.id))

      const { factorPrecio, factorVolumen } = await getFactores()

      // Pre-cargar productos para asegurar su tipo_afectacion_igv real desde BD
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
      const gratuitasTotalCalc = totalesCalc.gratuito

      const totalVisual = Number(total || 0) > 0 ? Number(total) : totalesCalc.total

      const gravadasInt = Math.round(gravadasTotalCalc * factorPrecio)
      const exoneradasInt = Math.round(exoneradasTotalCalc * factorPrecio)
      const inafectasInt = Math.round(inafectasTotalCalc * factorPrecio)
      const gratuitasInt = Math.round(gratuitasTotalCalc * factorPrecio)
      const igvInt = Math.round(igvTotalCalc * factorPrecio)
      const totalVentaInt = Math.round(totalVisual * factorPrecio)

      // B. Insertar cabecera de la Venta
      const [nuevaVenta] = await tx
        .insert(schema.ventas)
        .values({
          branch_id: branchId,
          preventa_id: isUUID(preventa_id) ? preventa_id : null,
          caja_turno_id: turnoActivo?.id || null,
          usuario_id: usuarioId,
          cliente_id: isUUID(cliente_id) ? cliente_id : null,
          alias: alias || placa || null,
          tipo_comprobante_id: tipoComprobanteId,
          serie: serieAsignada,
          correlativo: correlativoAsignado,
          moneda: 'PEN',
          tipo_cambio: 1,
          gravadas: gravadasInt,
          exoneradas: exoneradasInt,
          inafectas: inafectasInt,
          gratuitas: gratuitasInt,
          igv: igvInt,
          total_venta: totalVentaInt,
          observacion_venta: observaciones || null,
          estado: 'EMITIDO',
          estado_pago: 'PAGADO',
          facturado: false,
          fecha_emision: sql`NOW()`
        })
        .returning()

      const numeroComprobante = `${serieAsignada}-${String(correlativoAsignado).padStart(8, '0')}`

      // Resolver almacén principal de la sucursal
      let [almacen] = await tx
        .select({ id: schema.almacenes.id })
        .from(schema.almacenes)
        .where(and(eq(schema.almacenes.branch_id, branchId), eq(schema.almacenes.activo, true)))
        .orderBy(desc(schema.almacenes.es_principal))
        .limit(1)

      if (!almacen) {
        ;[almacen] = await tx
          .insert(schema.almacenes)
          .values({
            branch_id: branchId,
            nombre: 'ALMACÉN PRINCIPAL',
            codigo: 'ALM-01',
            es_principal: true,
            activo: true
          })
          .returning({ id: schema.almacenes.id })
      }

      // C. Insertar detalle de venta y registrar movimiento de stock
      for (const item of itemsProcesados) {
        let presId = item.presentacion_id
        let multiplicaPor = 1

        if (presId) {
          const [presInfo] = await tx
            .select({ id: schema.presentaciones.id, multiplica_por: schema.presentaciones.multiplica_por })
            .from(schema.presentaciones)
            .where(eq(schema.presentaciones.id, presId))
            .limit(1)
          if (presInfo) {
            multiplicaPor = Math.max(1, Number(presInfo.multiplica_por || 1))
          } else {
            presId = null
          }
        }

        if (!presId && item.producto_id) {
          const [pres] = await tx
            .select({ id: schema.presentaciones.id, multiplica_por: schema.presentaciones.multiplica_por })
            .from(schema.presentaciones)
            .where(eq(schema.presentaciones.producto_uuid, item.producto_id))
            .orderBy(schema.presentaciones.created_at)
            .limit(1)
          presId = pres?.id || null
          multiplicaPor = Math.max(1, Number(pres?.multiplica_por || 1))
        }

        if (!presId) {
          const [prodInfo] = await tx
            .select({ unidad_medida_id: schema.productos.unidad_medida_id })
            .from(schema.productos)
            .where(eq(schema.productos.id, item.producto_id))
            .limit(1)

          const [nuevaPres] = await tx
            .insert(schema.presentaciones)
            .values({
              producto_uuid: item.producto_id,
              nombre: item.nombre || item.nombre_completo || 'PRINCIPAL',
              unidad_medida_id: prodInfo?.unidad_medida_id || 'NIU',
              multiplica_por: 1,
              precio_venta: Math.round(Number(item.precio_unitario || 0) * factorPrecio)
            })
            .returning()
          presId = nuevaPres.id
          multiplicaPor = 1
        }

        const cantVisual = item.cantVisual
        const cantidadBaseVisual = cantVisual * multiplicaPor
        const cantInt = toVolumenInt(cantVisual, factorVolumen)
        const cantidadBaseInt = toVolumenInt(cantidadBaseVisual, factorVolumen)
        const precioInt = Math.round(item.precioVisual * factorPrecio)
        const descInt = Math.round(item.descVisual * factorPrecio)
        const itemTotalInt = Math.round(item.itemTotalVisual * factorPrecio)
        const itemSubtotalInt = Math.round(item.itemSubtotalVisual * factorPrecio)
        const itemIgvInt = Math.round(item.itemIgvVisual * factorPrecio)

        const [nuevoDetalleVenta] = await tx
          .insert(schema.detalle_ventas)
          .values({
            venta_id: nuevaVenta.id,
            producto_id: item.producto_id,
            presentacion_id: presId,
            cantidad: cantInt,
            precio_unitario: precioInt,
            subtotal: itemSubtotalInt,
            igv: itemIgvInt,
            total: itemTotalInt,
            descuento: descInt,
            tipo_afectacion_igv: item.afectacionNum
          })
          .returning()

        // D. Descontar stock de combos o productos individuales
        const esCombo = Boolean(prodsMap[item.producto_id]?.es_combo || item.es_combo)
        let componentes = []
        if (presId && (esCombo || item.es_combo)) {
          componentes = await tx
            .select({
              id: schema.combo_detalles.id,
              presentacion_componente_id: schema.combo_detalles.presentacion_componente_id,
              cantidad: schema.combo_detalles.cantidad,
              precio_final: schema.combo_detalles.precio_final,
              comp_nombre: schema.presentaciones.nombre,
              comp_producto_uuid: schema.presentaciones.producto_uuid,
              comp_multiplica_por: schema.presentaciones.multiplica_por,
              comp_precio_costo: schema.presentaciones.precio_costo,
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
        }

        if (componentes.length > 0) {
          // ES UN COMBO: Se descuenta el stock de cada sub-producto componente y se audita en combo_detalle_ventas
          for (const comp of componentes) {
            const cantCompItem = Number(comp.cantidad || 1)
            const multiplicaComp = Math.max(1, Number(comp.comp_multiplica_por || 1))
            const cantCompTotalVisual = cantVisual * cantCompItem
            const cantCompTotalBaseVisual = cantCompTotalVisual * multiplicaComp
            const cantCompInt = toVolumenInt(cantCompTotalVisual, factorVolumen)
            const cantCompBaseInt = toVolumenInt(cantCompTotalBaseVisual, factorVolumen)

            let nuevoSaldoBaseCompInt = 0
            if (almacen && comp.comp_producto_uuid && comp.presentacion_componente_id) {
              const stockCompRows = await tx
                .select()
                .from(schema.stock_actual)
                .where(
                  and(
                    eq(schema.stock_actual.branch_id, branchId),
                    eq(schema.stock_actual.almacen_id, almacen.id),
                    eq(schema.stock_actual.producto_id, comp.comp_producto_uuid)
                  )
                )
                .for('update')

              const saldoCompAnteriorInt = stockCompRows.reduce(
                (acc, r) => acc + normalizeVolumenInt(r.saldo_actual, factorVolumen),
                0
              )
              const stockCompExistente = stockCompRows.find(
                (r) => r.presentacion_id === comp.presentacion_componente_id
              )

              nuevoSaldoBaseCompInt = saldoCompAnteriorInt - cantCompBaseInt

              if (stockCompExistente) {
                const saldoFilaCompInt = normalizeVolumenInt(stockCompExistente.saldo_actual, factorVolumen)
                const nuevoSaldoFilaCompInt = saldoFilaCompInt - cantCompBaseInt
                await tx
                  .update(schema.stock_actual)
                  .set({
                    saldo_actual: nuevoSaldoFilaCompInt,
                    updated_at: sql`NOW()`
                  })
                  .where(eq(schema.stock_actual.id, stockCompExistente.id))
              } else {
                await tx.insert(schema.stock_actual).values({
                  branch_id: branchId,
                  almacen_id: almacen.id,
                  producto_id: comp.comp_producto_uuid,
                  presentacion_id: comp.presentacion_componente_id,
                  lotes_id: null,
                  saldo_actual: 0 - cantCompBaseInt,
                  updated_at: sql`NOW()`
                })
              }

              // Registrar movimiento en Kárdex
              const [movStock] = await tx
                .insert(schema.stock)
                .values({
                  producto_id: comp.comp_producto_uuid,
                  presentacion_id: comp.presentacion_componente_id,
                  lotes_id: null,
                  cantidad: cantCompInt,
                  multiplica_por: multiplicaComp,
                  cantidad_base: cantCompBaseInt,
                  saldo: nuevoSaldoBaseCompInt,
                  documento_id: nuevaVenta.id,
                  documento: numeroComprobante,
                  tipo_mov: 2, // Salida por venta
                  concepto: `VENTA COMBO (${item.nombre_completo || 'COMBO'}) - ${numeroComprobante}`,
                  usuario_id: usuarioId,
                  branch_id: branchId,
                  almacen_id: almacen.id
                })
                .returning({ id: schema.stock.id })

              const costoUnitarioBase = (Number(comp.comp_precio_costo || 0) / (factorPrecio * multiplicaComp)).toFixed(6)
              const costoTotalSnapshot = Math.round(Number(costoUnitarioBase) * cantCompTotalBaseVisual * factorPrecio)
              const precioProporcionalHistorico = Math.round(Number(comp.precio_final || 0) * cantVisual)

              await tx.insert(schema.combo_detalle_ventas).values({
                branch_id: branchId,
                detalle_venta_id: nuevoDetalleVenta.id,
                producto_componente_id: comp.comp_producto_uuid,
                presentacion_componente_id: comp.presentacion_componente_id,
                producto_nombre_snapshot: comp.prod_nombre || 'COMPONENTE',
                presentacion_nombre_snapshot: comp.comp_nombre || 'UNIDAD',
                lote_id: null,
                stock_movimiento_id: movStock.id,
                cantidad_base: cantCompBaseInt,
                multiplica_por_snapshot: multiplicaComp,
                costo_unitario_base_snapshot: String(costoUnitarioBase),
                costo_total_snapshot: costoTotalSnapshot,
                precio_proporcional_historico: precioProporcionalHistorico
              })
            }
          }

          // Registrar movimiento en Kárdex y saldo para el propio combo
          if (almacen && item.producto_id && presId) {
            const stockComboRows = await tx
              .select()
              .from(schema.stock_actual)
              .where(
                and(
                  eq(schema.stock_actual.branch_id, branchId),
                  eq(schema.stock_actual.almacen_id, almacen.id),
                  eq(schema.stock_actual.producto_id, item.producto_id)
                )
              )
              .for('update')

            const saldoComboAnteriorInt = stockComboRows.reduce(
              (acc, r) => acc + normalizeVolumenInt(r.saldo_actual, factorVolumen),
              0
            )
            const stockComboExistente = stockComboRows.find(
              (r) => r.presentacion_id === presId
            )

            const nuevoSaldoComboTotalInt = saldoComboAnteriorInt - cantidadBaseInt

            if (stockComboExistente) {
              const saldoFilaComboInt = normalizeVolumenInt(stockComboExistente.saldo_actual, factorVolumen)
              const nuevoSaldoFilaComboInt = saldoFilaComboInt - cantidadBaseInt
              await tx
                .update(schema.stock_actual)
                .set({
                  saldo_actual: nuevoSaldoFilaComboInt,
                  updated_at: sql`NOW()`
                })
                .where(eq(schema.stock_actual.id, stockComboExistente.id))
            } else {
              await tx.insert(schema.stock_actual).values({
                branch_id: branchId,
                almacen_id: almacen.id,
                producto_id: item.producto_id,
                presentacion_id: presId,
                lotes_id: null,
                saldo_actual: 0 - cantidadBaseInt,
                updated_at: sql`NOW()`
              })
            }

            await tx.insert(schema.stock).values({
              producto_id: item.producto_id,
              presentacion_id: presId,
              lotes_id: null,
              cantidad: cantInt,
              multiplica_por: multiplicaPor,
              cantidad_base: cantidadBaseInt,
              saldo: nuevoSaldoComboTotalInt,
              documento_id: nuevaVenta.id,
              documento: numeroComprobante,
              tipo_mov: 2,
              concepto: `VENTA COMBO (${item.nombre_completo || 'COMBO'}) - ${numeroComprobante}`,
              usuario_id: usuarioId,
              branch_id: branchId,
              almacen_id: almacen.id
            })
          }
        } else {
          // PRODUCTO INDIVIDUAL: Actualizar stock_actual de este producto e insertar Kárdex
          if (almacen && item.producto_id && presId) {
            const stockProductoRows = await tx
              .select()
              .from(schema.stock_actual)
              .where(
                and(
                  eq(schema.stock_actual.branch_id, branchId),
                  eq(schema.stock_actual.almacen_id, almacen.id),
                  eq(schema.stock_actual.producto_id, item.producto_id)
                )
              )
              .for('update')

            const saldoBaseAnteriorInt = stockProductoRows.reduce(
              (acc, r) => acc + normalizeVolumenInt(r.saldo_actual, factorVolumen),
              0
            )
            const stockExistente = stockProductoRows.find(
              (r) => r.presentacion_id === presId
            )

            const nuevoSaldoBaseTotalInt = saldoBaseAnteriorInt - cantidadBaseInt

            if (stockExistente) {
              const saldoFilaActualInt = normalizeVolumenInt(stockExistente.saldo_actual, factorVolumen)
              const nuevoSaldoFilaInt = saldoFilaActualInt - cantidadBaseInt
              await tx
                .update(schema.stock_actual)
                .set({
                  saldo_actual: nuevoSaldoFilaInt,
                  updated_at: sql`NOW()`
                })
                .where(eq(schema.stock_actual.id, stockExistente.id))
            } else {
              await tx.insert(schema.stock_actual).values({
                branch_id: branchId,
                almacen_id: almacen.id,
                producto_id: item.producto_id,
                presentacion_id: presId,
                lotes_id: null,
                saldo_actual: 0 - cantidadBaseInt,
                updated_at: sql`NOW()`
              })
            }

            await tx.insert(schema.stock).values({
              producto_id: item.producto_id,
              presentacion_id: presId,
              lotes_id: null,
              cantidad: cantInt,
              multiplica_por: multiplicaPor,
              cantidad_base: cantidadBaseInt,
              saldo: nuevoSaldoBaseTotalInt,
              documento_id: nuevaVenta.id,
              documento: numeroComprobante,
              tipo_mov: 2,
              concepto: `VENTA - ${numeroComprobante}`,
              usuario_id: usuarioId,
              branch_id: branchId,
              almacen_id: almacen.id
            })
          }
        }
      }

      // E. Insertar métodos de pago en ventas_pagos
      for (const p of pagos) {
        const montoInt = Math.round(Number(p.monto || 0) * factorPrecio)
        await tx.insert(schema.ventas_pagos).values({
          branch_id: branchId,
          venta_id: nuevaVenta.id,
          usuario_id: usuarioId,
          numero_cuota: 1,
          metodo_pago_id: String(p.tipo_metodo_pago_id || '1'),
          monto: montoInt,
          numero_operacion: p.referencia || null,
          estado: 'PAGADO',
          fecha_pago: sql`NOW()`
        })
      }

      // F. Actualizar preventa a 'PROCESADA' si venía de preventa
      if (preventa_id) {
        await tx
          .update(schema.pre_ventas)
          .set({
            estado: 'PROCESADA',
            updated_at: sql`NOW()`
          })
          .where(eq(schema.pre_ventas.id, preventa_id))
      }

      return {
        ...nuevaVenta,
        numero: `${serieAsignada}-${String(correlativoAsignado).padStart(8, '0')}`,
        facturado: false
      }
    })
  }
}

module.exports = registrarVentaService
