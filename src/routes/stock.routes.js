'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, inArray, sql } = require('drizzle-orm')
const {
  getFactores,
  toVolumenInt,
  normalizeVolumenInt,
  toVolumenVisual,
  calcularStockPresentacion
} = require('../utils/factores')

/**
 * Rutas para el Módulo de Control de Stock Actual y Kárdex Histórico
 * Prefijo: /api/stock
 * Seguridad: Protegido por fastify.authorize (RBAC: stock.ver, stock.crear, stock.editar, kardexprod.ver) y RLS por empresa_id / branch_id
 */
async function stockRoutes(fastify) {
  // Hook global de autorización RBAC + inyección de active_acceso (empresa_id, branch_id, rol_nivel)
  fastify.addHook('preHandler', fastify.authorize)

  // ── 1. GET /api/stock ───────────────────────────────────────────────────────────
  // Lista los productos con sus presentaciones y su saldo en stock_actual para la sucursal activa
  fastify.get(
    '/',
    {
      config: {
        permission: ['stock.ver', 'kardexprod.ver']
      }
    },
    async (request, reply) => {
    try {
      const { almacen_id, categoria_id, estado_stock, q } = request.query
      const empresaId = request.user?.empresa_id
      const branchId = request.user?.branch_id

      // 1. Obtener almacenes activos de la sucursal (RLS)
      const almacenConds = [eq(schema.almacenes.activo, true)]
      if (!request.user?.es_super_admin && branchId) {
        almacenConds.push(eq(schema.almacenes.branch_id, branchId))
      }
      const almacenesRows = await db
        .select()
        .from(schema.almacenes)
        .where(and(...almacenConds))
        .orderBy(desc(schema.almacenes.es_principal))

      const almacenPrincipal = almacenesRows[0] || null
      const almacenFiltroId = almacen_id || null

      // 2. Obtener productos activos de la empresa (RLS)
      const prodConds = [eq(schema.productos.activo, true)]
      if (!request.user?.es_super_admin && empresaId) {
        prodConds.push(
          or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`)
        )
      }
      if (categoria_id) {
        prodConds.push(eq(schema.productos.categoria, categoria_id))
      }
      if (q && q.trim() !== '') {
        const search = `%${q.trim()}%`
        prodConds.push(
          or(
            ilike(schema.productos.nombre, search),
            ilike(schema.productos.codigo, search),
            ilike(schema.productos.codigo_barra, search),
            ilike(schema.productos.palabra_clave, search)
          )
        )
      }

      const productosRows = await db
        .select({
          id: schema.productos.id,
          codigo: schema.productos.codigo,
          nombre: schema.productos.nombre,
          descripcion: schema.productos.descripcion,
          codigo_barra: schema.productos.codigo_barra,
          unidad_medida_id: schema.productos.unidad_medida_id,
          stock_minimo: schema.productos.stock_minimo,
          es_facturable: schema.productos.es_facturable,
          categoria_id: schema.productos.categoria,
          categoria_nombre: schema.categorias.nombre,
          sub_categoria_nombre: schema.subcategoria.Nombre,
          empresa_id: schema.productos.empresa_id
        })
        .from(schema.productos)
        .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))
        .leftJoin(schema.subcategoria, eq(schema.productos.sub_categoria, schema.subcategoria.id))
        .where(and(...prodConds))
        .orderBy(desc(schema.productos.created_at))

      const { factorPrecio, factorVolumen } = await getFactores()
      const prodIds = productosRows.map((p) => p.id)

      let presentacionesRows = []
      let stockActualRows = []

      if (prodIds.length > 0) {
        presentacionesRows = await db
          .select()
          .from(schema.presentaciones)
          .where(inArray(schema.presentaciones.producto_uuid, prodIds))

        const stockConds = [inArray(schema.stock_actual.producto_id, prodIds)]
        if (!request.user?.es_super_admin && branchId) {
          stockConds.push(eq(schema.stock_actual.branch_id, branchId))
        }
        if (almacenFiltroId) {
          stockConds.push(eq(schema.stock_actual.almacen_id, almacenFiltroId))
        }

        stockActualRows = await db
          .select({
            id: schema.stock_actual.id,
            branch_id: schema.stock_actual.branch_id,
            almacen_id: schema.stock_actual.almacen_id,
            almacen_nombre: schema.almacenes.nombre,
            producto_id: schema.stock_actual.producto_id,
            presentacion_id: schema.stock_actual.presentacion_id,
            lotes_id: schema.stock_actual.lotes_id,
            saldo_actual: schema.stock_actual.saldo_actual,
            updated_at: schema.stock_actual.updated_at
          })
          .from(schema.stock_actual)
          .leftJoin(schema.almacenes, eq(schema.stock_actual.almacen_id, schema.almacenes.id))
          .where(and(...stockConds))
      }

      // Agrupar presentaciones por producto
      const presPorProducto = {}
      presentacionesRows.forEach((pres) => {
        if (!presPorProducto[pres.producto_uuid]) presPorProducto[pres.producto_uuid] = []
        presPorProducto[pres.producto_uuid].push(pres)
      })

      // Indexar stock_actual por clave compuesta `${producto_id}_${presentacion_id}` (convertido por factorVolumen)
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

      // Construir filas de productos con sus presentaciones desde stock_actual
      const items = []
      productosRows.forEach((prod) => {
        const listaPres = presPorProducto[prod.id] || []
        const stockTotalProducto = Number(stockProdTotalMap[prod.id] || 0)

        if (listaPres.length > 0) {
          listaPres.forEach((pres) => {
            const key = `${prod.id}_${pres.id}`
            const stockInfo = stockMap[key]
            const multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
            // El stock de cada presentación se calcula a partir del stock base total del producto y su multiplica_por
            const saldoActual = calcularStockPresentacion(stockTotalProducto, multiplicaPor)
            const stockMinimo = Number(prod.stock_minimo || 0)

            items.push({
              id: stockInfo?.stock_actual_id || `${prod.id}-${pres.id}`,
              stock_actual_id: stockInfo?.stock_actual_id || null,
              producto_id: prod.id,
              presentacion_id: pres.id,
              codigo: prod.codigo || '-',
              codigo_barra: pres.cod_barra || prod.codigo_barra || '',
              producto_nombre: prod.nombre,
              presentacion_nombre: pres.nombre || 'UNIDAD',
              nombre_completo: `${prod.nombre} - ${pres.nombre || 'UNIDAD'}`,
              categoria_id: prod.categoria_id,
              categoria_nombre: prod.categoria_nombre || 'General',
              sub_categoria_nombre: prod.sub_categoria_nombre || '',
              unidad_medida_id: prod.unidad_medida_id || 'NIU',
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
        if (!estado_stock || estado_stock === 'todos') return true
        if (estado_stock === 'negativo') return item.saldo_actual < 0
        if (estado_stock === 'sin_stock') return item.saldo_actual === 0
        if (estado_stock === 'bajo_minimo') return item.saldo_actual > 0 && item.saldo_actual <= item.stock_minimo
        if (estado_stock === 'positivo') return item.saldo_actual > 0
        return true
      })

      // Calcular resumen general sobre el universo de items
      const resumen = {
        totalItems: items.length,
        conStockPositivo: items.filter((i) => i.saldo_actual > 0).length,
        sinStock: items.filter((i) => i.saldo_actual === 0).length,
        conStockNegativo: items.filter((i) => i.saldo_actual < 0).length,
        bajoStockMinimo: items.filter((i) => i.saldo_actual > 0 && i.saldo_actual <= i.stock_minimo).length
      }

      return reply.code(200).send({
        success: true,
        data: filteredItems,
        almacenes: almacenesRows,
        resumen
      })
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({
        success: false,
        message: 'Error al obtener control de stock: ' + error.message
      })
    }
  })

  // ── 2. GET /api/stock/kardex ────────────────────────────────────────────────────
  // Obtiene el Kárdex histórico (tabla stock) por producto y/o presentación
  fastify.get(
    '/kardex',
    {
      config: {
        // Aceptamos permiso stock.ver o kardexprod.ver
        permission: ['stock.ver', 'kardexprod.ver']
      }
    },
    async (request, reply) => {
      try {
        const {
          producto_id,
          presentacion_id,
          almacen_id,
          tipo_mov,
          fecha_inicio,
          fecha_fin
        } = request.query

        const branchId = request.user?.branch_id

        if (!producto_id) {
          return reply.code(400).send({
            success: false,
            message: 'El parámetro producto_id es obligatorio para consultar el Kárdex.'
          })
        }

        const conditions = [eq(schema.stock.producto_id, producto_id)]

        if (!request.user?.es_super_admin && branchId) {
          conditions.push(eq(schema.stock.branch_id, branchId))
        }

        if (presentacion_id) {
          conditions.push(eq(schema.stock.presentacion_id, presentacion_id))
        }

        if (almacen_id) {
          conditions.push(eq(schema.stock.almacen_id, almacen_id))
        }

        if (tipo_mov && (String(tipo_mov) === '1' || String(tipo_mov) === '2')) {
          conditions.push(eq(schema.stock.tipo_mov, Number(tipo_mov)))
        }

        if (fecha_inicio) {
          conditions.push(sql`DATE(${schema.stock.created_at}) >= ${fecha_inicio}::date`)
        }

        if (fecha_fin) {
          conditions.push(sql`DATE(${schema.stock.created_at}) <= ${fecha_fin}::date`)
        }

        const { factorVolumen } = await getFactores()

        const rawMovimientos = await db
          .select({
            id: schema.stock.id,
            producto_id: schema.stock.producto_id,
            producto_nombre: schema.productos.nombre,
            producto_codigo: schema.productos.codigo,
            presentacion_id: schema.stock.presentacion_id,
            presentacion_nombre: schema.presentaciones.nombre,
            lotes_id: schema.stock.lotes_id,
            cantidad: schema.stock.cantidad,
            multiplica_por: schema.stock.multiplica_por,
            cantidad_base: schema.stock.cantidad_base,
            saldo: schema.stock.saldo,
            documento_id: schema.stock.documento_id,
            documento: schema.stock.documento,
            tipo_mov: schema.stock.tipo_mov,
            concepto: schema.stock.concepto,
            usuario_id: schema.stock.usuario_id,
            usuario_nombre: schema.usuarios.nombre,
            branch_id: schema.stock.branch_id,
            almacen_id: schema.stock.almacen_id,
            almacen_nombre: schema.almacenes.nombre,
            created_at: schema.stock.created_at
          })
          .from(schema.stock)
          .leftJoin(schema.productos, eq(schema.stock.producto_id, schema.productos.id))
          .leftJoin(schema.presentaciones, eq(schema.stock.presentacion_id, schema.presentaciones.id))
          .leftJoin(schema.usuarios, eq(schema.stock.usuario_id, schema.usuarios.id))
          .leftJoin(schema.almacenes, eq(schema.stock.almacen_id, schema.almacenes.id))
          .where(and(...conditions))
          .orderBy(desc(schema.stock.created_at))

        const movimientos = rawMovimientos.map((m) => ({
          ...m,
          cantidad: toVolumenVisual(m.cantidad, factorVolumen),
          cantidad_base: toVolumenVisual(m.cantidad_base, factorVolumen),
          saldo: toVolumenVisual(m.saldo, factorVolumen)
        }))

        // Consultar saldo base total vigente del producto en stock_actual
        const saConds = [eq(schema.stock_actual.producto_id, producto_id)]
        if (!request.user?.es_super_admin && branchId) {
          saConds.push(eq(schema.stock_actual.branch_id, branchId))
        }
        if (almacen_id) {
          saConds.push(eq(schema.stock_actual.almacen_id, almacen_id))
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
        if (presentacion_id) {
          const [presRow] = await db
            .select({ multiplica_por: schema.presentaciones.multiplica_por })
            .from(schema.presentaciones)
            .where(eq(schema.presentaciones.id, presentacion_id))
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

        return reply.code(200).send({
          success: true,
          data: movimientos,
          resumen: {
            totalMovimientos: movimientos.length,
            totalEntradas,
            totalSalidas,
            saldoActual,
            saldoBaseProducto
          }
        })
      } catch (error) {
        request.log.error(error)
        return reply.code(500).send({
          success: false,
          message: 'Error al consultar el Kárdex del producto: ' + error.message
        })
      }
    }
  )

  // ── 3. POST /api/stock/ajuste ───────────────────────────────────────────────────
  // Registra un movimiento manual de stock (1 = Entrada / Regularización, 2 = Salida / Merma)
  fastify.post(
    '/ajuste',
    {
      config: {
        permission: ['stock.crear', 'stock.editar', 'kardexprod.crear', 'kardexprod.editar']
      }
    },
    async (request, reply) => {
      try {
        const {
          producto_id,
          presentacion_id,
          almacen_id,
          tipo_mov, // 1 = Entrada, 2 = Salida
          cantidad,
          documento,
          concepto
        } = request.body || {}

        const branchId = request.user?.branch_id
        const usuarioId = request.user?.id

        if (!branchId) {
          return reply.code(400).send({
            success: false,
            message: 'El usuario no cuenta con una sucursal activa en su sesión.'
          })
        }

        if (!producto_id || !presentacion_id) {
          return reply.code(400).send({
            success: false,
            message: 'Debe especificar producto_id y presentacion_id.'
          })
        }

        const tipoMovNum = Number(tipo_mov) === 2 ? 2 : 1
        const cantVisual = Number(cantidad || 0)
        if (!Number.isFinite(cantVisual) || cantVisual <= 0) {
          return reply.code(400).send({
            success: false,
            message: 'La cantidad del movimiento debe ser mayor a 0.'
          })
        }

        const { factorVolumen } = await getFactores()

        const resultado = await db.transaction(async (tx) => {
          // 1. Resolver almacén de la sucursal
          let targetAlmacenId = almacen_id
          if (!targetAlmacenId) {
            const [alm] = await tx
              .select({ id: schema.almacenes.id })
              .from(schema.almacenes)
              .where(and(eq(schema.almacenes.branch_id, branchId), eq(schema.almacenes.activo, true)))
              .orderBy(desc(schema.almacenes.es_principal))
              .limit(1)

            if (alm) {
              targetAlmacenId = alm.id
            } else {
              const [nuevoAlm] = await tx
                .insert(schema.almacenes)
                .values({
                  branch_id: branchId,
                  nombre: 'ALMACÉN PRINCIPAL',
                  codigo: 'ALM-01',
                  es_principal: true,
                  activo: true
                })
                .returning({ id: schema.almacenes.id })
              targetAlmacenId = nuevoAlm.id
            }
          }

          // 2. Obtener factor multiplica_por de la presentación
          const [pres] = await tx
            .select({ multiplica_por: schema.presentaciones.multiplica_por })
            .from(schema.presentaciones)
            .where(eq(schema.presentaciones.id, presentacion_id))
            .limit(1)

          const multiplicaPor = Math.max(1, Number(pres?.multiplica_por || 1))
          const cantInt = toVolumenInt(cantVisual, factorVolumen)
          const cantidadBaseInt = toVolumenInt(cantVisual * multiplicaPor, factorVolumen)

          // 3. Bloquear filas del producto en stock_actual y calcular saldo base unificado
          const stockProductoRows = await tx
            .select()
            .from(schema.stock_actual)
            .where(
              and(
                eq(schema.stock_actual.branch_id, branchId),
                eq(schema.stock_actual.almacen_id, targetAlmacenId),
                eq(schema.stock_actual.producto_id, producto_id)
              )
            )
            .for('update')

          const saldoBaseAnteriorInt = stockProductoRows.reduce(
            (acc, r) => acc + normalizeVolumenInt(r.saldo_actual, factorVolumen),
            0
          )
          const stockExistente = stockProductoRows.find(
            (r) => r.presentacion_id === presentacion_id
          )

          const deltaInt = tipoMovNum === 1 ? cantidadBaseInt : -cantidadBaseInt
          const nuevoSaldoBaseTotalInt = saldoBaseAnteriorInt + deltaInt

          if (stockExistente) {
            const saldoFilaActualInt = normalizeVolumenInt(stockExistente.saldo_actual, factorVolumen)
            const nuevoSaldoFilaInt = saldoFilaActualInt + deltaInt
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
              almacen_id: targetAlmacenId,
              producto_id: producto_id,
              presentacion_id: presentacion_id,
              lotes_id: null,
              saldo_actual: deltaInt,
              updated_at: sql`NOW()`
            })
          }

          // 4. Insertar registro histórico en tabla stock (Kárdex) con saldo base acumulado del producto
          const docRef = (documento && documento.trim()) || (tipoMovNum === 1 ? 'ING-MANUAL' : 'SAL-MANUAL')
          const conceptoRef =
            (concepto && concepto.trim()) ||
            (tipoMovNum === 1 ? 'INGRESO / REGULARIZACIÓN DE STOCK' : 'SALIDA / AJUSTE DE STOCK')

          const [movimiento] = await tx
            .insert(schema.stock)
            .values({
              producto_id,
              presentacion_id,
              lotes_id: null,
              cantidad: cantInt,
              multiplica_por: multiplicaPor,
              cantidad_base: cantidadBaseInt,
              saldo: nuevoSaldoBaseTotalInt,
              documento_id: null,
              documento: docRef,
              tipo_mov: tipoMovNum,
              concepto: conceptoRef,
              usuario_id: usuarioId,
              branch_id: branchId,
              almacen_id: targetAlmacenId
            })
            .returning()

          return {
            movimiento: {
              ...movimiento,
              cantidad: toVolumenVisual(movimiento.cantidad, factorVolumen),
              cantidad_base: toVolumenVisual(movimiento.cantidad_base, factorVolumen),
              saldo: toVolumenVisual(movimiento.saldo, factorVolumen)
            },
            saldo_actual: toVolumenVisual(nuevoSaldoBaseTotalInt, factorVolumen)
          }
        })

        return reply.code(201).send({
          success: true,
          message:
            tipoMovNum === 1
              ? 'Entrada de stock registrada correctamente'
              : 'Salida de stock registrada correctamente',
          data: resultado
        })
      } catch (error) {
        request.log.error(error)
        return reply.code(500).send({
          success: false,
          message: 'Error al registrar movimiento de stock: ' + error.message
        })
      }
    }
  )
}

module.exports = stockRoutes
