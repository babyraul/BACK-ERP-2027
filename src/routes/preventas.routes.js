'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')
const { getFactores, toPrecioInt, toVolumenInt, toVolumenVisual } = require('../utils/factores')

/**
 * Rutas para Pre-Ventas (pedidos / reservas antes del pago)
 * Prefijo: /api/preventas
 */
async function preventasRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

  const fechaEfectivaExpr = sql`CASE 
    WHEN ${schema.pre_ventas.created_at} IS NOT NULL 
     AND ${schema.pre_ventas.fecha_emision} > (${schema.pre_ventas.created_at} + INTERVAL '4 hours')
    THEN ${schema.pre_ventas.created_at}
    ELSE COALESCE(${schema.pre_ventas.fecha_emision}, ${schema.pre_ventas.created_at})
  END`

  // 1. GET /api/preventas - Listar preventas con filtros
  fastify.get('/', auth, async (request, reply) => {
    try {
      const { fecha_inicio, fecha_fin, estado, q } = request.query
      const branchId = request.user?.branch_id

      const conditions = []

      // RLS por sucursal
      if (!request.user?.es_super_admin && branchId) {
        conditions.push(eq(schema.pre_ventas.branch_id, branchId))
      }

      // Por requerimiento: listar preventas en estado PENDIENTE por defecto
      const estadoFiltro = estado !== undefined ? (estado || undefined) : 'PENDIENTE'
      if (estadoFiltro) {
        conditions.push(eq(schema.pre_ventas.estado, estadoFiltro))
      }

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
            ilike(schema.pre_ventas.alias, queryTerm),
            ilike(schema.usuarios.nombre, queryTerm),
            sql`CAST(${schema.pre_ventas.id} AS text) ILIKE ${queryTerm}`
          )
        )
      }

      const { factorPrecio } = await getFactores()

      const preventas = await db
        .select({
          id: schema.pre_ventas.id,
          codigo: sql`CONCAT('PV-', SUBSTRING(CAST(${schema.pre_ventas.id} AS text), 1, 4))`,
          branch_id: schema.pre_ventas.branch_id,
          caja_turno_id: schema.pre_ventas.caja_turno_id,
          usuario_id: schema.pre_ventas.usuario_id,
          usuario_nombre: schema.usuarios.nombre,
          usuario: schema.usuarios.usuario,
          cliente_id: schema.pre_ventas.cliente_id,
          cliente_nombre: schema.clientes.nombre_razon_social,
          cliente_numero_documento: schema.clientes.numero_documento,
          cliente_direccion: schema.clientes.direccion_1,
          tipo_comprobante_id: schema.pre_ventas.tipo_comprobante_id,
          tipo_documento: sql`CASE 
            WHEN ${schema.pre_ventas.tipo_comprobante_id} = '01' THEN 'factura'
            WHEN ${schema.pre_ventas.tipo_comprobante_id} = '03' THEN 'boleta'
            ELSE 'vale'
          END`,
          alias: schema.pre_ventas.alias,
          placa: schema.pre_ventas.alias,
          moneda: schema.pre_ventas.moneda,
          fecha_emision: fechaEfectivaExpr,
          gravadas: sql`ROUND(CAST(${schema.pre_ventas.gravadas} AS numeric) / ${factorPrecio}, 2)`,
          igv: sql`ROUND(CAST(${schema.pre_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
          total: sql`ROUND(CAST(${schema.pre_ventas.total_venta} AS numeric) / ${factorPrecio}, 2)`,
          total_preventa: sql`ROUND(CAST(${schema.pre_ventas.total_venta} AS numeric) / ${factorPrecio}, 2)`,
          estado: schema.pre_ventas.estado,
          created_at: schema.pre_ventas.created_at,
          updated_at: schema.pre_ventas.updated_at
        })
        .from(schema.pre_ventas)
        .leftJoin(schema.clientes, eq(schema.pre_ventas.cliente_id, schema.clientes.id))
        .leftJoin(schema.usuarios, eq(schema.pre_ventas.usuario_id, schema.usuarios.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.pre_ventas.created_at))

      return reply.code(200).send({ success: true, data: preventas, total: preventas.length })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ success: false, message: 'Error al consultar preventas: ' + error.message })
    }
  })

  // 2. GET /api/preventas/:id - Obtener cabecera y detalle de la preventa
  fastify.get('/:id', auth, async (request, reply) => {
    try {
      const { id } = request.params
      const { factorPrecio, factorVolumen } = await getFactores()

      const [preventa] = await db
        .select({
          id: schema.pre_ventas.id,
          codigo: sql`CONCAT('PV-', SUBSTRING(CAST(${schema.pre_ventas.id} AS text), 1, 4))`,
          branch_id: schema.pre_ventas.branch_id,
          caja_turno_id: schema.pre_ventas.caja_turno_id,
          usuario_id: schema.pre_ventas.usuario_id,
          usuario_nombre: schema.usuarios.nombre,
          usuario: schema.usuarios.usuario,
          cliente_id: schema.pre_ventas.cliente_id,
          cliente_nombre: schema.clientes.nombre_razon_social,
          cliente_numero_documento: schema.clientes.numero_documento,
          cliente_direccion: schema.clientes.direccion_1,
          tipo_comprobante_id: schema.pre_ventas.tipo_comprobante_id,
          tipo_documento: sql`CASE 
            WHEN ${schema.pre_ventas.tipo_comprobante_id} = '01' THEN 'factura'
            WHEN ${schema.pre_ventas.tipo_comprobante_id} = '03' THEN 'boleta'
            ELSE 'vale'
          END`,
          alias: schema.pre_ventas.alias,
          placa: schema.pre_ventas.alias,
          moneda: schema.pre_ventas.moneda,
          fecha_emision: fechaEfectivaExpr,
          gravadas: sql`ROUND(CAST(${schema.pre_ventas.gravadas} AS numeric) / ${factorPrecio}, 2)`,
          igv: sql`ROUND(CAST(${schema.pre_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
          total: sql`ROUND(CAST(${schema.pre_ventas.total_venta} AS numeric) / ${factorPrecio}, 2)`,
          estado: schema.pre_ventas.estado,
          created_at: schema.pre_ventas.created_at
        })
        .from(schema.pre_ventas)
        .leftJoin(schema.clientes, eq(schema.pre_ventas.cliente_id, schema.clientes.id))
        .leftJoin(schema.usuarios, eq(schema.pre_ventas.usuario_id, schema.usuarios.id))
        .where(eq(schema.pre_ventas.id, id))

      if (!preventa) {
        return reply.code(404).send({ success: false, message: 'Preventa no encontrada' })
      }

      // Obtener detalle de ítems
      const rawItems = await db
        .select({
          id: schema.detalle_pre_ventas.id,
          preventa_id: schema.detalle_pre_ventas.preventa_id,
          producto_id: schema.detalle_pre_ventas.producto_id,
          producto_nombre: schema.productos.nombre,
          unidad_medida_id: schema.productos.unidad_medida_id,
          nombre_completo: schema.presentaciones.nombre,
          presentacion_id: schema.detalle_pre_ventas.presentacion_id,
          cantidad: schema.detalle_pre_ventas.cantidad,
          precio_unitario: sql`ROUND(CAST(${schema.detalle_pre_ventas.precio_unitario} AS numeric) / ${factorPrecio}, 2)`,
          subtotal: sql`ROUND(CAST(${schema.detalle_pre_ventas.subtotal} AS numeric) / ${factorPrecio}, 2)`,
          igv: sql`ROUND(CAST(${schema.detalle_pre_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
          total: sql`ROUND(CAST(${schema.detalle_pre_ventas.total} AS numeric) / ${factorPrecio}, 2)`
        })
        .from(schema.detalle_pre_ventas)
        .leftJoin(schema.productos, eq(schema.detalle_pre_ventas.producto_id, schema.productos.id))
        .leftJoin(schema.presentaciones, eq(schema.detalle_pre_ventas.presentacion_id, schema.presentaciones.id))
        .where(eq(schema.detalle_pre_ventas.preventa_id, id))

      const items = rawItems.map((it) => ({
        ...it,
        cantidad: toVolumenVisual(it.cantidad, factorVolumen),
        cantidad_raw: Number(it.cantidad || 0)
      }))

      return reply.code(200).send({
        success: true,
        data: {
          ...preventa,
          items,
          detalles: items
        }
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ success: false, message: 'Error al consultar detalle de preventa: ' + error.message })
    }
  })

  // 3. POST /api/preventas - Crear nueva preventa transaccional
  fastify.post('/', auth, async (request, reply) => {
    try {
      const {
        cliente_id,
        tipo_documento, // 'factura', 'boleta', 'vale'
        placa,
        alias,
        items = [],
        gravado = 0,
        exonerado = 0,
        inafecto = 0,
        gratuito = 0,
        icbper = 0,
        igv = 0,
        total = 0
      } = request.body

      if (!items || items.length === 0) {
        return reply.code(400).send({ success: false, message: 'La preventa debe contener al menos un producto' })
      }

      const branchId = request.user?.branch_id
      const usuarioId = request.user?.id

      if (!branchId) {
        return reply.code(400).send({ success: false, message: 'El usuario no tiene una sucursal activa' })
      }

      // Obtener turno activo si existe
      const [turnoActivo] = await db
        .select({ id: schema.caja_turnos.id })
        .from(schema.caja_turnos)
        .where(and(eq(schema.caja_turnos.branch_id, branchId), eq(schema.caja_turnos.estado, 'ABIERTA')))
        .limit(1)

      const tipoComprobanteId =
        tipo_documento === 'factura' ? '01' : tipo_documento === 'boleta' ? '03' : 'VL'

      const isUUID = (str) =>
        Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      const { factorPrecio, factorVolumen } = await getFactores()

      // Iniciar Transacción
      const result = await db.transaction(async (tx) => {
        // Pre-cargar tipo_tributo de BD para productos si no vienen explícitos
        const prodIds = items.map((i) => i.producto_id).filter(isUUID)
        let prodsMap = {}
        if (prodIds.length > 0) {
          const prodsDb = await tx
            .select({
              id: schema.productos.id,
              tipo_tributo: schema.productos.tipo_tributo
            })
            .from(schema.productos)
            .where(inArray(schema.productos.id, prodIds))
          prodsDb.forEach((p) => {
            prodsMap[p.id] = p.tipo_tributo
          })
        }

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

          const afectacionRaw = String(item.tipo_afectacion_igv || prodsMap[item.producto_id] || '10').trim()
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
          // Si no tiene presentacion_id, buscar la presentación predeterminada del producto
          let presId = item.presentacion_id
          if (!presId && item.producto_id) {
            const [pres] = await tx
              .select({ id: schema.presentaciones.id })
              .from(schema.presentaciones)
              .where(eq(schema.presentaciones.producto_uuid, item.producto_id))
              .limit(1)
            presId = pres?.id || null
          }

          // Si el producto no tiene presentación creada, crear con precio multiplicado por factorPrecio
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

          await tx.insert(schema.detalle_pre_ventas).values({
            preventa_id: nuevaPreventa.id,
            producto_id: item.producto_id,
            presentacion_id: presId,
            cantidad: cantInt,
            precio_unitario: precioInt,
            subtotal: itemSubtotalInt,
            igv: itemIgvInt,
            total: itemTotalInt
          })
        }

        return nuevaPreventa
      })

      return reply.code(201).send({
        success: true,
        message: 'Pre-venta registrada exitosamente',
        data: {
          id: result.id,
          codigo: `PRE-${String(result.id).slice(0, 8)}`,
          ...result
        }
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ success: false, message: 'Error al registrar pre-venta: ' + error.message })
    }
  })

  // 4. PUT /api/preventas/:id - Actualizar preventa existente (Edición)
  fastify.put('/:id', auth, async (request, reply) => {
    try {
      const { id } = request.params
      const {
        cliente_id,
        tipo_documento,
        placa,
        alias,
        items = [],
        gravado = 0,
        exonerado = 0,
        inafecto = 0,
        gratuito = 0,
        icbper = 0,
        igv = 0,
        total = 0
      } = request.body || {}

      const [existente] = await db
        .select()
        .from(schema.pre_ventas)
        .where(eq(schema.pre_ventas.id, id))

      if (!existente) {
        return reply.code(404).send({ success: false, message: 'Preventa no encontrada para actualizar' })
      }

      if (existente.estado === 'PROCESADA') {
        return reply.code(400).send({ success: false, message: 'No se puede editar una preventa que ya fue PROCESADA' })
      }

      const tipoComprobanteId =
        tipo_documento === 'factura' ? '01' : tipo_documento === 'boleta' ? '03' : tipo_documento === 'vale' ? 'VL' : (existente.tipo_comprobante_id || 'VL')

      const isUUID = (str) =>
        Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      const { factorPrecio, factorVolumen } = await getFactores()

      await db.transaction(async (tx) => {
        // Pre-cargar tipo_tributo de BD para productos si no vienen explícitos
        const prodIds = items.map((i) => i.producto_id || i.id).filter(isUUID)
        let prodsMap = {}
        if (prodIds.length > 0) {
          const prodsDb = await tx
            .select({
              id: schema.productos.id,
              tipo_tributo: schema.productos.tipo_tributo
            })
            .from(schema.productos)
            .where(inArray(schema.productos.id, prodIds))
          prodsDb.forEach((p) => {
            prodsMap[p.id] = p.tipo_tributo
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

          const afectacionRaw = String(item.tipo_afectacion_igv || prodsMap[prodId] || '10').trim()
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
          await tx.delete(schema.detalle_pre_ventas).where(eq(schema.detalle_pre_ventas.preventa_id, id))

          for (const item of itemsProcesados) {
            const prodId = item.prodId
            if (!prodId || !isUUID(prodId)) {
              request.log.warn({ item }, '[PUT /preventas/:id] Saltando ítem sin producto_id válido')
              continue
            }

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

            await tx.insert(schema.detalle_pre_ventas).values({
              preventa_id: id,
              producto_id: prodId,
              presentacion_id: presId,
              cantidad: cantInt,
              precio_unitario: precioInt,
              subtotal: itemSubtotalInt,
              igv: itemIgvInt,
              total: itemTotalInt
            })
          }
        }
      })

      return reply.code(200).send({
        success: true,
        message: 'Pre-venta actualizada correctamente',
        data: { id }
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'Error al actualizar pre-venta: ' + (error.message || 'Error interno del servidor')
      })
    }
  })

  // 5. DELETE /api/preventas/:id - Anulación lógica de preventa
  fastify.delete('/:id', auth, async (request, reply) => {
    try {
      const { id } = request.params
      const branchId = request.user?.branch_id

      // 1. Obtener la preventa para verificar su existencia y estado
      const conditions = [eq(schema.pre_ventas.id, id)]
      if (!request.user?.es_super_admin && branchId) {
        conditions.push(eq(schema.pre_ventas.branch_id, branchId))
      }

      const [preventa] = await db
        .select()
        .from(schema.pre_ventas)
        .where(and(...conditions))
        .limit(1)

      if (!preventa) {
        return reply.code(404).send({
          success: false,
          message: 'La pre-venta no existe o no pertenece a su sucursal activa'
        })
      }

      const estadoActual = String(preventa.estado || '').toUpperCase()

      // RN-07: No se puede eliminar una preventa PROCESADA o CANCELADA / ANULADA
      if (estadoActual === 'PROCESADA') {
        return reply.code(400).send({
          success: false,
          message: 'No se puede anular una pre-venta que ya ha sido procesada/cobrada'
        })
      }

      if (estadoActual === 'ANULADO' || estadoActual === 'CANCELADA') {
        return reply.code(400).send({
          success: false,
          message: 'La pre-venta ya se encuentra anulada'
        })
      }

      // Borrado lógico (cambio de estado a ANULADO)
      await db
        .update(schema.pre_ventas)
        .set({
          estado: 'ANULADO',
          updated_at: sql`NOW()`
        })
        .where(eq(schema.pre_ventas.id, id))

      return reply.code(200).send({
        success: true,
        message: 'Pre-venta anulada correctamente',
        data: { id, estado: 'ANULADO' }
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'Error al anular la pre-venta: ' + error.message
      })
    }
  })
}

module.exports = preventasRoutes
