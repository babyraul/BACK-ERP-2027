'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, sql, desc } = require('drizzle-orm')
const ventasRepository = require('../repositories/ventas.repository')
const { getFactores, normalizeVolumenInt } = require('../../../utils/factores')

/**
 * Caso de Uso Especializado: Anulación y Reversión Integral de Ventas
 */
const anularVentaService = {
  async anularVenta(id, { motivo, usuarioId }) {
    const venta = await ventasRepository.getRawVentaById(id)
    if (!venta) {
      const error = new Error('Venta no encontrada')
      error.statusCode = 404
      throw error
    }

    const estActual = String(venta.estado || '').toUpperCase()
    if (estActual === 'ANULADO' || estActual === 'ANULADA') {
      const error = new Error('El comprobante ya se encuentra anulado')
      error.statusCode = 400
      throw error
    }

    const numeroComprobante = `${venta.serie || 'S/N'}-${String(venta.correlativo || 0).padStart(8, '0')}`
    const userIdOperador = usuarioId || venta.usuario_id
    const { factorVolumen } = await getFactores()

    return db.transaction(async (tx) => {
      // 1. Marcar venta como ANULADO (Inactivación / Baja lógica del comprobante)
      await tx
        .update(schema.ventas)
        .set({
          estado: 'ANULADO',
          observacion_venta: motivo ? `ANULADO: ${motivo}` : 'ANULADO',
          updated_at: sql`NOW()`
        })
        .where(eq(schema.ventas.id, id))

      // 2. Obtener almacén de la sucursal de la venta
      const [almacen] = await tx
        .select({ id: schema.almacenes.id })
        .from(schema.almacenes)
        .where(eq(schema.almacenes.branch_id, venta.branch_id))
        .orderBy(desc(schema.almacenes.es_principal))
        .limit(1)

      // 3. Revertir stock de los ítems vendidos (tipo_mov: 1 = Entrada por anulación)
      if (almacen) {
        const detalles = await tx
          .select()
          .from(schema.detalle_ventas)
          .where(eq(schema.detalle_ventas.venta_id, id))

        for (const det of detalles) {
          if (!det.producto_id || !det.presentacion_id) continue

          // Verificar si el detalle tiene desglose en combo_detalle_ventas
          const componentesVenta = await tx
            .select()
            .from(schema.combo_detalle_ventas)
            .where(eq(schema.combo_detalle_ventas.detalle_venta_id, det.id))

          if (componentesVenta.length > 0) {
            // Revertir stock de cada producto componente
            for (const comp of componentesVenta) {
              if (!comp.producto_componente_id || !comp.presentacion_componente_id) continue

              const cantBaseCompInt = normalizeVolumenInt(comp.cantidad_base, factorVolumen)
              const multiplicaComp = Math.max(1, Number(comp.multiplica_por_snapshot || 1))
              const cantCompInt = Math.round(cantBaseCompInt / multiplicaComp)

              const stockCompRows = await tx
                .select()
                .from(schema.stock_actual)
                .where(
                  and(
                    eq(schema.stock_actual.branch_id, venta.branch_id),
                    eq(schema.stock_actual.almacen_id, almacen.id),
                    eq(schema.stock_actual.producto_id, comp.producto_componente_id)
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

              const nuevoSaldoBaseCompInt = saldoCompAnteriorInt + cantBaseCompInt

              if (stockCompExistente) {
                const saldoFilaCompInt = normalizeVolumenInt(stockCompExistente.saldo_actual, factorVolumen)
                const nuevoSaldoFilaCompInt = saldoFilaCompInt + cantBaseCompInt
                await tx
                  .update(schema.stock_actual)
                  .set({
                    saldo_actual: nuevoSaldoFilaCompInt,
                    updated_at: sql`NOW()`
                  })
                  .where(eq(schema.stock_actual.id, stockCompExistente.id))
              } else {
                await tx.insert(schema.stock_actual).values({
                  branch_id: venta.branch_id,
                  almacen_id: almacen.id,
                  producto_id: comp.producto_componente_id,
                  presentacion_id: comp.presentacion_componente_id,
                  lotes_id: null,
                  saldo_actual: cantBaseCompInt,
                  updated_at: sql`NOW()`
                })
              }

              await tx.insert(schema.stock).values({
                producto_id: comp.producto_componente_id,
                presentacion_id: comp.presentacion_componente_id,
                lotes_id: null,
                cantidad: cantCompInt,
                multiplica_por: multiplicaComp,
                cantidad_base: cantBaseCompInt,
                saldo: nuevoSaldoBaseCompInt,
                documento_id: venta.id,
                documento: numeroComprobante,
                tipo_mov: 1, // Entrada por anulación
                concepto: motivo
                  ? `ANULACIÓN VENTA COMBO - ${numeroComprobante} (${motivo})`
                  : `ANULACIÓN VENTA COMBO - ${numeroComprobante}`,
                usuario_id: userIdOperador,
                branch_id: venta.branch_id,
                almacen_id: almacen.id
              })
            }
          } else {
            // Producto individual estándar
            const [pres] = await tx
              .select({ multiplica_por: schema.presentaciones.multiplica_por })
              .from(schema.presentaciones)
              .where(eq(schema.presentaciones.id, det.presentacion_id))
              .limit(1)

            const multiplicaPor = Math.max(1, Number(pres?.multiplica_por || 1))
            const cantInt = normalizeVolumenInt(det.cantidad, factorVolumen)
            const cantidadBaseInt = cantInt * multiplicaPor

            const stockProductoRows = await tx
              .select()
              .from(schema.stock_actual)
              .where(
                and(
                  eq(schema.stock_actual.branch_id, venta.branch_id),
                  eq(schema.stock_actual.almacen_id, almacen.id),
                  eq(schema.stock_actual.producto_id, det.producto_id)
                )
              )
              .for('update')

            const saldoBaseAnteriorInt = stockProductoRows.reduce(
              (acc, r) => acc + normalizeVolumenInt(r.saldo_actual, factorVolumen),
              0
            )
            const stockExistente = stockProductoRows.find(
              (r) => r.presentacion_id === det.presentacion_id
            )

            const nuevoSaldoBaseTotalInt = saldoBaseAnteriorInt + cantidadBaseInt

            if (stockExistente) {
              const saldoFilaActualInt = normalizeVolumenInt(stockExistente.saldo_actual, factorVolumen)
              const nuevoSaldoFilaInt = saldoFilaActualInt + cantidadBaseInt
              await tx
                .update(schema.stock_actual)
                .set({
                  saldo_actual: nuevoSaldoFilaInt,
                  updated_at: sql`NOW()`
                })
                .where(eq(schema.stock_actual.id, stockExistente.id))
            } else {
              await tx.insert(schema.stock_actual).values({
                branch_id: venta.branch_id,
                almacen_id: almacen.id,
                producto_id: det.producto_id,
                presentacion_id: det.presentacion_id,
                lotes_id: null,
                saldo_actual: cantidadBaseInt,
                updated_at: sql`NOW()`
              })
            }

            await tx.insert(schema.stock).values({
              producto_id: det.producto_id,
              presentacion_id: det.presentacion_id,
              lotes_id: null,
              cantidad: cantInt,
              multiplica_por: multiplicaPor,
              cantidad_base: cantidadBaseInt,
              saldo: nuevoSaldoBaseTotalInt,
              documento_id: venta.id,
              documento: numeroComprobante,
              tipo_mov: 1,
              concepto: motivo
                ? `ANULACIÓN VENTA - ${numeroComprobante} (${motivo})`
                : `ANULACIÓN VENTA - ${numeroComprobante}`,
              usuario_id: userIdOperador,
              branch_id: venta.branch_id,
              almacen_id: almacen.id
            })
          }
        }
      }

      return venta
    })
  }
}

module.exports = anularVentaService
