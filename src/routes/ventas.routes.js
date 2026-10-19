'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')
const { getFactores, toPrecioInt } = require('../utils/factores')

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
        const tipoId = tipo_documento === 'factura' ? '01' : tipo_documento === 'boleta' ? '03' : '00'
        conditions.push(eq(schema.ventas.tipo_comprobante_id, tipoId))
      }

      if (fecha_inicio) {
        conditions.push(sql`DATE(${schema.ventas.fecha_emision}) >= ${fecha_inicio}::date`)
      }

      if (fecha_fin) {
        conditions.push(sql`DATE(${schema.ventas.fecha_emision}) <= ${fecha_fin}::date`)
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
          fecha_emision: schema.ventas.fecha_emision,
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
      const { factorPrecio } = await getFactores()

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
          fecha_emision: schema.ventas.fecha_emision,
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
      const items = await db
        .select({
          id: schema.detalle_ventas.id,
          producto_id: schema.detalle_ventas.producto_id,
          producto_nombre: schema.productos.nombre,
          presentacion_id: schema.detalle_ventas.presentacion_id,
          cantidad: schema.detalle_ventas.cantidad,
          precio_unitario: sql`ROUND(CAST(${schema.detalle_ventas.precio_unitario} AS numeric) / ${factorPrecio}, 2)`,
          subtotal: sql`ROUND(CAST(${schema.detalle_ventas.subtotal} AS numeric) / ${factorPrecio}, 2)`,
          igv: sql`ROUND(CAST(${schema.detalle_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
          total: sql`ROUND(CAST(${schema.detalle_ventas.total} AS numeric) / ${factorPrecio}, 2)`
        })
        .from(schema.detalle_ventas)
        .leftJoin(schema.productos, eq(schema.detalle_ventas.producto_id, schema.productos.id))
        .where(eq(schema.detalle_ventas.venta_id, id))

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

      const tipoDocNormalized = String(tipo_documento || 'boleta').toLowerCase()
      const tipoComprobanteId =
        tipoDocNormalized === 'factura' ? '01' : tipoDocNormalized === 'boleta' ? '03' : '00'

      // Iniciar Transacción Atómica
      const ventaRegistrada = await db.transaction(async (tx) => {
        // A. Asignar Serie y Correlativo atómico
        let serieAsignada = 'T001'
        let correlativoAsignado = 1

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

        if (serieConfig) {
          serieAsignada = serieConfig.serie
          correlativoAsignado = (serieConfig.correlativo || 0) + 1

          // Incrementar correlativo
          await tx
            .update(schema.caja_serie_correlativo)
            .set({
              correlativo: correlativoAsignado,
              updated_at: new Date().toISOString()
            })
            .where(eq(schema.caja_serie_correlativo.id, serieConfig.id))
        } else {
          // Si no hay serie configurada, generar serie default por tipo
          serieAsignada = tipoComprobanteId === '01' ? 'F001' : tipoComprobanteId === '03' ? 'B001' : 'V001'
          const [ultimaVenta] = await tx
            .select({ corr: schema.ventas.correlativo })
            .from(schema.ventas)
            .where(and(eq(schema.ventas.branch_id, branchId), eq(schema.ventas.serie, serieAsignada)))
            .orderBy(desc(schema.ventas.correlativo))
            .limit(1)
          correlativoAsignado = (ultimaVenta?.corr || 0) + 1
        }

        const { factorPrecio } = await getFactores()

        const totalVisual = Number(total || 0)
        const gravadoVisual = Number((totalVisual / 1.18).toFixed(2))
        const igvVisual = Number((totalVisual - gravadoVisual).toFixed(2))

        const gravadasInt = Math.round(gravadoVisual * factorPrecio)
        const igvInt = Math.round(igvVisual * factorPrecio)
        const totalVentaInt = Math.round(totalVisual * factorPrecio)

        // Determinar si es facturable ante SUNAT
        const esFacturableSunat = tipoComprobanteId === '01' || tipoComprobanteId === '03'
        const isUUID = (str) =>
          Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

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
            igv: igvInt,
            total_venta: totalVentaInt,
            observacion_venta: observaciones || null,
            estado: 'EMITIDO',
            estado_pago: 'PAGADO',
            facturado: false, // Se actualiza posteriormente con el módulo de facturación electrónica
            fecha_emision: new Date().toISOString()
          })
          .returning()

        // C. Insertar detalle de venta
        for (const item of items) {
          let presId = item.presentacion_id
          if (!presId && item.producto_id) {
            const [pres] = await tx
              .select({ id: schema.presentaciones.id })
              .from(schema.presentaciones)
              .where(eq(schema.presentaciones.producto_uuid, item.producto_id))
              .limit(1)
            presId = pres?.id || null
          }

          if (!presId) {
            const [nuevaPres] = await tx
              .insert(schema.presentaciones)
              .values({
                producto_uuid: item.producto_id,
                nombre: item.nombre || item.nombre_completo || 'UNIDAD',
                precio_venta: Math.round(Number(item.precio_unitario || 0) * factorPrecio)
              })
              .returning()
            presId = nuevaPres.id
          }

          const cant = Math.round(Number(item.cantidad || 1))
          const precioVisual = Number(item.precio_unitario || 0)
          const precioInt = Math.round(precioVisual * factorPrecio)
          const itemTotalVisual = Number((cant * precioVisual).toFixed(2))
          const itemSubtotalVisual = Number((itemTotalVisual / 1.18).toFixed(2))
          const itemIgvVisual = Number((itemTotalVisual - itemSubtotalVisual).toFixed(2))

          const itemTotalInt = Math.round(itemTotalVisual * factorPrecio)
          const itemSubtotalInt = Math.round(itemSubtotalVisual * factorPrecio)
          const itemIgvInt = Math.round(itemIgvVisual * factorPrecio)

          await tx.insert(schema.detalle_ventas).values({
            venta_id: nuevaVenta.id,
            producto_id: item.producto_id,
            presentacion_id: presId,
            cantidad: cant,
            precio_unitario: precioInt,
            subtotal: itemSubtotalInt,
            igv: itemIgvInt,
            total: itemTotalInt
          })

          // D. Descontar Stock si existe almacén asignado a la sucursal
          const [almacen] = await tx
            .select({ id: schema.almacenes.id })
            .from(schema.almacenes)
            .where(eq(schema.almacenes.branch_id, branchId))
            .limit(1)

          if (almacen && item.producto_id && presId) {
            const [stockExistente] = await tx
              .select()
              .from(schema.stock_actual)
              .where(
                and(
                  eq(schema.stock_actual.branch_id, branchId),
                  eq(schema.stock_actual.almacen_id, almacen.id),
                  eq(schema.stock_actual.producto_id, item.producto_id),
                  eq(schema.stock_actual.presentacion_id, presId)
                )
              )
              .limit(1)

            if (stockExistente) {
              const nuevoSaldo = Math.max(0, Number(stockExistente.saldo_actual || 0) - cant)
              await tx
                .update(schema.stock_actual)
                .set({
                  saldo_actual: nuevoSaldo,
                  updated_at: new Date().toISOString()
                })
                .where(eq(schema.stock_actual.id, stockExistente.id))
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
            fecha_pago: new Date().toISOString()
          })
        }

        // F. Actualizar preventa a 'PROCESADA' si venía de preventa
        if (preventa_id) {
          await tx
            .update(schema.pre_ventas)
            .set({
              estado: 'PROCESADA',
              updated_at: new Date().toISOString()
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

      await db
        .update(schema.ventas)
        .set({
          estado: 'ANULADO',
          observacion_venta: motivo ? `ANULADO: ${motivo}` : 'ANULADO',
          updated_at: new Date().toISOString()
        })
        .where(eq(schema.ventas.id, id))

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
