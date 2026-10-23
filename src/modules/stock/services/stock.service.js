'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, sql } = require('drizzle-orm')
const stockRepository = require('../repositories/stock.repository')
const kardexRepository = require('../repositories/kardex.repository')
const {
  getFactores,
  toVolumenInt,
  normalizeVolumenInt,
  toVolumenVisual,
  calcularStockPresentacion
} = require('../../../utils/factores')

/**
 * Servicio de Control de Stock y Kárdex (Lógica de Dominio y Transacciones)
 */
const stockService = {
  // 1. Obtener listado de stock actual consolidado
  async getStockList({ almacenId, categoriaId, estadoStock, q, activo, empresaId, branchId, esSuperAdmin }) {
    const almacenesRows = await stockRepository.getAlmacenes(branchId, esSuperAdmin)
    const almacenPrincipal = almacenesRows[0] || null
    const almacenFiltroId = almacenId || null

    const productosRows = await stockRepository.getProductosFiltrados({
      empresaId,
      categoriaId,
      q,
      activo,
      esSuperAdmin
    })

    const { factorPrecio, factorVolumen } = await getFactores()
    const prodIds = productosRows.map((p) => p.id)

    let presentacionesRows = []
    let stockActualRows = []

    if (prodIds.length > 0) {
      presentacionesRows = await stockRepository.getPresentacionesByProdIds(prodIds)
      stockActualRows = await stockRepository.getStockActualByProdIds({
        prodIds,
        branchId,
        almacenId: almacenFiltroId,
        esSuperAdmin
      })
    }

    // Agrupar presentaciones por producto
    const presPorProducto = {}
    presentacionesRows.forEach((pres) => {
      if (!presPorProducto[pres.producto_uuid]) presPorProducto[pres.producto_uuid] = []
      presPorProducto[pres.producto_uuid].push(pres)
    })

    // Indexar stock_actual por clave compuesta `${producto_id}_${presentacion_id}`
    const stockMap = {}
    const stockProdTotalMap = {}
    stockActualRows.forEach((row) => {
      const key = `${row.producto_id}_${row.presentacion_id}`
      const saldo = toVolumenVisual(row.saldo_actual, factorVolumen)
      if (!stockMap[key]) {
        stockMap[key] = {
          stock_actual_id: row.id,
          almacen_id: row.almacen_id,
          almacen_nombre: row.almacen_nombre || almacenPrincipal?.nombre || 'ALMACÉN PRINCIPAL',
          saldo_actual: saldo,
          updated_at: row.updated_at
        }
      } else {
        stockMap[key].saldo_actual = Number((stockMap[key].saldo_actual + saldo).toFixed(4))
        if (row.updated_at && (!stockMap[key].updated_at || row.updated_at > stockMap[key].updated_at)) {
          stockMap[key].updated_at = row.updated_at
        }
      }
      stockProdTotalMap[row.producto_id] = Number(((stockProdTotalMap[row.producto_id] || 0) + saldo).toFixed(4))
    })

    // Construir items de productos con sus presentaciones
    const items = []
    productosRows.forEach((prod) => {
      const listaPres = presPorProducto[prod.id] || []
      const stockTotalProducto = Number(stockProdTotalMap[prod.id] || 0)

      if (listaPres.length > 0) {
        listaPres.forEach((pres) => {
          const key = `${prod.id}_${pres.id}`
          const stockInfo = stockMap[key]
          const multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
          const saldoActual = calcularStockPresentacion(stockTotalProducto, multiplicaPor)
          const stockMinimo = Number(prod.stock_minimo || 0)

          items.push({
            id: stockInfo?.stock_actual_id || `${prod.id}-${pres.id}`,
            stock_actual_id: stockInfo?.stock_actual_id || null,
            producto_id: prod.id,
            presentacion_id: pres.id,
            activo: prod.activo,
            es_combo: Boolean(prod.es_combo),
            codigo: prod.codigo || '-',
            codigo_barra: pres.cod_barra || prod.codigo_barra || '',
            producto_nombre: prod.nombre,
            presentacion_nombre: pres.nombre || 'UNIDAD',
            nombre_completo: `${prod.nombre} - ${pres.nombre || 'UNIDAD'}`,
            categoria_id: prod.categoria_id,
            categoria_nombre: prod.categoria_nombre || 'General',
            sub_categoria_nombre: prod.sub_categoria_nombre || '',
            unidad_medida_id: pres.unidad_medida_id || prod.unidad_medida_id || 'NIU',
            multiplica_por: multiplicaPor,
            precio_costo: Number(pres.precio_costo || 0) / factorPrecio,
            precio_venta: Number(pres.precio_venta || 0) / factorPrecio,
            precio_mayor: Number(pres.precio_mayor || 0) / factorPrecio,
            precio_especial: Number(pres.precio_especial || 0) / factorPrecio,
            almacen_id: stockInfo?.almacen_id || almacenFiltroId || almacenPrincipal?.id || null,
            almacen_nombre: stockInfo?.almacen_nombre || almacenPrincipal?.nombre || 'ALMACÉN PRINCIPAL',
            stock_minimo: stockMinimo,
            saldo_actual: saldoActual,
            saldo_movimiento_presentacion: stockInfo ? Number(stockInfo.saldo_actual) : 0,
            saldo_producto_total: stockTotalProducto,
            updated_at: stockInfo?.updated_at || pres.updated_at || prod.updated_at || null
          })
        })
      } else {
        const stockMinimo = Number(prod.stock_minimo || 0)
        items.push({
          id: `${prod.id}-base`,
          stock_actual_id: null,
          producto_id: prod.id,
          presentacion_id: null,
          activo: prod.activo,
          es_combo: Boolean(prod.es_combo),
          codigo: prod.codigo || '-',
          codigo_barra: prod.codigo_barra || '',
          producto_nombre: prod.nombre,
          presentacion_nombre: 'UNIDAD',
          nombre_completo: `${prod.nombre} - UNIDAD`,
          categoria_id: prod.categoria_id,
          categoria_nombre: prod.categoria_nombre || 'General',
          sub_categoria_nombre: prod.sub_categoria_nombre || '',
          unidad_medida_id: prod.unidad_medida_id || 'NIU',
          multiplica_por: 1,
          precio_costo: 0,
          precio_venta: 0,
          precio_mayor: 0,
          precio_especial: 0,
          almacen_id: almacenFiltroId || almacenPrincipal?.id || null,
          almacen_nombre: almacenPrincipal?.nombre || 'ALMACÉN PRINCIPAL',
          stock_minimo: stockMinimo,
          saldo_actual: stockTotalProducto,
          saldo_producto_total: stockTotalProducto,
          updated_at: null
        })
      }
    })

    // Filtrar por estado_stock si se solicita
    const filteredItems = items.filter((item) => {
      if (!estadoStock || estadoStock === 'todos') return true
      if (estadoStock === 'negativo') return item.saldo_actual < 0
      if (estadoStock === 'sin_stock') return item.saldo_actual === 0
      if (estadoStock === 'bajo_minimo') return item.saldo_actual > 0 && item.saldo_actual <= item.stock_minimo
      if (estadoStock === 'positivo') return item.saldo_actual > 0
      return true
    })

    const resumen = {
      totalItems: items.length,
      conStockPositivo: items.filter((i) => i.saldo_actual > 0).length,
      sinStock: items.filter((i) => i.saldo_actual === 0).length,
      conStockNegativo: items.filter((i) => i.saldo_actual < 0).length,
      bajoStockMinimo: items.filter((i) => i.saldo_actual > 0 && i.saldo_actual <= i.stock_minimo).length
    }

    return {
      filteredItems,
      almacenes: almacenesRows,
      resumen
    }
  },

  // 2. Consultar Kárdex histórico
  async getKardex({ productoId, presentacionId, almacenId, tipoMov, fechaInicio, fechaFin, branchId, esSuperAdmin }) {
    if (!productoId) {
      const error = new Error('El parámetro producto_id es obligatorio para consultar el Kárdex.')
      error.statusCode = 400
      throw error
    }

    const { factorVolumen } = await getFactores()

    const rawMovimientos = await kardexRepository.getMovimientos({
      productoId,
      presentacionId,
      almacenId,
      tipoMov,
      fechaInicio,
      fechaFin,
      branchId,
      esSuperAdmin
    })

    const movimientos = rawMovimientos.map((m) => ({
      ...m,
      cantidad: toVolumenVisual(m.cantidad, factorVolumen),
      cantidad_base: toVolumenVisual(m.cantidad_base, factorVolumen),
      saldo: toVolumenVisual(m.saldo, factorVolumen)
    }))

    // Consultar saldo base total vigente del producto en stock_actual
    const saConds = [eq(schema.stock_actual.producto_id, productoId)]
    if (!esSuperAdmin && branchId) {
      saConds.push(eq(schema.stock_actual.branch_id, branchId))
    }
    if (almacenId) {
      saConds.push(eq(schema.stock_actual.almacen_id, almacenId))
    }

    const saRows = await db
      .select()
      .from(schema.stock_actual)
      .where(and(...saConds))

    const saldoBaseProducto = Number(
      saRows
        .reduce((acc, r) => acc + toVolumenVisual(r.saldo_actual, factorVolumen), 0)
        .toFixed(4)
    )

    let multiplicaPorFiltro = 1
    if (presentacionId) {
      const [presRow] = await db
        .select({ multiplica_por: schema.presentaciones.multiplica_por })
        .from(schema.presentaciones)
        .where(eq(schema.presentaciones.id, presentacionId))
        .limit(1)
      multiplicaPorFiltro = Math.max(1, Number(presRow?.multiplica_por || 1))
    }

    const saldoActual = calcularStockPresentacion(saldoBaseProducto, multiplicaPorFiltro)

    let totalEntradas = 0
    let totalSalidas = 0
    movimientos.forEach((m) => {
      const cb = Number(m.cantidad_base || m.cantidad || 0)
      if (Number(m.tipo_mov) === 1) {
        totalEntradas = Number((totalEntradas + cb).toFixed(4))
      } else {
        totalSalidas = Number((totalSalidas + cb).toFixed(4))
      }
    })

    return {
      movimientos,
      resumen: {
        totalMovimientos: movimientos.length,
        totalEntradas,
        totalSalidas,
        saldoActual,
        saldoBaseProducto
      }
    }
  },

  // 3. Registrar movimiento individual de ajuste de stock
  async registrarAjuste({
    productoId,
    presentacionId,
    almacenId,
    tipoMov,
    cantidad,
    documento,
    concepto,
    branchId,
    usuarioId,
    empresaId,
    esSuperAdmin
  }) {
    if (!branchId) {
      const error = new Error('El usuario no cuenta con una sucursal activa en su sesión.')
      error.statusCode = 400
      throw error
    }

    if (!productoId || !presentacionId) {
      const error = new Error('Debe especificar producto_id y presentacion_id.')
      error.statusCode = 400
      throw error
    }

    const tipoMovNum = Number(tipoMov) === 2 ? 2 : 1
    const cantVisual = Number(cantidad || 0)
    if (!Number.isFinite(cantVisual) || cantVisual <= 0) {
      const error = new Error('La cantidad del movimiento debe ser mayor a 0.')
      error.statusCode = 400
      throw error
    }

    const { factorVolumen } = await getFactores()

    return db.transaction(async (tx) => {
      // 1. Resolver y validar almacén
      const targetAlmacenId = await stockRepository.getOrResolveAlmacenTx(tx, { almacenId, branchId })

      // 2. Validar que producto pertenezca a la empresa
      await stockRepository.validarProductoEmpresaTx(tx, { productoId, empresaId, esSuperAdmin })

      // 3. Validar que la presentación pertenezca al producto
      const pres = await stockRepository.validarPresentacionProductoTx(tx, { presentacionId, productoId })

      const multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
      const cantInt = toVolumenInt(cantVisual, factorVolumen)
      const cantidadBaseInt = toVolumenInt(cantVisual * multiplicaPor, factorVolumen)

      // 4. Bloqueo de concurrencia a nivel de producto/almacén (evita race condition si la fila aún no existe)
      await stockRepository.acquireProductStockLock(tx, targetAlmacenId, productoId)

      // 5. Bloquear filas existentes de stock_actual y calcular saldo base unificado
      const stockProductoRows = await stockRepository.getStockActualProductoForUpdateTx(tx, {
        branchId,
        almacenId: targetAlmacenId,
        productoId
      })

      const saldoBaseAnteriorInt = stockProductoRows.reduce(
        (acc, r) => acc + normalizeVolumenInt(r.saldo_actual, factorVolumen),
        0
      )
      const stockExistente = stockProductoRows.find((r) => r.presentacion_id === presentacionId)

      const deltaInt = tipoMovNum === 1 ? cantidadBaseInt : -cantidadBaseInt
      const nuevoSaldoBaseTotalInt = saldoBaseAnteriorInt + deltaInt

      if (stockExistente) {
        const saldoFilaActualInt = normalizeVolumenInt(stockExistente.saldo_actual, factorVolumen)
        const nuevoSaldoFilaInt = saldoFilaActualInt + deltaInt
        await stockRepository.updateStockActualTx(tx, {
          id: stockExistente.id,
          saldoActual: nuevoSaldoFilaInt
        })
      } else {
        await stockRepository.insertStockActualTx(tx, {
          branchId,
          almacenId: targetAlmacenId,
          productoId,
          presentacionId,
          saldoActual: deltaInt
        })
      }

      // 6. Insertar registro histórico en tabla stock (Kárdex)
      const docRef = (documento && documento.trim()) || (tipoMovNum === 1 ? 'ING-MANUAL' : 'SAL-MANUAL')
      const conceptoRef =
        (concepto && concepto.trim()) ||
        (tipoMovNum === 1 ? 'INGRESO / REGULARIZACIÓN DE STOCK' : 'SALIDA / AJUSTE DE STOCK')

      const movimiento = await kardexRepository.insertMovimientoTx(tx, {
        productoId,
        presentacionId,
        cantidad: cantInt,
        multiplicaPor,
        cantidadBase: cantidadBaseInt,
        saldo: nuevoSaldoBaseTotalInt,
        documento: docRef,
        tipoMov: tipoMovNum,
        concepto: conceptoRef,
        usuarioId,
        branchId,
        almacenId: targetAlmacenId
      })

      return {
        tipoMovNum,
        movimiento: {
          ...movimiento,
          cantidad: toVolumenVisual(movimiento.cantidad, factorVolumen),
          cantidad_base: toVolumenVisual(movimiento.cantidad_base, factorVolumen),
          saldo: toVolumenVisual(movimiento.saldo, factorVolumen)
        },
        saldo_actual: toVolumenVisual(nuevoSaldoBaseTotalInt, factorVolumen)
      }
    })
  }
}

module.exports = stockService
