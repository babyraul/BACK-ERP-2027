'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql, inArray } = require('drizzle-orm')
const { getFactores, calcularStockPresentacion } = require('../utils/factores')

/**
 * Módulo de Combos Promocionales
 * 
 * Un combo es una entidad virtual comercial respaldada en la tabla `productos` con `es_combo = true`.
 * Tiene una presentación principal en `presentaciones` y sus componentes se almacenan en `combo_detalles`.
 * 
 * Reglas de negocio:
 * - Disponibilidad / Stock dinámico: min(floor(stock_disponible_componente / cantidad_requerida)).
 * - Doble modalidad por ítem:
 *   - Margen de ganancia (%): precioFinal = precioCosto + (precioCosto * margen / 100)
 *   - Descuento directo (S/): precioFinal = precioVenta - descuento
 * - Total del combo: suma de los precios finales de sus ítems.
 * - Restricciones: Al menos 1 producto componente, no duplicados de presentación, cantidad >= 1.
 * - Validación de unicidad de codigo_barra por empresa.
 */
async function combosRoutes(fastify) {
  // Verificación de autenticación y autorización RBAC (combos.ver, etc.)
  fastify.addHook('preHandler', fastify.authorize)

  // ── GET /api/combos ─────────────────────────────────────────────────────────────
  fastify.get('/', async (request, reply) => {
    try {
      const { q, activo } = request.query
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const branchId = request.user?.branch_id

      const { factorPrecio } = await getFactores()

      // Condiciones para filtrar productos que sean combos
      const conditions = [eq(schema.productos.es_combo, true)]

      if (!request.user.es_super_admin && empresaId) {
        conditions.push(or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`))
      }

      if (activo !== undefined) {
        conditions.push(eq(schema.productos.activo, activo === 'true' || activo === true))
      }

      if (q && q.trim() !== '') {
        const search = `%${q.trim()}%`
        conditions.push(
          or(
            ilike(schema.productos.nombre, search),
            ilike(schema.productos.codigo_barra, search),
            ilike(schema.productos.codigo, search)
          )
        )
      }

      // 1. Obtener cabeceras de combos
      const combosRows = await db
        .select({
          id: schema.productos.id,
          IdCombo: schema.productos.id,
          codigo: schema.productos.codigo,
          nombre: schema.productos.nombre,
          Nombre: schema.productos.nombre,
          codigo_barra: schema.productos.codigo_barra,
          CodigoBarras: schema.productos.codigo_barra,
          descripcion: schema.productos.descripcion,
          activo: schema.productos.activo,
          Estado: sql`CASE WHEN ${schema.productos.activo} = true THEN 'Activo' ELSE 'Inactivo' END`,
          created_at: schema.productos.created_at,
          updated_at: schema.productos.updated_at
        })
        .from(schema.productos)
        .where(and(...conditions))
        .orderBy(desc(schema.productos.created_at))

      if (combosRows.length === 0) {
        return reply.code(200).send([])
      }

      const comboIds = combosRows.map((c) => c.id)

      // 2. Obtener presentaciones de los combos
      const presentacionesCombo = await db
        .select()
        .from(schema.presentaciones)
        .where(inArray(schema.presentaciones.producto_uuid, comboIds))

      const presComboMap = {}
      const presComboIds = []
      presentacionesCombo.forEach((p) => {
        presComboMap[p.producto_uuid] = p
        presComboIds.push(p.id)
      })

      // 3. Obtener los detalles de los combos
      let detallesRows = []
      if (presComboIds.length > 0) {
        detallesRows = await db
          .select({
            id: schema.combo_detalles.id,
            presentacion_combo_id: schema.combo_detalles.presentacion_combo_id,
            presentacion_componente_id: schema.combo_detalles.presentacion_componente_id,
            cantidad: schema.combo_detalles.cantidad,
            tipo_ajuste: schema.combo_detalles.tipo_ajuste,
            valor_ajuste: schema.combo_detalles.valor_ajuste,
            precio_final: schema.combo_detalles.precio_final,
            activo: schema.combo_detalles.activo,
            // Info de la presentación componente
            comp_nombre: schema.presentaciones.nombre,
            comp_producto_uuid: schema.presentaciones.producto_uuid,
            comp_precio_costo: schema.presentaciones.precio_costo,
            comp_precio_venta: schema.presentaciones.precio_venta,
            comp_multiplica_por: schema.presentaciones.multiplica_por,
            comp_unidad_medida_id: schema.presentaciones.unidad_medida_id,
            // Info del producto componente
            prod_nombre: schema.productos.nombre,
            prod_codigo: schema.productos.codigo,
            prod_codigo_barra: schema.productos.codigo_barra
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
              inArray(schema.combo_detalles.presentacion_combo_id, presComboIds),
              eq(schema.combo_detalles.activo, true)
            )
          )
      }

      // 4. Obtener stocks de los productos componentes en la sucursal activa
      const componenteProdIds = Array.from(
        new Set(detallesRows.map((d) => d.comp_producto_uuid).filter(Boolean))
      )
      const stockPorProd = {}

      if (componenteProdIds.length > 0 && branchId) {
        const stockActualRows = await db
          .select({
            producto_id: schema.stock_actual.producto_id,
            saldo_actual: schema.stock_actual.saldo_actual
          })
          .from(schema.stock_actual)
          .where(
            and(
              eq(schema.stock_actual.branch_id, branchId),
              inArray(schema.stock_actual.producto_id, componenteProdIds)
            )
          )

        stockActualRows.forEach((row) => {
          stockPorProd[row.producto_id] =
            (stockPorProd[row.producto_id] || 0) + Number(row.saldo_actual || 0)
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
      const result = combosRows.map((combo) => {
        const pres = presComboMap[combo.id]
        const detalles = pres ? detallesPorPresCombo[pres.id] || [] : []

        let stockDisponible = detalles.length > 0 ? Infinity : 0
        let precioAcumuladoCentimos = 0

        const itemsEnriquecidos = detalles.map((det) => {
          const cantidadReq = Math.max(1, Number(det.cantidad || 1))
          const multiplicaPor = Math.max(1, Number(det.comp_multiplica_por || 1))
          const saldoBase = stockPorProd[det.comp_producto_uuid] || 0
          const stockPresentacion = calcularStockPresentacion(saldoBase, multiplicaPor)

          // Disponibilidad para este ítem: stockPresentacion / cantidadReq
          const dispItem = Math.floor(stockPresentacion / cantidadReq)
          if (dispItem < stockDisponible) {
            stockDisponible = dispItem
          }

          const costoUnit = Number(det.comp_precio_costo || 0) / factorPrecio
          const ventaUnit = Number(det.comp_precio_venta || 0) / factorPrecio
          const tipoAjuste = det.tipo_ajuste || 'MARGEN'
          const valorAjuste = Number(det.valor_ajuste || 0)

          // Cálculo del precio unitario final del ítem
          let precioFinalUnit = 0
          if (tipoAjuste === 'MARGEN') {
            precioFinalUnit = costoUnit + (costoUnit * valorAjuste) / 100
          } else {
            precioFinalUnit = ventaUnit - valorAjuste
          }
          if (precioFinalUnit < 0) precioFinalUnit = 0

          // Truncado floor a 3 decimales para coincidencia legacy
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
          stock: Math.max(0, stockDisponible),
          Stock: Math.max(0, stockDisponible),
          precio: precioTotalSoles,
          Precio: precioTotalSoles,
          total_items: itemsEnriquecidos.length,
          detalles: itemsEnriquecidos
        }
      })

      return reply.code(200).send(result)
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'No se pudo obtener el listado de combos.',
        error: error.message
      })
    }
  })

  // ── GET /api/combos/:id ─────────────────────────────────────────────────────────
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const branchId = request.user?.branch_id
      const { factorPrecio } = await getFactores()

      const conditions = [eq(schema.productos.id, id), eq(schema.productos.es_combo, true)]
      if (!request.user.es_super_admin && empresaId) {
        conditions.push(or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`))
      }

      const [combo] = await db
        .select({
          id: schema.productos.id,
          IdCombo: schema.productos.id,
          codigo: schema.productos.codigo,
          nombre: schema.productos.nombre,
          Nombre: schema.productos.nombre,
          codigo_barra: schema.productos.codigo_barra,
          CodigoBarras: schema.productos.codigo_barra,
          descripcion: schema.productos.descripcion,
          activo: schema.productos.activo,
          Estado: sql`CASE WHEN ${schema.productos.activo} = true THEN 'Activo' ELSE 'Inactivo' END`,
          created_at: schema.productos.created_at,
          updated_at: schema.productos.updated_at
        })
        .from(schema.productos)
        .where(and(...conditions))

      if (!combo) {
        return reply.code(404).send({ success: false, message: 'Combo no encontrado' })
      }

      // Obtener presentación del combo
      const [pres] = await db
        .select()
        .from(schema.presentaciones)
        .where(eq(schema.presentaciones.producto_uuid, combo.id))
        .limit(1)

      let items = []
      if (pres) {
        const detallesRows = await db
          .select({
            id: schema.combo_detalles.id,
            presentacion_combo_id: schema.combo_detalles.presentacion_combo_id,
            presentacion_componente_id: schema.combo_detalles.presentacion_componente_id,
            cantidad: schema.combo_detalles.cantidad,
            tipo_ajuste: schema.combo_detalles.tipo_ajuste,
            valor_ajuste: schema.combo_detalles.valor_ajuste,
            precio_final: schema.combo_detalles.precio_final,
            activo: schema.combo_detalles.activo,
            comp_nombre: schema.presentaciones.nombre,
            comp_producto_uuid: schema.presentaciones.producto_uuid,
            comp_precio_costo: schema.presentaciones.precio_costo,
            comp_precio_venta: schema.presentaciones.precio_venta,
            comp_multiplica_por: schema.presentaciones.multiplica_por,
            comp_unidad_medida_id: schema.presentaciones.unidad_medida_id,
            prod_nombre: schema.productos.nombre,
            prod_codigo: schema.productos.codigo,
            prod_codigo_barra: schema.productos.codigo_barra
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
              eq(schema.combo_detalles.presentacion_combo_id, pres.id),
              eq(schema.combo_detalles.activo, true)
            )
          )

        // Pre-cargar stocks de componentes
        const componenteProdIds = Array.from(
          new Set(detallesRows.map((d) => d.comp_producto_uuid).filter(Boolean))
        )
        const stockPorProd = {}
        if (componenteProdIds.length > 0 && branchId) {
          const stockActualRows = await db
            .select({
              producto_id: schema.stock_actual.producto_id,
              saldo_actual: schema.stock_actual.saldo_actual
            })
            .from(schema.stock_actual)
            .where(
              and(
                eq(schema.stock_actual.branch_id, branchId),
                inArray(schema.stock_actual.producto_id, componenteProdIds)
              )
            )
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

      return reply.code(200).send({
        ...combo,
        presentacion_id: pres?.id,
        precio: totalRedondeado,
        detalles: items
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'No se puede obtener información en este momento. Inténtelo en unos minutos.',
        error: error.message
      })
    }
  })

  // ── POST /api/combos ────────────────────────────────────────────────────────────
  fastify.post('/', async (request, reply) => {
    try {
      const payload = request.body || {}
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const { factorPrecio } = await getFactores()

      // Validaciones de contrato
      const nombre = (payload.nombre || payload.Nombre || '').trim()
      if (!nombre) {
        return reply.code(400).send({ success: false, message: 'El nombre del combo es obligatorio.' })
      }

      const codigoBarras = (payload.codigo_barra || payload.codBarras || payload.CodigoBarras || '').trim()
      const detalles = payload.detalles || payload.items || []

      // VC-01: Mínimo 1 producto
      if (!Array.isArray(detalles) || detalles.length === 0) {
        return reply.code(400).send({ success: false, message: 'Se debe asignar al menos un producto.' })
      }

      // VI-01: Verificar no duplicados por presentación
      const presentacionIds = new Set()
      for (const d of detalles) {
        const presId = d.presentacion_componente_id || d.IdPresentacion || d.id
        if (!presId) {
          return reply.code(400).send({ success: false, message: 'Identificador de presentación inválido en los ítems.' })
        }
        if (presentacionIds.has(presId)) {
          return reply.code(400).send({ success: false, message: 'El producto ya se encuentra registrado.' })
        }
        presentacionIds.add(presId)
      }

      // Validación de unicidad de código de barras por empresa
      if (codigoBarras) {
        const [existeCod] = await db
          .select({ id: schema.productos.id })
          .from(schema.productos)
          .where(
            and(
              eq(schema.productos.codigo_barra, codigoBarras),
              empresaId ? eq(schema.productos.empresa_id, empresaId) : sql`true`
            )
          )
          .limit(1)

        if (existeCod) {
          return reply.code(400).send({
            success: false,
            message: `El código de barras "${codigoBarras}" ya está asignado a otro producto o combo.`
          })
        }
      }

      // Ejecución Transaccional Atómica
      const result = await db.transaction(async (tx) => {
        // 1. Insertar Producto con bandera es_combo = true
        const [nuevoCombo] = await tx
          .insert(schema.productos)
          .values({
            empresa_id: empresaId || null,
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

        // 2. Calcular precio acumulado en céntimos
        let totalCentimos = 0
        const itemsParaInsertar = []

        for (const item of detalles) {
          const presComponenteId = item.presentacion_componente_id || item.IdPresentacion || item.id
          const cantidad = Math.max(1, parseInt(item.cantidad || item.Cantidad, 10) || 1)

          // Obtener costos y precios de la presentación del componente
          const [presInfo] = await tx
            .select({
              precio_costo: schema.presentaciones.precio_costo,
              precio_venta: schema.presentaciones.precio_venta
            })
            .from(schema.presentaciones)
            .where(eq(schema.presentaciones.id, presComponenteId))
            .limit(1)

          const costoUnit = Number(presInfo?.precio_costo || 0) / factorPrecio
          const ventaUnit = Number(presInfo?.precio_venta || 0) / factorPrecio

          // Determinar modalidad: si viene usar_margen_ganancia explícito o si Descuento legacy era negativo
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

        // 4. Insertar detalles vinculados a nuevaPres.id
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

      return reply.code(201).send({
        success: true,
        message: 'Se guardaron los cambios correctamente.',
        data: result
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'No se pudo registrar el combo. Inténtalo otra vez.',
        error: error.message
      })
    }
  })

  // ── PUT /api/combos/:id ─────────────────────────────────────────────────────────
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params
      const payload = request.body || {}
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const { factorPrecio } = await getFactores()

      // Verificar existencia del combo
      const [comboExistente] = await db
        .select()
        .from(schema.productos)
        .where(
          and(
            eq(schema.productos.id, id),
            eq(schema.productos.es_combo, true),
            !request.user.es_super_admin && empresaId
              ? or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`)
              : sql`true`
          )
        )
        .limit(1)

      if (!comboExistente) {
        return reply.code(404).send({ success: false, message: 'Combo no encontrado' })
      }

      const nombre = (payload.nombre || payload.Nombre || comboExistente.nombre || '').trim()
      if (!nombre) {
        return reply.code(400).send({ success: false, message: 'El nombre del combo es obligatorio.' })
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
        return reply.code(400).send({ success: false, message: 'Se debe asignar al menos un producto.' })
      }

      // Validar duplicados de componentes si se envían detalles
      if (Array.isArray(detalles)) {
        const presIds = new Set()
        for (const d of detalles) {
          const presId = d.presentacion_componente_id || d.IdPresentacion || d.id
          if (presIds.has(presId)) {
            return reply.code(400).send({ success: false, message: 'El producto ya se encuentra registrado.' })
          }
          presIds.add(presId)
        }
      }

      // Validar unicidad de código de barras
      if (codigoBarras && codigoBarras !== comboExistente.codigo_barra) {
        const [existeCod] = await db
          .select({ id: schema.productos.id })
          .from(schema.productos)
          .where(
            and(
              eq(schema.productos.codigo_barra, codigoBarras),
              sql`${schema.productos.id} != ${id}`,
              empresaId ? eq(schema.productos.empresa_id, empresaId) : sql`true`
            )
          )
          .limit(1)

        if (existeCod) {
          return reply.code(400).send({
            success: false,
            message: `El código de barras "${codigoBarras}" ya está asignado a otro producto o combo.`
          })
        }
      }

      // Transacción atómica de actualización
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
        let [presCombo] = await tx
          .select()
          .from(schema.presentaciones)
          .where(eq(schema.presentaciones.producto_uuid, id))
          .limit(1)

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

        // 3. Si se enviaron detalles, recalcular y reemplazar atómicamente
        if (Array.isArray(detalles) && detalles.length > 0) {
          // Eliminar detalles previos
          await tx
            .delete(schema.combo_detalles)
            .where(eq(schema.combo_detalles.presentacion_combo_id, presCombo.id))

          let totalCentimos = 0

          for (const item of detalles) {
            const presComponenteId = item.presentacion_componente_id || item.IdPresentacion || item.id
            const cantidad = Math.max(1, parseInt(item.cantidad || item.Cantidad, 10) || 1)

            const [presInfo] = await tx
              .select({
                precio_costo: schema.presentaciones.precio_costo,
                precio_venta: schema.presentaciones.precio_venta
              })
              .from(schema.presentaciones)
              .where(eq(schema.presentaciones.id, presComponenteId))
              .limit(1)

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

          // Actualizar presentación con el nuevo precio total
          await tx
            .update(schema.presentaciones)
            .set({
              cod_barra: codigoBarras || null,
              precio_venta: totalCentimos,
              updated_at: sql`NOW()`
            })
            .where(eq(schema.presentaciones.id, presCombo.id))
        } else {
          // Solo actualizar código de barra en la presentación si no cambiaron detalles
          await tx
            .update(schema.presentaciones)
            .set({
              cod_barra: codigoBarras || null,
              updated_at: sql`NOW()`
            })
            .where(eq(schema.presentaciones.id, presCombo.id))
        }
      })

      return reply.code(200).send({
        success: true,
        message: 'Se guardaron los cambios correctamente.'
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'No se pudo registrar el combo. Inténtalo otra vez.',
        error: error.message
      })
    }
  })

  // ── PATCH /api/combos/:id (Activar / Desactivar) ────────────────────────────────
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params
      const { Estado, activo } = request.body || {}
      const empresaId = request.user?.empresa_id || request.user?.branch_id

      let nuevoActivo = true
      if (Estado !== undefined) {
        nuevoActivo = Estado === 'Activo'
      } else if (activo !== undefined) {
        nuevoActivo = Boolean(activo)
      }

      const [combo] = await db
        .select({ id: schema.productos.id })
        .from(schema.productos)
        .where(
          and(
            eq(schema.productos.id, id),
            eq(schema.productos.es_combo, true),
            !request.user.es_super_admin && empresaId
              ? or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`)
              : sql`true`
          )
        )
        .limit(1)

      if (!combo) {
        return reply.code(404).send({ success: false, message: 'Combo no encontrado' })
      }

      await db.transaction(async (tx) => {
        await tx
          .update(schema.productos)
          .set({ activo: nuevoActivo, updated_at: sql`NOW()` })
          .where(eq(schema.productos.id, id))

        await tx
          .update(schema.presentaciones)
          .set({ activo: nuevoActivo, updated_at: sql`NOW()` })
          .where(eq(schema.presentaciones.producto_uuid, id))
      })

      return reply.code(200).send({
        success: true,
        message: 'Se actualizó correctamente el combo.'
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'Error al cambiar estado del combo: ' + error.message
      })
    }
  })

  // ── DELETE /api/combos/:id (Anular / Eliminar) ──────────────────────────────────
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params
      const empresaId = request.user?.empresa_id || request.user?.branch_id

      const [combo] = await db
        .select()
        .from(schema.productos)
        .where(
          and(
            eq(schema.productos.id, id),
            eq(schema.productos.es_combo, true),
            !request.user.es_super_admin && empresaId
              ? or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`)
              : sql`true`
          )
        )
        .limit(1)

      if (!combo) {
        return reply.code(404).send({ success: false, message: 'Combo no encontrado' })
      }

      await db.transaction(async (tx) => {
        // Obtener presentaciones del combo
        const presRows = await tx
          .select({ id: schema.presentaciones.id })
          .from(schema.presentaciones)
          .where(eq(schema.presentaciones.producto_uuid, id))

        const presIds = presRows.map((p) => p.id)

        // Borrar detalles de combos asociados
        if (presIds.length > 0) {
          await tx
            .delete(schema.combo_detalles)
            .where(inArray(schema.combo_detalles.presentacion_combo_id, presIds))
        }

        // Borrar presentaciones
        await tx
          .delete(schema.presentaciones)
          .where(eq(schema.presentaciones.producto_uuid, id))

        // Borrar cabecera en productos
        await tx
          .delete(schema.productos)
          .where(eq(schema.productos.id, id))
      })

      return reply.code(200).send({
        success: true,
        message: 'Se eliminó correctamente.'
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'Error al eliminar el combo: ' + error.message
      })
    }
  })
}

module.exports = combosRoutes
