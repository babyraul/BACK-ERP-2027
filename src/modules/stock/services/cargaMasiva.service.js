'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, desc, inArray, sql } = require('drizzle-orm')
const stockRepository = require('../repositories/stock.repository')
const {
  getFactores,
  toVolumenInt,
  normalizeVolumenInt,
  toVolumenVisual
} = require('../../../utils/factores')

/**
 * Caso de Uso: Carga Masiva e Inventario Físico en Unidad Base
 */
const cargaMasivaService = {
  async procesarCargaMasiva({ almacenId, modo = 'conteo_fisico', motivo, items = [], branchId, usuarioId, empresaId, esSuperAdmin }) {
    if (!branchId) {
      const error = new Error('El usuario no cuenta con una sucursal activa en su sesión.')
      error.statusCode = 400
      throw error
    }

    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Debe enviar al menos un producto para la carga masiva.')
      error.statusCode = 400
      throw error
    }

    const { factorVolumen } = await getFactores()

    return db.transaction(async (tx) => {
      // 1. Resolver y validar almacén
      const targetAlmacenId = await stockRepository.getOrResolveAlmacenTx(tx, { almacenId, branchId })

      const docRef = 'CARGA-MASIVA'
      const conceptoRef =
        (motivo && motivo.trim()) ||
        (modo === 'incremento'
          ? 'INGRESO MASIVO DE STOCK'
          : 'TOMA DE INVENTARIO FÍSICO / CARGA MASIVA')

      let totalActualizados = 0

      const isUUID = (str) =>
        Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      for (const item of items) {
        const prodId = item.producto_id
        if (!prodId || !isUUID(prodId)) continue

        const cantVisual = Number(item.cantidad)
        if (isNaN(cantVisual) || cantVisual < 0) continue

        // Validar pertenencia del producto a la empresa
        await stockRepository.validarProductoEmpresaTx(tx, { productoId: prodId, empresaId, esSuperAdmin })

        // Obtener o resolver presentación
        let presId = isUUID(item.presentacion_id) ? item.presentacion_id : null
        let multiplicaPor = 1

        if (presId) {
          const pres = await stockRepository.validarPresentacionProductoTx(tx, { presentacionId: presId, productoId: prodId })
          multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
        }

        if (!presId) {
          const [pInfo] = await tx
            .select({
              id: schema.presentaciones.id,
              multiplica_por: schema.presentaciones.multiplica_por
            })
            .from(schema.presentaciones)
            .where(eq(schema.presentaciones.producto_uuid, prodId))
            .orderBy(schema.presentaciones.multiplica_por, schema.presentaciones.created_at)
            .limit(1)

          if (pInfo) {
            presId = pInfo.id
            multiplicaPor = Math.max(1, Number(pInfo.multiplica_por || 1))
          } else {
            const [nuevaPres] = await tx
              .insert(schema.presentaciones)
              .values({
                producto_uuid: prodId,
                nombre: 'UNIDAD',
                multiplica_por: 1
              })
              .returning()
            presId = nuevaPres.id
            multiplicaPor = 1
          }
        }

        // Bloqueo de concurrencia consultivo a nivel de producto/almacén
        await stockRepository.acquireProductStockLock(tx, targetAlmacenId, prodId)

        // Consultar todas las filas de stock_actual de este producto en el almacén
        const filasStockProd = await tx
          .select()
          .from(schema.stock_actual)
          .where(
            and(
              eq(schema.stock_actual.branch_id, branchId),
              eq(schema.stock_actual.almacen_id, targetAlmacenId),
              eq(schema.stock_actual.producto_id, prodId)
            )
          )
          .for('update')

        const stockExistente = filasStockProd.find((f) => f.presentacion_id === presId) || null

        let saldoTotalProdInt = 0
        filasStockProd.forEach((f) => {
          saldoTotalProdInt += normalizeVolumenInt(f.saldo_actual, factorVolumen)
        })

        const saldoAnteriorInt = stockExistente
          ? normalizeVolumenInt(stockExistente.saldo_actual, factorVolumen)
          : 0

        let nuevoSaldoInt = 0
        let deltaInt = 0
        let otrasFilasLimpiadas = false

        if (modo === 'incremento') {
          const deltaBaseVisual = cantVisual * multiplicaPor
          deltaInt = toVolumenInt(deltaBaseVisual, factorVolumen)
          nuevoSaldoInt = saldoAnteriorInt + deltaInt
        } else {
          const nuevoSaldoBaseVisual = cantVisual * multiplicaPor
          const nuevoSaldoTotalDeseadoInt = toVolumenInt(nuevoSaldoBaseVisual, factorVolumen)

          const otrasFilasConStock = filasStockProd.filter(
            (f) => f.presentacion_id !== presId && normalizeVolumenInt(f.saldo_actual, factorVolumen) !== 0
          )
          if (otrasFilasConStock.length > 0) {
            await tx
              .update(schema.stock_actual)
              .set({
                saldo_actual: 0,
                updated_at: sql`NOW()`
              })
              .where(inArray(schema.stock_actual.id, otrasFilasConStock.map((f) => f.id)))
            otrasFilasLimpiadas = true
          }

          nuevoSaldoInt = nuevoSaldoTotalDeseadoInt
          deltaInt = nuevoSaldoTotalDeseadoInt - saldoTotalProdInt
        }

        if (deltaInt === 0 && stockExistente && !otrasFilasLimpiadas) {
          continue
        }

        // A. Actualizar o insertar en stock_actual
        if (stockExistente) {
          await tx
            .update(schema.stock_actual)
            .set({
              saldo_actual: nuevoSaldoInt,
              updated_at: sql`NOW()`
            })
            .where(eq(schema.stock_actual.id, stockExistente.id))
        } else {
          await tx.insert(schema.stock_actual).values({
            branch_id: branchId,
            almacen_id: targetAlmacenId,
            producto_id: prodId,
            presentacion_id: presId,
            lotes_id: null,
            saldo_actual: nuevoSaldoInt,
            updated_at: sql`NOW()`
          })
        }

        // B. Registrar movimiento compensatorio en Kárdex
        if (deltaInt !== 0) {
          const tipoMov = deltaInt >= 0 ? 1 : 2
          const deltaAbsInt = Math.abs(deltaInt)
          const deltaCantPresInt = Math.round(deltaAbsInt / multiplicaPor)

          await tx.insert(schema.stock).values({
            producto_id: prodId,
            presentacion_id: presId,
            lotes_id: null,
            cantidad: deltaCantPresInt,
            multiplica_por: multiplicaPor,
            cantidad_base: deltaAbsInt,
            saldo: nuevoSaldoInt,
            documento_id: null,
            documento: docRef,
            tipo_mov: tipoMov,
            concepto: `${conceptoRef} (${deltaInt >= 0 ? '+' : '-'}${toVolumenVisual(deltaAbsInt, factorVolumen)} un)`,
            usuario_id: usuarioId,
            branch_id: branchId,
            almacen_id: targetAlmacenId
          })
        }

        totalActualizados++
      }

      return {
        total_actualizados: totalActualizados,
        almacen_id: targetAlmacenId,
        modo
      }
    })
  }
}

module.exports = cargaMasivaService
