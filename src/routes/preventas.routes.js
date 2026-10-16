'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')
const { getFactores, toPrecioInt } = require('../utils/factores')

/**
 * Rutas para Pre-Ventas (pedidos / reservas antes del pago)
 * Prefijo: /api/preventas
 */
async function preventasRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

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

      if (estado) {
        conditions.push(eq(schema.pre_ventas.estado, estado))
      }

      if (fecha_inicio) {
        conditions.push(sql`DATE(${schema.pre_ventas.fecha_emision}) >= ${fecha_inicio}::date`)
      }

      if (fecha_fin) {
        conditions.push(sql`DATE(${schema.pre_ventas.fecha_emision}) <= ${fecha_fin}::date`)
      }

      if (q && q.trim()) {
        const queryTerm = `%${q.trim()}%`
        conditions.push(
          or(
            ilike(schema.clientes.nombre_razon_social, queryTerm),
            ilike(schema.clientes.numero_documento, queryTerm),
            sql`CAST(${schema.pre_ventas.id} AS text) ILIKE ${queryTerm}`
          )
        )
      }

      const { factorPrecio } = await getFactores()

      const preventas = await db
        .select({
          id: schema.pre_ventas.id,
          codigo: sql`CONCAT('PRE-', SUBSTRING(CAST(${schema.pre_ventas.id} AS text), 1, 8))`,
          branch_id: schema.pre_ventas.branch_id,
          caja_turno_id: schema.pre_ventas.caja_turno_id,
          usuario_id: schema.pre_ventas.usuario_id,
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
          moneda: schema.pre_ventas.moneda,
          fecha_emision: schema.pre_ventas.fecha_emision,
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
      const { factorPrecio } = await getFactores()

      const [preventa] = await db
        .select({
          id: schema.pre_ventas.id,
          codigo: sql`CONCAT('PRE-', SUBSTRING(CAST(${schema.pre_ventas.id} AS text), 1, 8))`,
          branch_id: schema.pre_ventas.branch_id,
          caja_turno_id: schema.pre_ventas.caja_turno_id,
          usuario_id: schema.pre_ventas.usuario_id,
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
          moneda: schema.pre_ventas.moneda,
          fecha_emision: schema.pre_ventas.fecha_emision,
          gravadas: sql`ROUND(CAST(${schema.pre_ventas.gravadas} AS numeric) / ${factorPrecio}, 2)`,
          igv: sql`ROUND(CAST(${schema.pre_ventas.igv} AS numeric) / ${factorPrecio}, 2)`,
          total: sql`ROUND(CAST(${schema.pre_ventas.total_venta} AS numeric) / ${factorPrecio}, 2)`,
          estado: schema.pre_ventas.estado,
          created_at: schema.pre_ventas.created_at
        })
        .from(schema.pre_ventas)
        .leftJoin(schema.clientes, eq(schema.pre_ventas.cliente_id, schema.clientes.id))
        .where(eq(schema.pre_ventas.id, id))

      if (!preventa) {
        return reply.code(404).send({ success: false, message: 'Preventa no encontrada' })
      }

      // Obtener detalle de ítems
      const items = await db
        .select({
          id: schema.detalle_pre_ventas.id,
          preventa_id: schema.detalle_pre_ventas.preventa_id,
          producto_id: schema.detalle_pre_ventas.producto_id,
          producto_nombre: schema.productos.nombre,
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
        items = [],
        gravado = 0,
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
        tipo_documento === 'factura' ? '01' : tipo_documento === 'boleta' ? '03' : '00'

      const isUUID = (str) =>
        Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      const { factorPrecio } = await getFactores()

      // Convertir a enteros para almacenamiento en campos bigint
      const totalVisual = Number(total || 0)
      const gravadoVisual = Number(gravado || (totalVisual / 1.18).toFixed(2))
      const igvVisual = Number(igv || (totalVisual - gravadoVisual).toFixed(2))

      const gravadasInt = Math.round(gravadoVisual * factorPrecio)
      const igvInt = Math.round(igvVisual * factorPrecio)
      const totalVentaInt = Math.round(totalVisual * factorPrecio)

      // Iniciar Transacción
      const result = await db.transaction(async (tx) => {
        // A. Insertar cabecera pre_ventas
        const [nuevaPreventa] = await tx
          .insert(schema.pre_ventas)
          .values({
            branch_id: branchId,
            caja_turno_id: turnoActivo?.id || null,
            usuario_id: usuarioId,
            cliente_id: isUUID(cliente_id) ? cliente_id : null,
            tipo_comprobante_id: tipoComprobanteId,
            alias: placa || null,
            moneda: 'PEN',
            tipo_cambio: 1,
            gravadas: gravadasInt,
            igv: igvInt,
            total_venta: totalVentaInt,
            estado: 'PENDIENTE',
            fecha_emision: new Date().toISOString()
          })
          .returning()

        // B. Insertar detalle_pre_ventas
        for (const item of items) {
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
                precio_venta: Math.round(Number(item.precio_unitario || 0) * factorPrecio)
              })
              .returning()
            presId = nuevaPres.id
          }

          const cant = Math.round(Number(item.cantidad || 1))
          const precioVisual = Number(item.precio_unitario || item.precio || 0)
          const precioInt = Math.round(precioVisual * factorPrecio)
          const itemTotalVisual = Number((cant * precioVisual).toFixed(2))
          const itemSubtotalVisual = Number((itemTotalVisual / 1.18).toFixed(2))
          const itemIgvVisual = Number((itemTotalVisual - itemSubtotalVisual).toFixed(2))

          const itemTotalInt = Math.round(itemTotalVisual * factorPrecio)
          const itemSubtotalInt = Math.round(itemSubtotalVisual * factorPrecio)
          const itemIgvInt = Math.round(itemIgvVisual * factorPrecio)

          await tx.insert(schema.detalle_pre_ventas).values({
            preventa_id: nuevaPreventa.id,
            producto_id: item.producto_id,
            presentacion_id: presId,
            cantidad: cant,
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
        items = [],
        gravado = 0,
        igv = 0,
        total = 0
      } = request.body

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
        tipo_documento === 'factura' ? '01' : tipo_documento === 'boleta' ? '03' : '00'

      const isUUID = (str) =>
        Boolean(str && typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      const { factorPrecio } = await getFactores()

      const totalVisual = Number(total || 0)
      const gravadoVisual = Number(gravado || (totalVisual / 1.18).toFixed(2))
      const igvVisual = Number(igv || (totalVisual - gravadoVisual).toFixed(2))

      const gravadasInt = Math.round(gravadoVisual * factorPrecio)
      const igvInt = Math.round(igvVisual * factorPrecio)
      const totalVentaInt = Math.round(totalVisual * factorPrecio)

      await db.transaction(async (tx) => {
        // A. Actualizar cabecera
        await tx
          .update(schema.pre_ventas)
          .set({
            cliente_id: isUUID(cliente_id) ? cliente_id : existente.cliente_id,
            tipo_comprobante_id: tipoComprobanteId,
            alias: placa !== undefined ? placa : existente.alias,
            gravadas: gravadasInt,
            igv: igvInt,
            total_venta: totalVentaInt,
            updated_at: new Date().toISOString()
          })
          .where(eq(schema.pre_ventas.id, id))

        // B. Reemplazar detalle si vienen ítems
        if (items && items.length > 0) {
          await tx.delete(schema.detalle_pre_ventas).where(eq(schema.detalle_pre_ventas.preventa_id, id))

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
                  nombre: item.nombre_completo || 'UNIDAD',
                  precio_venta: Math.round(Number(item.precio_unitario || 0) * factorPrecio)
                })
                .returning()
              presId = nuevaPres.id
            }

            const cant = Math.round(Number(item.cantidad || 1))
            const precioVisual = Number(item.precio_unitario || item.precio || 0)
            const precioInt = Math.round(precioVisual * factorPrecio)
            const itemTotalVisual = Number((cant * precioVisual).toFixed(2))
            const itemSubtotalVisual = Number((itemTotalVisual / 1.18).toFixed(2))
            const itemIgvVisual = Number((itemTotalVisual - itemSubtotalVisual).toFixed(2))

            const itemTotalInt = Math.round(itemTotalVisual * factorPrecio)
            const itemSubtotalInt = Math.round(itemSubtotalVisual * factorPrecio)
            const itemIgvInt = Math.round(itemIgvVisual * factorPrecio)

            await tx.insert(schema.detalle_pre_ventas).values({
              preventa_id: id,
              producto_id: item.producto_id,
              presentacion_id: presId,
              cantidad: cant,
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
      return reply.code(500).send({ success: false, message: 'Error al actualizar pre-venta: ' + error.message })
    }
  })
}

module.exports = preventasRoutes
