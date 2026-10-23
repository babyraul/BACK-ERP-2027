'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, sql } = require('drizzle-orm')
const combosRepository = require('../repositories/combos.repository')
const { getFactores, calcularStockPresentacion, toVolumenVisual } = require('../../../utils/factores')

/**
 * Servicio de Dominio para Gestión de Combos Promocionales
 */
const combosService = {
  // Listar combos con cálculo de stock disponible dinámico y precios
  async listarCombos({ q, activo, empresaId, branchId, esSuperAdmin }) {
    const { factorPrecio, factorVolumen } = await getFactores()

    // 1. Obtener cabeceras de combos
    const combosRows = await combosRepository.getCombosHeader({ q, activo, empresaId, esSuperAdmin })
    if (combosRows.length === 0) {
      return []
    }

    const comboIds = combosRows.map((c) => c.id)

    // 2. Obtener presentaciones de los combos
    const presentacionesCombo = await combosRepository.getPresentacionesByComboIds(comboIds)
    const presComboMap = {}
    const presComboIds = []
    presentacionesCombo.forEach((p) => {
      presComboMap[p.producto_uuid] = p
      presComboIds.push(p.id)
    })

    // 3. Obtener detalles de los combos
    const detallesRows = await combosRepository.getDetallesByPresComboIds(presComboIds)

    // 4. Pre-cargar stock de componentes y de los propios combos
    const componenteProdIds = Array.from(
      new Set(detallesRows.map((d) => d.comp_producto_uuid).filter(Boolean))
    )
    const allProdIdsParaStock = Array.from(new Set([...componenteProdIds, ...comboIds]))
    const stockPorProd = {}

    if (allProdIdsParaStock.length > 0) {
      const stockActualRows = await combosRepository.getStockActualPorProductos(allProdIdsParaStock, branchId)
      stockActualRows.forEach((row) => {
        const saldo = toVolumenVisual(row.saldo_actual, factorVolumen)
        stockPorProd[row.producto_id] = Number(((stockPorProd[row.producto_id] || 0) + saldo).toFixed(4))
      })
    }

    // Agrupar detalles por presentacion_combo_id
    const detallesPorPresCombo = {}
    detallesRows.forEach((d) => {
      if (!detallesPorPresCombo[d.presentacion_combo_id]) {
        detallesPorPresCombo[d.presentacion_combo_id] = []
      }
      detallesPorPresCombo[d.presentacion_combo_id].push(d)
    })

    // 5. Ensamblar respuesta calculando stock y precio virtual
    return combosRows.map((combo) => {
      const pres = presComboMap[combo.id]
      const detalles = pres ? detallesPorPresCombo[pres.id] || [] : []

      let stockDisponible = detalles.length > 0 ? Infinity : 0
      let precioAcumuladoCentimos = 0

      const itemsEnriquecidos = detalles.map((det) => {
        const cantidadReq = Math.max(1, Number(det.cantidad || 1))
        const multiplicaPor = Math.max(1, Number(det.comp_multiplica_por || 1))
        const saldoBase = stockPorProd[det.comp_producto_uuid] || 0
        const stockPresentacion = calcularStockPresentacion(saldoBase, multiplicaPor)

        const dispItem = Math.floor(stockPresentacion / cantidadReq)
        if (dispItem < stockDisponible) {
          stockDisponible = dispItem
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
        if (precioFinalUnit < 0) precioFinalUnit = 0

        precioFinalUnit = Math.floor(precioFinalUnit * 1000) / 1000
        const subtotalItem = Math.floor(precioFinalUnit * cantidadReq * 100) / 100
        precioAcumuladoCentimos += Math.round(precioFinalUnit * cantidadReq * factorPrecio)

        return {
          id: det.id,
          presentacion_componente_id: det.presentacion_componente_id,
          IdPresentacion: det.presentacion_componente_id,
          producto_id: det.comp_producto_uuid,
          nombre: det.prod_nombre ? `${det.prod_nombre} - ${det.comp_nombre}` : det.comp_nombre,
          producto_nombre: det.prod_nombre,
          presentacion_nombre: det.comp_nombre,
          codigo_barra: det.prod_codigo_barra,
          cantidad: cantidadReq,
          Cantidad: cantidadReq,
          tipo_ajuste: tipoAjuste,
          valor_ajuste: valorAjuste,
          Descuento: tipoAjuste === 'MARGEN' ? -Math.abs(valorAjuste) : Math.abs(valorAjuste),
          usar_margen_ganancia: tipoAjuste === 'MARGEN',
          precio_costo: costoUnit,
          PrecioCosto: costoUnit,
          precio_venta: ventaUnit,
          PrecioVenta: ventaUnit,
          precio_final: precioFinalUnit,
          subtotal: subtotalItem,
          stock_disponible: stockPresentacion
        }
      })

      if (stockDisponible === Infinity) stockDisponible = 0

      const precioTotalSoles =
        pres && pres.precio_venta > 0
          ? Number(pres.precio_venta) / factorPrecio
          : Math.floor((precioAcumuladoCentimos / factorPrecio) * 100) / 100

      const saldoCombo = stockPorProd[combo.id] || 0
      const ventasCombo = Math.abs(saldoCombo < 0 ? saldoCombo : 0)

      return {
        id: combo.id,
        IdCombo: combo.id,
        codigo: combo.codigo,
        nombre: combo.nombre,
        Nombre: combo.nombre,
        codigo_barra: combo.codigo_barra,
        CodigoBarras: combo.codigo_barra,
        descripcion: combo.descripcion,
        activo: combo.activo,
        Estado: combo.Estado,
        stock: saldoCombo,
        Stock: saldoCombo,
        stock_actual: saldoCombo,
        ventas_totales: ventasCombo,
        stock_disponible: Math.max(0, stockDisponible),
        precio: precioTotalSoles,
        Precio: precioTotalSoles,
        total_items: itemsEnriquecidos.length,
        detalles: itemsEnriquecidos
      }
    })
  },

  // Obtener detalle de combo individual por ID
  async obtenerComboPorId(id, { empresaId, branchId, esSuperAdmin }) {
    const { factorPrecio } = await getFactores()

    const combo = await combosRepository.getComboById(id, { empresaId, esSuperAdmin })
    if (!combo) {
      const error = new Error('Combo no encontrado')
      error.statusCode = 404
      throw error
    }

    const pres = await combosRepository.getPresentacionByComboId(combo.id)
    let items = []

    if (pres) {
      const detallesRows = await combosRepository.getDetallesByPresComboIds([pres.id])

      const componenteProdIds = Array.from(
        new Set(detallesRows.map((d) => d.comp_producto_uuid).filter(Boolean))
      )
      const stockPorProd = {}
      if (componenteProdIds.length > 0 && branchId) {
        const stockActualRows = await combosRepository.getStockActualPorProductos(componenteProdIds, branchId)
        stockActualRows.forEach((r) => {
          stockPorProd[r.producto_id] = (stockPorProd[r.producto_id] || 0) + Number(r.saldo_actual || 0)
        })
      }

      items = detallesRows.map((det) => {
        const cantidadReq = Math.max(1, Number(det.cantidad || 1))
        const multiplicaPor = Math.max(1, Number(det.comp_multiplica_por || 1))
        const saldoBase = stockPorProd[det.comp_producto_uuid] || 0
        const stockPres = calcularStockPresentacion(saldoBase, multiplicaPor)

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
        if (precioFinalUnit < 0) precioFinalUnit = 0
        precioFinalUnit = Math.floor(precioFinalUnit * 1000) / 1000

        return {
          id: det.id,
          presentacion_componente_id: det.presentacion_componente_id,
          IdPresentacion: det.presentacion_componente_id,
          producto_id: det.comp_producto_uuid,
          nombre: det.prod_nombre ? `${det.prod_nombre} - ${det.comp_nombre}` : det.comp_nombre,
          producto_nombre: det.prod_nombre,
          presentacion_nombre: det.comp_nombre,
          codigo_barra: det.prod_codigo_barra,
          cantidad: cantidadReq,
          Cantidad: cantidadReq,
          tipo_ajuste: tipoAjuste,
          valor_ajuste: valorAjuste,
          Descuento: tipoAjuste === 'MARGEN' ? -Math.abs(valorAjuste) : Math.abs(valorAjuste),
          usar_margen_ganancia: tipoAjuste === 'MARGEN',
          precio_costo: costoUnit,
          PrecioCosto: costoUnit,
          precio_venta: ventaUnit,
          PrecioVenta: ventaUnit,
          precio_final: precioFinalUnit,
          stock_disponible: stockPres
        }
      })
    }

    const totalCalculado = items.reduce((acc, it) => acc + it.precio_final * it.cantidad, 0)
    const totalRedondeado = Math.floor(totalCalculado * 100) / 100

    return {
      ...combo,
      presentacion_id: pres?.id,
      precio: totalRedondeado,
      detalles: items
    }
  },

  // Registrar nuevo combo (Transacción atómica)
  async crearCombo(payload, { empresaId, esSuperAdmin }) {
    const { factorPrecio } = await getFactores()

    const nombre = (payload.nombre || payload.Nombre || '').trim()
    if (!nombre) {
      const error = new Error('El nombre del combo es obligatorio.')
      error.statusCode = 400
      throw error
    }

    const codigoBarras = (payload.codigo_barra || payload.codBarras || payload.CodigoBarras || '').trim()
    const detalles = payload.detalles || payload.items || []

    // VC-01: Mínimo 1 producto
    if (!Array.isArray(detalles) || detalles.length === 0) {
      const error = new Error('Se debe asignar al menos un producto.')
      error.statusCode = 400
      throw error
    }

    // VI-01: Verificar no duplicados por presentación
    const presentacionIds = new Set()
    for (const d of detalles) {
      const presId = d.presentacion_componente_id || d.IdPresentacion || d.id
      if (!presId) {
        const error = new Error('Identificador de presentación inválido en los ítems.')
        error.statusCode = 400
        throw error
      }
      if (presentacionIds.has(presId)) {
        const error = new Error('El producto ya se encuentra registrado.')
        error.statusCode = 400
        throw error
      }
      presentacionIds.add(presId)
    }

    // Validación de unicidad de código de barras
    if (codigoBarras) {
      const existeCod = await combosRepository.checkCodigoBarraDuplicado(codigoBarras, empresaId)
      if (existeCod) {
        const error = new Error(`El código de barras "${codigoBarras}" ya está asignado a otro producto o combo.`)
        error.statusCode = 400
        throw error
      }
    }

    const targetEmpresaId = !esSuperAdmin && empresaId ? empresaId : payload.empresa_id || null

    return db.transaction(async (tx) => {
      // 1. Insertar Producto con bandera es_combo = true
      const [nuevoCombo] = await tx
        .insert(schema.productos)
        .values({
          empresa_id: targetEmpresaId,
          nombre,
          descripcion: payload.descripcion || 'Combo promocional',
          codigo_barra: codigoBarras || null,
          es_combo: true,
          es_facturable: true,
          es_vendible: true,
          es_insumo: false,
          es_producido: false,
          activo: payload.activo !== false,
          unidad_medida_id: 'NIU',
          tipo_existencia: '1',
          tipo_tributo: '10'
        })
        .returning()

      // 2. Procesar ítems y calcular total en céntimos
      let totalCentimos = 0
      const itemsParaInsertar = []

      for (const item of detalles) {
        const presComponenteId = item.presentacion_componente_id || item.IdPresentacion || item.id
        const cantidad = Math.max(1, parseInt(item.cantidad || item.Cantidad, 10) || 1)

        const presInfo = await combosRepository.getPresentacionComponente(presComponenteId, tx)
        const costoUnit = Number(presInfo?.precio_costo || 0) / factorPrecio
        const ventaUnit = Number(presInfo?.precio_venta || 0) / factorPrecio

        let tipoAjuste = 'MARGEN'
        let valorAjuste = 0

        if (item.tipo_ajuste) {
          tipoAjuste = item.tipo_ajuste === 'DESCUENTO' ? 'DESCUENTO' : 'MARGEN'
          valorAjuste = Math.abs(Number(item.valor_ajuste || 0))
        } else if (item.usar_margen_ganancia !== undefined) {
          tipoAjuste = item.usar_margen_ganancia ? 'MARGEN' : 'DESCUENTO'
          valorAjuste = Math.abs(Number(item.descuento || item.Descuento || item.margen_ganancia || 0))
        } else if (item.Descuento !== undefined) {
          const rawDesc = Number(item.Descuento)
          tipoAjuste = rawDesc < 0 ? 'MARGEN' : 'DESCUENTO'
          valorAjuste = Math.abs(rawDesc)
        }

        let precioFinalUnit = 0
        if (tipoAjuste === 'MARGEN') {
          precioFinalUnit = costoUnit + (costoUnit * valorAjuste) / 100
        } else {
          precioFinalUnit = ventaUnit - valorAjuste
        }
        if (precioFinalUnit < 0) precioFinalUnit = 0
        precioFinalUnit = Math.floor(precioFinalUnit * 1000) / 1000

        const precioFinalCentimos = Math.round(precioFinalUnit * factorPrecio)
        totalCentimos += precioFinalCentimos * cantidad

        itemsParaInsertar.push({
          presentacion_componente_id: presComponenteId,
          cantidad,
          tipo_ajuste: tipoAjuste,
          valor_ajuste: valorAjuste.toFixed(4),
          precio_final: precioFinalCentimos
        })
      }

      // 3. Crear Presentación Principal para el Combo
      const [nuevaPres] = await tx
        .insert(schema.presentaciones)
        .values({
          producto_uuid: nuevoCombo.id,
          nombre: 'COMBO',
          cod_barra: codigoBarras || null,
          unidad_medida_id: 'NIU',
          multiplica_por: 1,
          precio_costo: 0,
          precio_venta: totalCentimos,
          activo: payload.activo !== false
        })
        .returning()

      // 4. Insertar detalles vinculados
      for (const it of itemsParaInsertar) {
        await tx.insert(schema.combo_detalles).values({
          presentacion_combo_id: nuevaPres.id,
          presentacion_componente_id: it.presentacion_componente_id,
          cantidad: it.cantidad,
          tipo_ajuste: it.tipo_ajuste,
          valor_ajuste: it.valor_ajuste,
          precio_final: it.precio_final,
          activo: true
        })
      }

      return {
        id: nuevoCombo.id,
        nombre: nuevoCombo.nombre,
        codigo_barra: nuevoCombo.codigo_barra,
        precio_total: Number(totalCentimos) / factorPrecio
      }
    })
  },

  // Actualizar combo existente
  async actualizarCombo(id, payload, { empresaId, esSuperAdmin }) {
    const { factorPrecio } = await getFactores()

    const comboExistente = await combosRepository.getComboById(id, { empresaId, esSuperAdmin })
    if (!comboExistente) {
      const error = new Error('Combo no encontrado')
      error.statusCode = 404
      throw error
    }

    const nombre = (payload.nombre || payload.Nombre || comboExistente.nombre || '').trim()
    if (!nombre) {
      const error = new Error('El nombre del combo es obligatorio.')
      error.statusCode = 400
      throw error
    }

    const codigoBarras = (
      payload.codigo_barra !== undefined
        ? payload.codigo_barra
        : payload.codBarras !== undefined
          ? payload.codBarras
          : payload.CodigoBarras !== undefined
            ? payload.CodigoBarras
            : comboExistente.codigo_barra || ''
    ).trim()

    const detalles = payload.detalles || payload.items

    if (detalles && (!Array.isArray(detalles) || detalles.length === 0)) {
      const error = new Error('Se debe asignar al menos un producto.')
      error.statusCode = 400
      throw error
    }

    if (Array.isArray(detalles)) {
      const presIds = new Set()
      for (const d of detalles) {
        const presId = d.presentacion_componente_id || d.IdPresentacion || d.id
        if (presIds.has(presId)) {
          const error = new Error('El producto ya se encuentra registrado.')
          error.statusCode = 400
          throw error
        }
        presIds.add(presId)
      }
    }

    // Validar unicidad de código de barras si cambió
    if (codigoBarras && codigoBarras !== comboExistente.codigo_barra) {
      const existeCod = await combosRepository.checkCodigoBarraDuplicado(codigoBarras, empresaId, id)
      if (existeCod) {
        const error = new Error(`El código de barras "${codigoBarras}" ya está asignado a otro producto o combo.`)
        error.statusCode = 400
        throw error
      }
    }

    await db.transaction(async (tx) => {
      // 1. Actualizar cabecera del combo
      await tx
        .update(schema.productos)
        .set({
          nombre,
          codigo_barra: codigoBarras || null,
          activo: payload.activo !== undefined ? payload.activo : comboExistente.activo,
          updated_at: sql`NOW()`
        })
        .where(eq(schema.productos.id, id))

      // 2. Obtener o crear la presentación principal del combo
      let presCombo = await combosRepository.getPresentacionByComboId(id)
      if (!presCombo) {
        ;[presCombo] = await tx
          .insert(schema.presentaciones)
          .values({
            producto_uuid: id,
            nombre: 'COMBO',
            cod_barra: codigoBarras || null,
            unidad_medida_id: 'NIU',
            multiplica_por: 1,
            precio_venta: 0
          })
          .returning()
      }

      // 3. Si se enviaron detalles, actualizar y recalcular precio
      if (Array.isArray(detalles) && detalles.length > 0) {
        // En detalles de combo se reemplazan los componentes asignados
        await tx
          .delete(schema.combo_detalles)
          .where(eq(schema.combo_detalles.presentacion_combo_id, presCombo.id))

        let totalCentimos = 0

        for (const item of detalles) {
          const presComponenteId = item.presentacion_componente_id || item.IdPresentacion || item.id
          const cantidad = Math.max(1, parseInt(item.cantidad || item.Cantidad, 10) || 1)

          const presInfo = await combosRepository.getPresentacionComponente(presComponenteId, tx)
          const costoUnit = Number(presInfo?.precio_costo || 0) / factorPrecio
          const ventaUnit = Number(presInfo?.precio_venta || 0) / factorPrecio

          let tipoAjuste = 'MARGEN'
          let valorAjuste = 0

          if (item.tipo_ajuste) {
            tipoAjuste = item.tipo_ajuste === 'DESCUENTO' ? 'DESCUENTO' : 'MARGEN'
            valorAjuste = Math.abs(Number(item.valor_ajuste || 0))
          } else if (item.usar_margen_ganancia !== undefined) {
            tipoAjuste = item.usar_margen_ganancia ? 'MARGEN' : 'DESCUENTO'
            valorAjuste = Math.abs(Number(item.descuento || item.Descuento || item.margen_ganancia || 0))
          } else if (item.Descuento !== undefined) {
            const rawDesc = Number(item.Descuento)
            tipoAjuste = rawDesc < 0 ? 'MARGEN' : 'DESCUENTO'
            valorAjuste = Math.abs(rawDesc)
          }

          let precioFinalUnit = 0
          if (tipoAjuste === 'MARGEN') {
            precioFinalUnit = costoUnit + (costoUnit * valorAjuste) / 100
          } else {
            precioFinalUnit = ventaUnit - valorAjuste
          }
          if (precioFinalUnit < 0) precioFinalUnit = 0
          precioFinalUnit = Math.floor(precioFinalUnit * 1000) / 1000

          const precioFinalCentimos = Math.round(precioFinalUnit * factorPrecio)
          totalCentimos += precioFinalCentimos * cantidad

          await tx.insert(schema.combo_detalles).values({
            presentacion_combo_id: presCombo.id,
            presentacion_componente_id: presComponenteId,
            cantidad,
            tipo_ajuste: tipoAjuste,
            valor_ajuste: valorAjuste.toFixed(4),
            precio_final: precioFinalCentimos,
            activo: true
          })
        }

        await tx
          .update(schema.presentaciones)
          .set({
            cod_barra: codigoBarras || null,
            precio_venta: totalCentimos,
            updated_at: sql`NOW()`
          })
          .where(eq(schema.presentaciones.id, presCombo.id))
      } else {
        await tx
          .update(schema.presentaciones)
          .set({
            cod_barra: codigoBarras || null,
            updated_at: sql`NOW()`
          })
          .where(eq(schema.presentaciones.id, presCombo.id))
      }
    })

    return { id, message: 'Se guardaron los cambios correctamente.' }
  },

  // Alternar estado activo / inactivo
  async toggleEstado(id, { estado, activo }, { empresaId, esSuperAdmin }) {
    const combo = await combosRepository.getComboById(id, { empresaId, esSuperAdmin })
    if (!combo) {
      const error = new Error('Combo no encontrado')
      error.statusCode = 404
      throw error
    }

    let nuevoActivo = true
    if (estado !== undefined) {
      nuevoActivo = estado === 'Activo'
    } else if (activo !== undefined) {
      nuevoActivo = Boolean(activo)
    }

    await combosRepository.updateEstado(id, nuevoActivo)
    return { id, activo: nuevoActivo }
  },

  // Inactivación visual (Soft delete) del combo
  async inactivarCombo(id, { empresaId, esSuperAdmin }) {
    const combo = await combosRepository.getComboById(id, { empresaId, esSuperAdmin })
    if (!combo) {
      const error = new Error('Combo no encontrado')
      error.statusCode = 404
      throw error
    }

    return combosRepository.inactivateCombo(id)
  }
}

module.exports = combosService
