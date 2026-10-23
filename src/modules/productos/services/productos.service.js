'use strict'

const { db } = require('../../../db')
const productosRepository = require('../repositories/productos.repository')
const {
  getFactores,
  toPrecioInt,
  toPrecioVisual,
  toVolumenVisual,
  calcularStockPresentacion
} = require('../../../utils/factores')

/**
 * Servicio de Dominio para Catálogo de Productos, Presentaciones y Factores de Conversión
 */
const productosService = {
  // 1. Listar catálogo de productos enriquecido con presentaciones y stock
  async listarProductos({ q, categoriaId, activo, empresaId, branchId, esSuperAdmin, limit, offset }) {
    const productosRows = await productosRepository.getProductos({
      q,
      categoriaId,
      activo,
      empresaId,
      esSuperAdmin,
      limit,
      offset
    })

    const { factorPrecio, factorVolumen } = await getFactores()
    const unidadesMap = await productosRepository.getUnidadesMedidaMap()

    const prodIds = productosRows.map((p) => p.id)
    let presentacionesRows = []
    let stockActualRows = []

    if (prodIds.length > 0) {
      presentacionesRows = await productosRepository.getPresentacionesByProdIds(prodIds)
      stockActualRows = await productosRepository.getStockActualByProdIds(prodIds, branchId)
    }

    const stockPorPres = {}
    const stockPorProd = {}
    stockActualRows.forEach((s) => {
      const saldo = toVolumenVisual(s.saldo_actual, factorVolumen)
      if (s.presentacion_id) {
        stockPorPres[s.presentacion_id] = Number(((stockPorPres[s.presentacion_id] || 0) + saldo).toFixed(4))
      }
      if (s.producto_id) {
        stockPorProd[s.producto_id] = Number(((stockPorProd[s.producto_id] || 0) + saldo).toFixed(4))
      }
    })

    // Componentes de Combos
    const comboPresIds = presentacionesRows
      .filter((pr) => {
        const prodPadre = productosRows.find((p) => p.id === pr.producto_uuid)
        return prodPadre && prodPadre.es_combo
      })
      .map((pr) => pr.id)

    const comboDetallesMap = {}
    if (comboPresIds.length > 0) {
      const comboDetallesRows = await productosRepository.getComboDetallesByComboPresIds(comboPresIds)

      // Cargar stock faltante de componentes
      const compProdIds = Array.from(new Set(comboDetallesRows.map((d) => d.comp_producto_uuid).filter(Boolean)))
      const compProdIdsFaltantes = compProdIds.filter((cId) => stockPorProd[cId] === undefined)
      if (compProdIdsFaltantes.length > 0) {
        const compStockRows = await productosRepository.getStockActualByProdIds(compProdIdsFaltantes, branchId)
        compStockRows.forEach((s) => {
          const saldo = toVolumenVisual(s.saldo_actual, factorVolumen)
          if (s.producto_id) {
            stockPorProd[s.producto_id] = Number(((stockPorProd[s.producto_id] || 0) + saldo).toFixed(4))
          }
        })
      }

      comboDetallesRows.forEach((cd) => {
        if (!comboDetallesMap[cd.presentacion_combo_id]) {
          comboDetallesMap[cd.presentacion_combo_id] = []
        }
        comboDetallesMap[cd.presentacion_combo_id].push(cd)
      })
    }

    // Mapear presentaciones por producto
    const presMap = {}
    presentacionesRows.forEach((pres) => {
      if (!presMap[pres.producto_uuid]) presMap[pres.producto_uuid] = []
      const prodPadre = productosRows.find((p) => p.id === pres.producto_uuid)
      const esCombo = Boolean(prodPadre && prodPadre.es_combo)

      let stockPres = 0
      let precioVentaCalculado = Number(pres.precio_venta || 0) / factorPrecio
      let precioCostoCalculado = Number(pres.precio_costo || 0) / factorPrecio

      if (esCombo) {
        const detalles = comboDetallesMap[pres.id] || []
        let stockComboMin = detalles.length > 0 ? Infinity : 0
        let precioAcumuladoVisual = 0
        let costoAcumuladoVisual = 0

        detalles.forEach((det) => {
          const cantReq = Math.max(1, Number(det.cantidad || 1))
          const multiplicaComp = Math.max(1, Number(det.comp_multiplica_por || 1))
          const saldoBaseComp = Number(stockPorProd[det.comp_producto_uuid] || 0)
          const stockPresentacionComp = calcularStockPresentacion(saldoBaseComp, multiplicaComp)
          const disp = Math.floor(stockPresentacionComp / cantReq)
          if (disp < stockComboMin) {
            stockComboMin = disp
          }

          const costoUnit = Number(det.comp_precio_costo || 0) / factorPrecio
          const ventaUnit = Number(det.comp_precio_venta || 0) / factorPrecio
          const tipoAjuste = det.tipo_ajuste || 'MARGEN'
          const valorAjuste = Number(det.valor_ajuste || 0)

          let precioFinalUnit = 0
          if (tipoAjuste === 'MARGEN') {
            precioFinalUnit = costoUnit + (costoUnit * valorAjuste) / 100
          } else {
            precioFinalUnit = ventaUnit - valorAjuste
          }

          precioAcumuladoVisual += precioFinalUnit * cantReq
          costoAcumuladoVisual += costoUnit * cantReq
        })

        const stockFisicoCombo = Number(stockPorPres[pres.id] || 0)
        stockPres = stockFisicoCombo < 0 ? stockFisicoCombo : (stockComboMin === Infinity ? 0 : stockComboMin)

        if (!pres.precio_venta || Number(pres.precio_venta) === 0) {
          precioVentaCalculado = Number(precioAcumuladoVisual.toFixed(2))
        }
        if (!pres.precio_costo || Number(pres.precio_costo) === 0) {
          precioCostoCalculado = Number(costoAcumuladoVisual.toFixed(2))
        }
      } else {
        const stockBaseTotal = Number(stockPorProd[pres.producto_uuid] || 0)
        const multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
        stockPres = calcularStockPresentacion(stockBaseTotal, multiplicaPor)
      }

      presMap[pres.producto_uuid].push({
        id: pres.id,
        producto_uuid: pres.producto_uuid,
        nombre: pres.nombre,
        cod_barra: pres.cod_barra || '',
        unidad_medida_id: pres.unidad_medida_id || 'NIU',
        unidad_medida_descripcion: unidadesMap[pres.unidad_medida_id] || pres.unidad_medida_id || 'UNIDAD',
        multiplica_por: pres.multiplica_por,
        precio_costo: precioCostoCalculado,
        precio_venta: precioVentaCalculado,
        precio_mayor: Number(pres.precio_mayor || 0) / factorPrecio,
        precio_especial: Number(pres.precio_especial || 0) / factorPrecio,
        precio_otros: Number(pres.precio_otros || 0) / factorPrecio,
        activo: pres.activo,
        stock_actual: stockPres,
        stock: stockPres,
        created_at: pres.created_at,
        updated_at: pres.updated_at
      })
    })

    // Formatear productos con su presentación principal y stock total
    return productosRows.map((prod) => {
      const presentaciones = presMap[prod.id] || []
      const presPrincipal = presentaciones[0] || null
      const stockTotalProducto = Number(stockPorProd[prod.id] || 0)

      return {
        ...prod,
        precio_costo: presPrincipal ? presPrincipal.precio_costo : 0,
        precio_venta: presPrincipal ? presPrincipal.precio_venta : 0,
        precio_mayor: presPrincipal ? presPrincipal.precio_mayor : 0,
        precio_especial: presPrincipal ? presPrincipal.precio_especial : 0,
        precio_otros: presPrincipal ? presPrincipal.precio_otros : 0,
        presentacion_id: presPrincipal ? presPrincipal.id : null,
        presentacion_nombre: presPrincipal ? presPrincipal.nombre : 'UNIDAD',
        multiplica_por: presPrincipal ? presPrincipal.multiplica_por : 1,
        stock_actual: prod.es_combo && presPrincipal ? presPrincipal.stock_actual : stockTotalProducto,
        stock: prod.es_combo && presPrincipal ? presPrincipal.stock_actual : stockTotalProducto,
        presentaciones
      }
    })
  },

  // 2. Obtener un producto por ID con presentaciones enriquecidas
  async obtenerPorId(id, { branchId }) {
    const producto = await productosRepository.getProductoById(id)
    if (!producto) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    const { factorPrecio, factorVolumen } = await getFactores()
    const unidadesMap = await productosRepository.getUnidadesMedidaMap()

    const presentacionesRows = await productosRepository.getPresentacionesByProdIds([id])
    const stockActualRows = await productosRepository.getStockActualByProdIds([id], branchId)

    const stockPorPres = {}
    let stockTotalProducto = 0
    stockActualRows.forEach((s) => {
      const saldo = toVolumenVisual(s.saldo_actual, factorVolumen)
      if (s.presentacion_id) {
        stockPorPres[s.presentacion_id] = Number(((stockPorPres[s.presentacion_id] || 0) + saldo).toFixed(4))
      }
      stockTotalProducto = Number((stockTotalProducto + saldo).toFixed(4))
    })

    let comboDetallesRows = []
    const stockCompMap = {}
    if (producto.es_combo) {
      const presIds = presentacionesRows.map((pr) => pr.id)
      if (presIds.length > 0) {
        comboDetallesRows = await productosRepository.getComboDetallesByComboPresIds(presIds)
        const compProdIds = Array.from(new Set(comboDetallesRows.map((d) => d.comp_producto_uuid).filter(Boolean)))
        if (compProdIds.length > 0) {
          const compStockRows = await productosRepository.getStockActualByProdIds(compProdIds, branchId)
          compStockRows.forEach((s) => {
            const saldo = toVolumenVisual(s.saldo_actual, factorVolumen)
            if (s.producto_id) {
              stockCompMap[s.producto_id] = Number(((stockCompMap[s.producto_id] || 0) + saldo).toFixed(4))
            }
          })
        }
      }
    }

    const presentaciones = presentacionesRows.map((pres) => {
      let stockPres = 0
      let precioVentaCalculado = Number(pres.precio_venta || 0) / factorPrecio
      let precioCostoCalculado = Number(pres.precio_costo || 0) / factorPrecio

      if (producto.es_combo) {
        const detalles = comboDetallesRows.filter((cd) => cd.presentacion_combo_id === pres.id)
        let stockComboMin = detalles.length > 0 ? Infinity : 0
        let precioAcumuladoVisual = 0
        let costoAcumuladoVisual = 0

        detalles.forEach((det) => {
          const cantReq = Math.max(1, Number(det.cantidad || 1))
          const multiplicaComp = Math.max(1, Number(det.comp_multiplica_por || 1))
          const saldoBaseComp = Number(stockCompMap[det.comp_producto_uuid] || 0)
          const stockPresentacionComp = calcularStockPresentacion(saldoBaseComp, multiplicaComp)
          const disp = Math.floor(stockPresentacionComp / cantReq)
          if (disp < stockComboMin) {
            stockComboMin = disp
          }

          const costoUnit = Number(det.comp_precio_costo || 0) / factorPrecio
          const ventaUnit = Number(det.comp_precio_venta || 0) / factorPrecio
          const tipoAjuste = det.tipo_ajuste || 'MARGEN'
          const valorAjuste = Number(det.valor_ajuste || 0)

          let precioFinalUnit = 0
          if (tipoAjuste === 'MARGEN') {
            precioFinalUnit = costoUnit + (costoUnit * valorAjuste) / 100
          } else {
            precioFinalUnit = ventaUnit - valorAjuste
          }

          precioAcumuladoVisual += precioFinalUnit * cantReq
          costoAcumuladoVisual += costoUnit * cantReq
        })

        const stockFisicoCombo = Number(stockPorPres[pres.id] || 0)
        stockPres = stockFisicoCombo < 0 ? stockFisicoCombo : (stockComboMin === Infinity ? 0 : stockComboMin)

        if (!pres.precio_venta || Number(pres.precio_venta) === 0) {
          precioVentaCalculado = Number(precioAcumuladoVisual.toFixed(2))
        }
        if (!pres.precio_costo || Number(pres.precio_costo) === 0) {
          precioCostoCalculado = Number(costoAcumuladoVisual.toFixed(2))
        }
      } else {
        const multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
        stockPres = calcularStockPresentacion(stockTotalProducto, multiplicaPor)
      }

      return {
        id: pres.id,
        producto_uuid: pres.producto_uuid,
        nombre: pres.nombre,
        cod_barra: pres.cod_barra || '',
        unidad_medida_id: pres.unidad_medida_id || 'NIU',
        unidad_medida_descripcion: unidadesMap[pres.unidad_medida_id] || pres.unidad_medida_id || 'UNIDAD',
        multiplica_por: pres.multiplica_por,
        precio_costo: precioCostoCalculado,
        precio_venta: precioVentaCalculado,
        precio_mayor: Number(pres.precio_mayor || 0) / factorPrecio,
        precio_especial: Number(pres.precio_especial || 0) / factorPrecio,
        precio_otros: Number(pres.precio_otros || 0) / factorPrecio,
        activo: pres.activo,
        stock_actual: stockPres,
        stock: stockPres,
        created_at: pres.created_at,
        updated_at: pres.updated_at
      }
    })

    const presPrincipal = presentaciones[0] || null
    return {
      ...producto,
      precio_costo: presPrincipal ? presPrincipal.precio_costo : 0,
      precio_venta: presPrincipal ? presPrincipal.precio_venta : 0,
      precio_mayor: presPrincipal ? presPrincipal.precio_mayor : 0,
      precio_especial: presPrincipal ? presPrincipal.precio_especial : 0,
      precio_otros: presPrincipal ? presPrincipal.precio_otros : 0,
      presentacion_id: presPrincipal ? presPrincipal.id : null,
      presentacion_nombre: presPrincipal ? presPrincipal.nombre : 'UNIDAD',
      multiplica_por: presPrincipal ? presPrincipal.multiplica_por : 1,
      stock_actual: producto.es_combo && presPrincipal ? presPrincipal.stock_actual : stockTotalProducto,
      stock: producto.es_combo && presPrincipal ? presPrincipal.stock_actual : stockTotalProducto,
      presentaciones
    }
  },

  // 3. Consultar kárdex histórico de producto
  async consultarKardex(productoId, { branchId }) {
    const { factorVolumen } = await getFactores()
    const rawMovimientos = await productosRepository.getKardexByProductoId(productoId, branchId)

    return rawMovimientos.map((m) => ({
      ...m,
      cantidad: toVolumenVisual(m.cantidad, factorVolumen),
      cantidad_base: toVolumenVisual(m.cantidad_base, factorVolumen),
      saldo: toVolumenVisual(m.saldo, factorVolumen)
    }))
  },

  // 4. Crear producto con presentaciones dentro de transacción
  async crearProducto(payload, { empresaId }) {
    if (!payload.nombre || payload.nombre.trim() === '') {
      const error = new Error('El nombre del producto es obligatorio.')
      error.statusCode = 400
      throw error
    }

    const { factorPrecio } = await getFactores()

    return db.transaction(async (tx) => {
      let codigoFinal = payload.codigo && payload.codigo.trim() !== '' ? payload.codigo.trim() : null
      if (!codigoFinal) {
        codigoFinal = await productosRepository.generarCodigoProductoTx(tx)
      }

      const datosProducto = {
        codigo: codigoFinal,
        nombre: payload.nombre.trim(),
        descripcion: payload.descripcion || null,
        codigo_barra: payload.codigo_barra || null,
        palabra_clave: payload.palabra_clave || null,
        codigo_sunat: payload.codigo_sunat || null,
        unidad_medida_id: payload.unidad_medida_id || 'NIU',
        es_facturable: payload.es_facturable !== undefined ? payload.es_facturable : true,
        es_vendible: payload.es_vendible !== undefined ? payload.es_vendible : true,
        es_insumo: payload.es_insumo !== undefined ? payload.es_insumo : false,
        es_producido: payload.es_producido !== undefined ? payload.es_producido : false,
        es_combo: payload.es_combo !== undefined ? payload.es_combo : false,
        activo: payload.activo !== undefined ? payload.activo : true,
        stock_minimo: Number(payload.stock_minimo || 0),
        categoria: payload.categoria_id || payload.categoria || null,
        sub_categoria: payload.sub_categoria_id || payload.sub_categoria || null,
        tipo_existencia: payload.tipo_existencia_id || payload.tipo_existencia || '01',
        tipo_tributo: payload.tipo_tributo_id || payload.tipo_tributo || '10',
        empresa_id: empresaId
      }

      const nuevoProd = await productosRepository.insertProductoTx(tx, datosProducto)

      let presentacionesInput = payload.presentaciones
      if (!presentacionesInput || !Array.isArray(presentacionesInput) || presentacionesInput.length === 0) {
        presentacionesInput = [
          {
            nombre: 'UNIDAD',
            cod_barra: payload.codigo_barra || null,
            unidad_medida_id: payload.unidad_medida_id || 'NIU',
            multiplica_por: 1,
            precio_costo: payload.precio_costo || 0,
            precio_venta: payload.precio_venta || 0,
            precio_mayor: payload.precio_mayor || 0,
            precio_especial: payload.precio_especial || 0,
            precio_otros: payload.precio_otros || 0,
            activo: true
          }
        ]
      }

      const filasPres = presentacionesInput.map((pres) => ({
        producto_uuid: nuevoProd.id,
        nombre: pres.nombre || 'UNIDAD',
        cod_barra: pres.cod_barra || null,
        unidad_medida_id: pres.unidad_medida_id || payload.unidad_medida_id || 'NIU',
        multiplica_por: Math.max(1, Number(pres.multiplica_por || 1)),
        precio_costo: toPrecioInt(Number(pres.precio_costo || 0), factorPrecio),
        precio_venta: toPrecioInt(Number(pres.precio_venta || 0), factorPrecio),
        precio_mayor: toPrecioInt(Number(pres.precio_mayor || 0), factorPrecio),
        precio_especial: toPrecioInt(Number(pres.precio_especial || 0), factorPrecio),
        precio_otros: toPrecioInt(Number(pres.precio_otros || 0), factorPrecio),
        activo: pres.activo !== undefined ? pres.activo : true
      }))

      const presInsertadas = await productosRepository.insertPresentacionesTx(tx, filasPres)

      return {
        ...nuevoProd,
        presentaciones: presInsertadas.map((pres) => ({
          ...pres,
          precio_costo: Number(pres.precio_costo || 0) / factorPrecio,
          precio_venta: Number(pres.precio_venta || 0) / factorPrecio,
          precio_mayor: Number(pres.precio_mayor || 0) / factorPrecio,
          precio_especial: Number(pres.precio_especial || 0) / factorPrecio,
          precio_otros: Number(pres.precio_otros || 0) / factorPrecio
        }))
      }
    })
  },

  // 5. Actualizar producto y sincronizar presentaciones dentro de transacción
  async actualizarProducto(id, payload, { empresaId, esSuperAdmin }) {
    const existing = await productosRepository.getProductoById(id)
    if (!existing) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    if (!esSuperAdmin && empresaId && existing.empresa_id && existing.empresa_id !== empresaId) {
      const error = new Error('No tiene permisos para modificar productos de otra empresa.')
      error.statusCode = 403
      throw error
    }

    const { factorPrecio } = await getFactores()

    return db.transaction(async (tx) => {
      const datosProducto = {
        nombre: payload.nombre !== undefined ? payload.nombre.trim() : existing.nombre,
        descripcion: payload.descripcion !== undefined ? payload.descripcion : existing.descripcion,
        codigo_barra: payload.codigo_barra !== undefined ? payload.codigo_barra : existing.codigo_barra,
        palabra_clave: payload.palabra_clave !== undefined ? payload.palabra_clave : existing.palabra_clave,
        codigo_sunat: payload.codigo_sunat !== undefined ? payload.codigo_sunat : existing.codigo_sunat,
        unidad_medida_id: payload.unidad_medida_id || existing.unidad_medida_id,
        es_facturable: payload.es_facturable !== undefined ? payload.es_facturable : existing.es_facturable,
        es_vendible: payload.es_vendible !== undefined ? payload.es_vendible : existing.es_vendible,
        es_insumo: payload.es_insumo !== undefined ? payload.es_insumo : existing.es_insumo,
        es_producido: payload.es_producido !== undefined ? payload.es_producido : existing.es_producido,
        es_combo: payload.es_combo !== undefined ? payload.es_combo : existing.es_combo,
        activo: payload.activo !== undefined ? payload.activo : existing.activo,
        stock_minimo: payload.stock_minimo !== undefined ? Number(payload.stock_minimo) : existing.stock_minimo,
        categoria:
          payload.categoria_id !== undefined
            ? payload.categoria_id
            : payload.categoria !== undefined
              ? payload.categoria
              : existing.categoria_id,
        sub_categoria:
          payload.sub_categoria_id !== undefined
            ? payload.sub_categoria_id
            : payload.sub_categoria !== undefined
              ? payload.sub_categoria
              : existing.sub_categoria_id,
        tipo_existencia: payload.tipo_existencia_id || payload.tipo_existencia || existing.tipo_existencia_id,
        tipo_tributo: payload.tipo_tributo_id || payload.tipo_tributo || existing.tipo_tributo_id
      }

      if (payload.codigo && payload.codigo.trim() !== '') {
        datosProducto.codigo = payload.codigo.trim()
      }

      const prodActualizado = await productosRepository.updateProductoTx(tx, id, datosProducto)

      let presActualizadas = []
      if (payload.presentaciones && Array.isArray(payload.presentaciones) && payload.presentaciones.length > 0) {
        await productosRepository.deletePresentacionesByProductoIdTx(tx, id)

        const filasPres = payload.presentaciones.map((pres) => ({
          producto_uuid: id,
          nombre: pres.nombre || 'UNIDAD',
          cod_barra: pres.cod_barra || null,
          unidad_medida_id: pres.unidad_medida_id || datosProducto.unidad_medida_id || 'NIU',
          multiplica_por: Math.max(1, Number(pres.multiplica_por || 1)),
          precio_costo: toPrecioInt(Number(pres.precio_costo || 0), factorPrecio),
          precio_venta: toPrecioInt(Number(pres.precio_venta || 0), factorPrecio),
          precio_mayor: toPrecioInt(Number(pres.precio_mayor || 0), factorPrecio),
          precio_especial: toPrecioInt(Number(pres.precio_especial || 0), factorPrecio),
          precio_otros: toPrecioInt(Number(pres.precio_otros || 0), factorPrecio),
          activo: pres.activo !== undefined ? pres.activo : true
        }))

        const nuevasPres = await productosRepository.insertPresentacionesTx(tx, filasPres)
        presActualizadas = nuevasPres.map((pres) => ({
          ...pres,
          precio_costo: Number(pres.precio_costo || 0) / factorPrecio,
          precio_venta: Number(pres.precio_venta || 0) / factorPrecio,
          precio_mayor: Number(pres.precio_mayor || 0) / factorPrecio,
          precio_especial: Number(pres.precio_especial || 0) / factorPrecio,
          precio_otros: Number(pres.precio_otros || 0) / factorPrecio
        }))
      }

      return {
        ...prodActualizado,
        presentaciones: presActualizadas
      }
    })
  },

  // 6. Inactivar producto (Soft delete / Baja lógica)
  async eliminarProducto(id) {
    const producto = await productosRepository.deleteProducto(id)
    if (!producto) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }
    return producto
  }
}

module.exports = productosService
