'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql, inArray } = require('drizzle-orm')
const {
  getFactores,
  toPrecioInt,
  toVolumenInt,
  normalizeVolumenInt,
  toVolumenVisual
} = require('../utils/factores')

/**
 * Rutas Transaccionales para Ventas Finales y Facturación
 * Prefijo: /api/ventas
 */
async function ventasRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

  // 1. GET /api/ventas - Listar ventas con filtros
  fastify.get('/', auth, async (request, reply) => {
    try {
      const { fecha_inicio, fecha_fin, estado, tipo_documento, q } = request.query
      const branchId = request.user?.branch_id

      const conditions = []

      // RLS por sucursal
      if (!request.user?.es_super_admin && branchId) {
        conditions.push(eq(schema.ventas.branch_id, branchId))
      }

      if (estado) {
        conditions.push(eq(schema.ventas.estado, estado))
      }

      if (tipo_documento) {
        const tipoId = tipo_documento === 'factura' ? '01' : tipo_documento === 'boleta' ? '03' : 'VL'
        conditions.push(eq(schema.ventas.tipo_comprobante_id, tipoId))
      }

      // Normalizar fecha real de emisión (corrige registros donde toISOString() guardó hora UTC +5h en columna timestamp without time zone)
      const fechaEfectivaExpr = sql`CASE 
        WHEN ${schema.ventas.created_at} IS NOT NULL 
         AND ${schema.ventas.fecha_emision} > (${schema.ventas.created_at} + INTERVAL '4 hours')
        THEN ${schema.ventas.created_at}
        ELSE COALESCE(${schema.ventas.fecha_emision}, ${schema.ventas.created_at})
      END`

      if (fecha_inicio) {
        conditions.push(sql`DATE(${fechaEfectivaExpr}) >= ${fecha_inicio}::date`)
      }

      if (fecha_fin) {
        conditions.push(sql`DATE(${fechaEfectivaExpr}) <= ${fecha_fin}::date`)
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

      const { factorPrecio } = await getFactores()

      const ventas = await db
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

      return reply.code(200).send({ success: true, data: ventas, total: ventas.length })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ success: false, message: 'Error al listar ventas: ' + error.message })
    }
  })

  // 2. GET /api/ventas/:id - Obtener detalle completo de la venta
  fastify.get('/:id', auth, async (request, reply) => {
    try {
      const { id } = request.params
      const { factorPrecio, factorVolumen } = await getFactores()

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

      if (!venta) {
        return reply.code(404).send({ success: false, message: 'Venta no encontrada' })
      }

      // Detalle de ítems
      const rawItems = await db
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
        .where(eq(schema.detalle_ventas.venta_id, id))

      // Obtener desglose de combos asociados a los items si existen
      const detalleVentaIds = rawItems.map((it) => it.id).filter(Boolean)
      let comboDetallesVentaMap = {}
      if (detalleVentaIds.length > 0) {
        const comboRows = await db
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

        comboRows.forEach((r) => {
          if (!comboDetallesVentaMap[r.detalle_venta_id]) {
            comboDetallesVentaMap[r.detalle_venta_id] = []
          }
          comboDetallesVentaMap[r.detalle_venta_id].push({
            ...r,
            cantidad_base: toVolumenVisual(r.cantidad_base, factorVolumen)
          })
        })
      }

      const items = rawItems.map((it) => {
        const unidad = it.presentacion_unidad_medida_id || it.producto_unidad_medida_id || 'NIU'
        return {
          ...it,
          unidad_medida_id: unidad,
          cantidad: toVolumenVisual(it.cantidad, factorVolumen),
          cantidad_raw: Number(it.cantidad || 0),
          combo_detalles: comboDetallesVentaMap[it.id] || []
        }
      })

      // Detalle de pagos asociados
      const pagos = await db
        .select({
          id: schema.ventas_pagos.id,
          metodo_pago_id: schema.ventas_pagos.metodo_pago_id,
          metodo_nombre: schema.tipo_metodo_pago.nombre,
          monto: sql`ROUND(CAST(${schema.ventas_pagos.monto} AS numeric) / ${factorPrecio}, 2)`,
          numero_operacion: schema.ventas_pagos.numero_operacion
        })
        .from(schema.ventas_pagos)
        .leftJoin(schema.tipo_metodo_pago, eq(schema.ventas_pagos.metodo_pago_id, schema.tipo_metodo_pago.id))
        .where(eq(schema.ventas_pagos.venta_id, id))

      return reply.code(200).send({
        success: true,
        data: {
          ...venta,
          items,
          detalles: items,
          pagos
        }
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ success: false, message: 'Error al consultar venta: ' + error.message })
    }
  })

  // 3. POST /api/ventas - Transacción final de Venta (Cobro de Preventa + Generación Comprobante)
  fastify.post('/', auth, async (request, reply) => {
    try {
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
      } = request.body

      const branchId = request.user?.branch_id
      const usuarioId = request.user?.id

      if (!branchId) {
        return reply.code(400).send({ success: false, message: 'El usuario no tiene una sucursal activa' })
      }

      // Validar monto >= 700 para clientes anónimos (Regla Fiscal SUNAT RN-V03)
      const isUUID = (str) =>
        Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      let clienteDoc = null
      if (cliente_id && isUUID(cliente_id)) {
        const [cli] = await db
          .select({ numero_documento: schema.clientes.numero_documento })
          .from(schema.clientes)
          .where(eq(schema.clientes.id, cliente_id))
          .limit(1)
        clienteDoc = cli?.numero_documento
      }

      const esClienteGenerico = !clienteDoc || clienteDoc === '99999999' || clienteDoc === '00000000'
      const totalNum = Number(total || 0)
      if (totalNum >= 700 && esClienteGenerico && tipo_documento !== 'vale') {
        return reply.code(422).send({
          success: false,
          message: 'Para montos mayores o iguales a S/. 700.00 SUNAT exige identificar al cliente con DNI o RUC.'
        })
      }

      // Obtener turno activo del usuario en la sucursal (RN-V01 y RN-V02)
      const [turnoActivo] = await db
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

      if (!turnoActivo) {
        return reply.code(400).send({
          success: false,
          message: 'No tiene un turno de caja abierto para registrar ventas. Por favor aperture un turno en el módulo Caja.'
        })
      }

      // Validación RN-V02: Cierre vencido a las 03:30 AM del día siguiente
      if (turnoActivo.fecha_apertura) {
        const fechaApertura = new Date(turnoActivo.fecha_apertura)
        const ahora = new Date()
        const limiteVencimiento = new Date(fechaApertura)
        limiteVencimiento.setDate(limiteVencimiento.getDate() + 1)
        limiteVencimiento.setHours(3, 30, 0, 0)

        if (ahora > limiteVencimiento) {
          return reply.code(400).send({
            success: false,
            message: 'El turno de caja activo está vencido (límite superado: 03:30 AM del día siguiente). Debe realizar el arqueo y cierre de caja antes de continuar vendiendo.'
          })
        }
      }

      // Validación de concurrencia: Si proviene de preventa, verificar que no esté ya PROCESADA
      if (preventa_id) {
        const [pv] = await db
          .select({ id: schema.pre_ventas.id, estado: schema.pre_ventas.estado })
          .from(schema.pre_ventas)
          .where(eq(schema.pre_ventas.id, preventa_id))
          .limit(1)

        if (pv && pv.estado === 'PROCESADA') {
          return reply.code(400).send({
            success: false,
            message: 'Esta preventa ya ha sido procesada previamente. No se puede cobrar dos veces.'
          })
        }
      }

      const tipoDocNormalized = String(tipo_documento || 'boleta').toLowerCase()
      const tipoComprobanteId =
        tipoDocNormalized === 'factura' ? '01' : tipoDocNormalized === 'boleta' ? '03' : 'VL'

      // Iniciar Transacción Atómica
      const ventaRegistrada = await db.transaction(async (tx) => {
        // A. Asignar Serie y Correlativo atómico con bloqueo pesimista FOR UPDATE
        // Previene race conditions y duplicidad ante ventas masivas concurrentes
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
          throw new Error(
            `No existe una serie activa configurada en caja_serie_correlativo para el tipo de comprobante ${docNombre} (${tipoComprobanteId}) en esta sucursal.`
          )
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

        // Determinar si es facturable ante SUNAT
        const esFacturableSunat = tipoComprobanteId === '01' || tipoComprobanteId === '03'
        const isUUID = (str) =>
          Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

        // Pre-cargar productos para asegurar su tipo_afectacion_igv real desde BD si no viene o viene por defecto
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

        // Acumuladores de bases fiscales calculadas a partir de cada ítem
        let gravadasTotalCalc = 0
        let exoneradasTotalCalc = 0
        let inafectasTotalCalc = 0
        let gratuitasTotalCalc = 0
        let igvTotalCalc = 0

        const itemsProcesados = items.map((item) => {
          const cantVisual = Number(item.cantidad || 1)
          const precioVisual = Number(item.precio_unitario || item.precio || 0)
          const descVisual = Number(item.descuento || 0)
          const isGratuito = Boolean(item.gratuito || item.es_gratuito)

          // Afectación: tomar de item o de BD (Productos.tipo_tributo)
          const afectacionRaw = String(item.tipo_afectacion_igv || prodsMap[item.producto_id]?.tipo_tributo || '10').trim()
          const afectacionNum = parseInt(afectacionRaw, 10) || 10

          let itemSubtotalVisual = 0
          let itemIgvVisual = 0
          let itemTotalVisual = 0

          if (isGratuito || (afectacionNum >= 11 && afectacionNum <= 16) || afectacionNum === 21 || (afectacionNum >= 31 && afectacionNum <= 37)) {
            // Operación Gratuita
            itemTotalVisual = 0
            itemSubtotalVisual = 0
            itemIgvVisual = 0
            gratuitasTotalCalc += Number((cantVisual * precioVisual).toFixed(2))
          } else if (afectacionNum === 20) {
            // Exonerada (tasa 0%)
            itemTotalVisual = Math.max(0, Number((cantVisual * precioVisual - descVisual).toFixed(2)))
            itemSubtotalVisual = itemTotalVisual
            itemIgvVisual = 0
            exoneradasTotalCalc += itemSubtotalVisual
          } else if (afectacionNum === 30 || afectacionNum === 40) {
            // Inafecta / Exportación (tasa 0%)
            itemTotalVisual = Math.max(0, Number((cantVisual * precioVisual - descVisual).toFixed(2)))
            itemSubtotalVisual = itemTotalVisual
            itemIgvVisual = 0
            inafectasTotalCalc += itemSubtotalVisual
          } else {
            // Gravada (10, 17, etc.) - Desglose 1.18
            itemTotalVisual = Math.max(0, Number((cantVisual * precioVisual - descVisual).toFixed(2)))
            itemSubtotalVisual = Number((itemTotalVisual / 1.18).toFixed(2))
            itemIgvVisual = Number((itemTotalVisual - itemSubtotalVisual).toFixed(2))
            gravadasTotalCalc += itemSubtotalVisual
            igvTotalCalc += itemIgvVisual
          }

          return {
            ...item,
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
            facturado: false, // Se actualiza posteriormente con el módulo de facturación electrónica
            fecha_emision: sql`NOW()`
          })
          .returning()

        const numeroComprobante = `${serieAsignada}-${String(correlativoAsignado).padStart(8, '0')}`

        // Resolver almacén principal de la sucursal (o crearlo si aún no existe)
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

        // C. Insertar detalle de venta y registrar movimiento de stock (stock_actual + kardex stock)
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
              // Si el ID enviado no existe en la BD (ej. presentación antigua), buscar la principal del producto
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

          // D. Verificar si es un Combo para descontar stock de componentes y registrar combo_detalle_ventas
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

              // Stock de subproducto en almacén
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

                // Registrar movimiento histórico (Kárdex) en tabla stock para el componente
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

                // Costos snapshots
                const costoUnitarioBase = (Number(comp.comp_precio_costo || 0) / (factorPrecio * multiplicaComp)).toFixed(6)
                const costoTotalSnapshot = Math.round(Number(costoUnitarioBase) * cantCompTotalBaseVisual * factorPrecio)
                const precioProporcionalHistorico = Math.round(Number(comp.precio_final || 0) * cantVisual)

                // Registrar en combo_detalle_ventas
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

              // Registrar movimiento histórico (Kárdex) en tabla stock (tipo_mov: 2 = Salida)
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

      return reply.code(201).send({
        success: true,
        message: 'Venta registrada y comprobante emitido exitosamente',
        data: ventaRegistrada
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ success: false, message: 'Error al procesar venta: ' + error.message })
    }
  })

  // 4. POST /api/ventas/:id/anular - Anular venta emitida
  fastify.post('/:id/anular', auth, async (request, reply) => {
    try {
      const { id } = request.params
      const { motivo } = request.body || {}

      const [venta] = await db
        .select()
        .from(schema.ventas)
        .where(eq(schema.ventas.id, id))

      if (!venta) {
        return reply.code(404).send({ success: false, message: 'Venta no encontrada' })
      }

      const estActual = String(venta.estado || '').toUpperCase()
      if (estActual === 'ANULADO' || estActual === 'ANULADA') {
        return reply.code(400).send({ success: false, message: 'El comprobante ya se encuentra anulado' })
      }

      const numeroComprobante = `${venta.serie || 'S/N'}-${String(venta.correlativo || 0).padStart(8, '0')}`
      const usuarioId = request.user?.id || venta.usuario_id
      const { factorVolumen } = await getFactores()

      await db.transaction(async (tx) => {
        // 1. Marcar venta como ANULADO
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
                  usuario_id: usuarioId,
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
                usuario_id: usuarioId,
                branch_id: venta.branch_id,
                almacen_id: almacen.id
              })
            }
          }
        }
      })

      return reply.code(200).send({
        success: true,
        message: `Venta ${venta.serie}-${venta.correlativo} anulada correctamente`
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ success: false, message: 'Error al anular venta: ' + error.message })
    }
  })
}

module.exports = ventasRoutes
