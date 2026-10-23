'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, inArray, sql } = require('drizzle-orm')
const stockRepository = require('../repositories/stock.repository')
const {
  getFactores,
  normalizeVolumenInt,
  toVolumenVisual
} = require('../../../utils/factores')

/**
 * Caso de Uso: Reinicio Masivo de Stock a Cero con Compensación en Kárdex
 */
const reinicioStockService = {
  async ejecutarReinicio({ almacenId, motivo, tipoSaldo = 'todos', incluirCombos = false, branchId, usuarioId }) {
    if (!branchId) {
      const error = new Error('El usuario no cuenta con una sucursal activa en su sesión.')
      error.statusCode = 400
      throw error
    }

    const { factorVolumen } = await getFactores()

    return db.transaction(async (tx) => {
      // 1. Validar almacén si fue provisto
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
      }

      // 2. Obtener y bloquear las filas de stock_actual
      let filasStockActual = await tx
        .select()
        .from(schema.stock_actual)
        .where(eq(schema.stock_actual.branch_id, branchId))
        .for('update')

      if (almacenId) {
        filasStockActual = filasStockActual.filter((f) => f.almacen_id === almacenId)
      }

      // 3. Cargar información de productos para filtrar combos y nombres
      const prodIdsTotales = Array.from(new Set(filasStockActual.map((f) => f.producto_id).filter(Boolean)))
      const prodNombresMap = {}
      const prodEsComboMap = {}

      if (prodIdsTotales.length > 0) {
        const prods = await tx
          .select({
            id: schema.productos.id,
            nombre: schema.productos.nombre,
            es_combo: schema.productos.es_combo
          })
          .from(schema.productos)
          .where(inArray(schema.productos.id, prodIdsTotales))
        prods.forEach((p) => {
          prodNombresMap[p.id] = p.nombre
          prodEsComboMap[p.id] = Boolean(p.es_combo)
        })
      }

      // 4. Calcular el saldo TOTAL acumulado del producto
      const saldoTotalPorProductoInt = {}
      filasStockActual.forEach((f) => {
        const saldoInt = normalizeVolumenInt(f.saldo_actual, factorVolumen)
        saldoTotalPorProductoInt[f.producto_id] = (saldoTotalPorProductoInt[f.producto_id] || 0) + saldoInt
      })

      // 5. Filtrar qué PRODUCTOS califican para el reinicio
      const productosQueCalifican = prodIdsTotales.filter((prodId) => {
        if (!incluirCombos && prodEsComboMap[prodId]) return false
        const saldoTotal = saldoTotalPorProductoInt[prodId] || 0
        if (tipoSaldo === 'solo_negativos') return saldoTotal < 0
        if (tipoSaldo === 'solo_positivos') return saldoTotal > 0
        return saldoTotal !== 0
      })

      const filasElegibles = filasStockActual.filter((f) => productosQueCalifican.includes(f.producto_id))

      if (filasElegibles.length === 0) {
        const filtroTexto =
          tipoSaldo === 'solo_negativos'
            ? 'con saldo total negativo (< 0)'
            : tipoSaldo === 'solo_positivos'
              ? 'con saldo total positivo (> 0)'
              : 'con saldo total distinto de 0'
        const comboTexto = !incluirCombos ? ' (excluyendo combos)' : ''
        return {
          afectados: 0,
          total_regularizados: 0,
          productos_afectados: [],
          message: `No hay productos ${filtroTexto}${comboTexto} para reiniciar en este almacén/sucursal.`
        }
      }

      const presIdsParaNombres = Array.from(new Set(filasElegibles.map((f) => f.presentacion_id).filter(Boolean)))
      const presNombresMap = {}
      const presMultiplicaMap = {}
      if (presIdsParaNombres.length > 0) {
        const presRows = await tx
          .select({
            id: schema.presentaciones.id,
            nombre: schema.presentaciones.nombre,
            multiplica_por: schema.presentaciones.multiplica_por
          })
          .from(schema.presentaciones)
          .where(inArray(schema.presentaciones.id, presIdsParaNombres))

        presRows.forEach((pr) => {
          presNombresMap[pr.id] = pr.nombre
          presMultiplicaMap[pr.id] = Math.max(1, Number(pr.multiplica_por || 1))
        })
      }

      const filasConStock = filasElegibles.map((f) => ({
        ...f,
        producto_nombre: prodNombresMap[f.producto_id] || 'Sin nombre',
        presentacion_nombre: presNombresMap[f.presentacion_id] || 'UNIDAD'
      }))

      const docRef = 'REINICIO-MASIVO'
      const tipoTexto =
        tipoSaldo === 'solo_negativos'
          ? 'REINICIO MASIVO (SOLO NEGATIVOS)'
          : tipoSaldo === 'solo_positivos'
            ? 'REINICIO MASIVO (SOLO POSITIVOS)'
            : 'REINICIO MASIVO DE STOCK'
      const conceptoRef = (motivo && motivo.trim()) || tipoTexto

      const idsAfectados = []
      const detalleProductosReiniciados = []

      // 6. Registrar movimientos compensatorios en Kárdex
      for (const fila of filasConStock) {
        const saldoFilaInt = normalizeVolumenInt(fila.saldo_actual, factorVolumen)
        if (saldoFilaInt === 0) continue

        idsAfectados.push(fila.id)
        const multiplicaPor = presMultiplicaMap[fila.presentacion_id] || 1
        const tipoMov = saldoFilaInt > 0 ? 2 : 1
        const cantBaseAbsInt = Math.abs(saldoFilaInt)
        const cantAbsInt = Math.round(cantBaseAbsInt / multiplicaPor)
        const saldoVisual = toVolumenVisual(saldoFilaInt, factorVolumen)

        detalleProductosReiniciados.push({
          stock_actual_id: fila.id,
          producto_id: fila.producto_id,
          producto_nombre: fila.producto_nombre || 'Sin nombre',
          presentacion_id: fila.presentacion_id,
          presentacion_nombre: fila.presentacion_nombre || 'UNIDAD',
          saldo_anterior: saldoVisual,
          saldo_nuevo: 0,
          ajuste_aplicado: tipoMov === 1 ? `+${toVolumenVisual(cantBaseAbsInt, factorVolumen)}` : `-${toVolumenVisual(cantBaseAbsInt, factorVolumen)}`
        })

        await tx.insert(schema.stock).values({
          producto_id: fila.producto_id,
          presentacion_id: fila.presentacion_id,
          lotes_id: fila.lotes_id || null,
          cantidad: cantAbsInt,
          multiplica_por: multiplicaPor,
          cantidad_base: cantBaseAbsInt,
          saldo: 0,
          documento_id: null,
          documento: docRef,
          tipo_mov: tipoMov,
          concepto: `${conceptoRef} (Ajuste de ${toVolumenVisual(cantBaseAbsInt, factorVolumen)} un)`,
          usuario_id: usuarioId,
          branch_id: branchId,
          almacen_id: fila.almacen_id
        })
      }

      // 7. Poner en 0 todas las filas de stock_actual de los productos elegibles
      if (idsAfectados.length > 0) {
        const prodIdsAfectados = Array.from(new Set(filasConStock.map((f) => f.producto_id).filter(Boolean)))
        const resetConds = [
          eq(schema.stock_actual.branch_id, branchId),
          inArray(schema.stock_actual.producto_id, prodIdsAfectados)
        ]
        if (almacenId) {
          resetConds.push(eq(schema.stock_actual.almacen_id, almacenId))
        }

        await tx
          .update(schema.stock_actual)
          .set({
            saldo_actual: 0,
            updated_at: sql`NOW()`
          })
          .where(and(...resetConds))
      }

      return {
        afectados: idsAfectados.length,
        total_regularizados: idsAfectados.length,
        productos_afectados: detalleProductosReiniciados,
        message: `Se han reiniciado ${idsAfectados.length} registros de stock a 0 correctamente.`
      }
    })
  }
}

module.exports = reinicioStockService
