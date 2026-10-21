'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')
const {
  getFactores,
  toPrecioInt,
  toPrecioVisual,
  toVolumenVisual,
  calcularStockPresentacion
} = require('../utils/factores')

/**
 * Rutas CRUD de Productos con Drizzle ORM
 * 
 * Gestiona el catálogo de productos y su desglose de presentaciones/precios
 * aplicando factores de conversión (PRECIO x100 en céntimos, VOLUMEN x1000000)
 * bajo Row-Level Security (RLS) por empresa activa (`empresa_id`).
 */
async function productosRoutes(fastify) {
  // Verificación de autenticación y autorización RBAC automática (productos.ver, etc.)
  fastify.addHook('preHandler', fastify.authorize)

  // ── GET /api/productos ──────────────────────────────────────────────────────────
  fastify.get('/', async (request, reply) => {
    const { q, categoria_id, activo } = request.query
    const empresaId = request.user?.empresa_id || request.user?.branch_id

    const conditions = []

    // RLS por empresa si el usuario no es superadmin
    if (!request.user.es_super_admin && empresaId) {
      conditions.push(or(eq(schema.productos.empresa_id, empresaId), sql`${schema.productos.empresa_id} IS NULL`))
    }

    if (activo !== undefined) {
      conditions.push(eq(schema.productos.activo, activo === 'true' || activo === true))
    }

    if (categoria_id) {
      conditions.push(eq(schema.productos.categoria, categoria_id))
    }

    if (q && q.trim() !== '') {
      const search = `%${q.trim()}%`
      conditions.push(
        or(
          ilike(schema.productos.nombre, search),
          ilike(schema.productos.codigo, search),
          ilike(schema.productos.codigo_barra, search),
          ilike(schema.productos.palabra_clave, search)
        )
      )
    }

    let query = db
      .select({
        id: schema.productos.id,
        codigo: schema.productos.codigo,
        nombre: schema.productos.nombre,
        descripcion: schema.productos.descripcion,
        codigo_barra: schema.productos.codigo_barra,
        palabra_clave: schema.productos.palabra_clave,
        codigo_sunat: schema.productos.codigo_sunat,
        unidad_medida_id: schema.productos.unidad_medida_id,
        es_facturable: schema.productos.es_facturable,
        es_vendible: schema.productos.es_vendible,
        es_insumo: schema.productos.es_insumo,
        es_producido: schema.productos.es_producido,
        es_combo: schema.productos.es_combo,
        activo: schema.productos.activo,
        stock_minimo: schema.productos.stock_minimo,
        categoria_id: schema.productos.categoria,
        sub_categoria_id: schema.productos.sub_categoria,
        tipo_existencia_id: schema.productos.tipo_existencia,
        tipo_tributo_id: schema.productos.tipo_tributo,
        empresa_id: schema.productos.empresa_id,
        created_at: schema.productos.created_at,
        updated_at: schema.productos.updated_at,
        // Datos de Categoría
        categoria_nombre: schema.categorias.nombre,
        // Datos de Subcategoría
        sub_categoria_nombre: schema.subcategoria.Nombre,
        // Unidad de medida producto
        unidad_medida_descripcion: schema.tipo_unidades_medida.descripcion
      })
      .from(schema.productos)
      .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))
      .leftJoin(schema.subcategoria, eq(schema.productos.sub_categoria, schema.subcategoria.id))
      .leftJoin(schema.tipo_unidades_medida, eq(schema.productos.unidad_medida_id, schema.tipo_unidades_medida.codigo))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const productosRows = await query.orderBy(desc(schema.productos.created_at))

    const { factorPrecio, factorVolumen } = await getFactores()

    // Cargar catálogo de unidades de medida para enriquecer presentaciones
    const unidadesMedidaRows = await db
      .select({
        codigo: schema.tipo_unidades_medida.codigo,
        descripcion: schema.tipo_unidades_medida.descripcion
      })
      .from(schema.tipo_unidades_medida)
    const unidadesMap = {}
    unidadesMedidaRows.forEach(u => {
      if (u.codigo) unidadesMap[u.codigo] = u.descripcion
    })

    // Cargar presentaciones y stock_actual asociados a los productos obtenidos
    const prodIds = productosRows.map(p => p.id)
    const branchId = request.user?.branch_id
    let presentacionesRows = []
    let stockActualRows = []
    if (prodIds.length > 0) {
      const { inArray } = require('drizzle-orm')
      presentacionesRows = await db
        .select()
        .from(schema.presentaciones)
        .where(inArray(schema.presentaciones.producto_uuid, prodIds))

      const stockConds = [inArray(schema.stock_actual.producto_id, prodIds)]
      if (branchId) {
        stockConds.push(eq(schema.stock_actual.branch_id, branchId))
      }
      stockActualRows = await db
        .select()
        .from(schema.stock_actual)
        .where(and(...stockConds))
    }

    // Mapear stock_actual por presentación y acumulado por producto (convertido por factorVolumen, soporta decimales y negativos)
    const stockPorPres = {}
    const stockPorProd = {}
    stockActualRows.forEach(s => {
      const saldo = toVolumenVisual(s.saldo_actual, factorVolumen)
      if (s.presentacion_id) {
        stockPorPres[s.presentacion_id] = Number(((stockPorPres[s.presentacion_id] || 0) + saldo).toFixed(4))
      }
      if (s.producto_id) {
        stockPorProd[s.producto_id] = Number(((stockPorProd[s.producto_id] || 0) + saldo).toFixed(4))
      }
    })

    // Para productos combo: calcular stock y precio virtual a partir de combo_detalles y stock de componentes
    const comboPresIds = presentacionesRows
      .filter((pr) => {
        const prodPadre = productosRows.find((p) => p.id === pr.producto_uuid)
        return prodPadre && prodPadre.es_combo
      })
      .map((pr) => pr.id)

    const comboDetallesMap = {}
    if (comboPresIds.length > 0) {
      const comboDetallesRows = await db
        .select({
          presentacion_combo_id: schema.combo_detalles.presentacion_combo_id,
          presentacion_componente_id: schema.combo_detalles.presentacion_componente_id,
          cantidad: schema.combo_detalles.cantidad,
          tipo_ajuste: schema.combo_detalles.tipo_ajuste,
          valor_ajuste: schema.combo_detalles.valor_ajuste,
          precio_final: schema.combo_detalles.precio_final,
          comp_multiplica_por: schema.presentaciones.multiplica_por,
          comp_precio_costo: schema.presentaciones.precio_costo,
          comp_precio_venta: schema.presentaciones.precio_venta,
          comp_producto_uuid: schema.presentaciones.producto_uuid
        })
        .from(schema.combo_detalles)
        .leftJoin(
          schema.presentaciones,
          eq(schema.combo_detalles.presentacion_componente_id, schema.presentaciones.id)
        )
        .where(
          and(
            inArray(schema.combo_detalles.presentacion_combo_id, comboPresIds),
            eq(schema.combo_detalles.activo, true)
          )
        )

      // Cargar stock de productos componentes si no se cargaron previamente
      const compProdIds = Array.from(new Set(comboDetallesRows.map((d) => d.comp_producto_uuid).filter(Boolean)))
      const compProdIdsFaltantes = compProdIds.filter((cId) => stockPorProd[cId] === undefined)
      if (compProdIdsFaltantes.length > 0) {
        const compStockConds = [inArray(schema.stock_actual.producto_id, compProdIdsFaltantes)]
        if (branchId) {
          compStockConds.push(eq(schema.stock_actual.branch_id, branchId))
        }
        const compStockRows = await db
          .select()
          .from(schema.stock_actual)
          .where(and(...compStockConds))

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

    // Mapear presentaciones por producto convirtiendo de entero (BD) a decimal visual
    // El stock de cada presentación se calcula a partir del stock base total del producto dividido por su multiplica_por
    // Para combos: se calcula dinámicamente como el mínimo stock disponible entre sus componentes
    const presMap = {}
    presentacionesRows.forEach(pres => {
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
          if (precioFinalUnit < 0) precioFinalUnit = 0
          precioFinalUnit = Math.floor(precioFinalUnit * 1000) / 1000

          precioAcumuladoVisual += precioFinalUnit * cantReq
          costoAcumuladoVisual += costoUnit * cantReq
        })

        stockPres = stockComboMin === Infinity ? 0 : stockComboMin
        stockPorProd[pres.producto_uuid] = stockPres
        if (precioAcumuladoVisual > 0) {
          precioVentaCalculado = Number(precioAcumuladoVisual.toFixed(2))
        }
        if (costoAcumuladoVisual > 0) {
          precioCostoCalculado = Number(costoAcumuladoVisual.toFixed(2))
        }
      } else {
        const multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
        const saldoBaseTotal = Number(stockPorProd[pres.producto_uuid] || 0)
        stockPres = calcularStockPresentacion(saldoBaseTotal, multiplicaPor)
      }

      const multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
      const saldoBaseTotal = Number(stockPorProd[pres.producto_uuid] || 0)
      const presUnidad = pres.unidad_medida_id || null

      presMap[pres.producto_uuid].push({
        id: pres.id,
        nombre: pres.nombre,
        cod_barra: pres.cod_barra,
        unidad_medida_id: presUnidad,
        unidad_medida_descripcion: presUnidad ? (unidadesMap[presUnidad] || presUnidad) : null,
        multiplica_por: multiplicaPor,
        stock_actual: stockPres,
        stock_base_producto: saldoBaseTotal,
        // Conversión con factor de precio (céntimos -> decimal)
        precio_costo: precioCostoCalculado,
        precio_venta: precioVentaCalculado,
        precio_mayor: Number(pres.precio_mayor || 0) / factorPrecio,
        precio_especial: Number(pres.precio_especial || 0) / factorPrecio,
        precio_otros: Number(pres.precio_otros || 0) / factorPrecio,
        // Montos en entero original almacenados en la BD
        precio_costo_raw: Number(pres.precio_costo || 0),
        precio_venta_raw: Number(pres.precio_venta || 0),
        activo: pres.activo
      })
    })

    const data = productosRows.map(p => {
      const pPres = presMap[p.id] || []
      const principal = pPres[0] || null
      const stockProducto = stockPorProd[p.id] !== undefined ? stockPorProd[p.id] : 0
      return {
        ...p,
        stock_actual: stockProducto,
        stock: stockProducto,
        stock_minimo_raw: Number(p.stock_minimo || 0),
        presentaciones: pPres,
        // Precios de la presentación por defecto para rápida referencia (decimales)
        precio_costo: principal ? principal.precio_costo : 0,
        precio_venta: principal ? principal.precio_venta : 0,
        precio_mayor: principal ? principal.precio_mayor : 0,
        precio_especial: principal ? principal.precio_especial : 0
      }
    })

    return reply.code(200).send({ data, factores: { factorPrecio, factorVolumen } })
  })

  // ── GET /api/productos/:id ──────────────────────────────────────────────────────
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    const { factorPrecio, factorVolumen } = await getFactores()

    const [producto] = await db
      .select({
        id: schema.productos.id,
        codigo: schema.productos.codigo,
        nombre: schema.productos.nombre,
        descripcion: schema.productos.descripcion,
        codigo_barra: schema.productos.codigo_barra,
        palabra_clave: schema.productos.palabra_clave,
        codigo_sunat: schema.productos.codigo_sunat,
        unidad_medida_id: schema.productos.unidad_medida_id,
        es_facturable: schema.productos.es_facturable,
        es_vendible: schema.productos.es_vendible,
        es_insumo: schema.productos.es_insumo,
        es_producido: schema.productos.es_producido,
        es_combo: schema.productos.es_combo,
        activo: schema.productos.activo,
        stock_minimo: schema.productos.stock_minimo,
        categoria_id: schema.productos.categoria,
        sub_categoria_id: schema.productos.sub_categoria,
        tipo_existencia_id: schema.productos.tipo_existencia,
        tipo_tributo_id: schema.productos.tipo_tributo,
        empresa_id: schema.productos.empresa_id,
        created_at: schema.productos.created_at,
        updated_at: schema.productos.updated_at,
        categoria_nombre: schema.categorias.nombre,
        sub_categoria_nombre: schema.subcategoria.Nombre,
        unidad_medida_descripcion: schema.tipo_unidades_medida.descripcion
      })
      .from(schema.productos)
      .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))
      .leftJoin(schema.subcategoria, eq(schema.productos.sub_categoria, schema.subcategoria.id))
      .leftJoin(schema.tipo_unidades_medida, eq(schema.productos.unidad_medida_id, schema.tipo_unidades_medida.codigo))
      .where(eq(schema.productos.id, id))

    if (!producto) {
      throw fastify.httpErrors.notFound(`Producto no encontrado`)
    }

    // Catálogo de unidades de medida para enriquecer presentaciones
    const unidadesMedidaRows = await db
      .select({
        codigo: schema.tipo_unidades_medida.codigo,
        descripcion: schema.tipo_unidades_medida.descripcion
      })
      .from(schema.tipo_unidades_medida)
    const unidadesMap = {}
    unidadesMedidaRows.forEach(u => {
      if (u.codigo) unidadesMap[u.codigo] = u.descripcion
    })

    // Obtener todas sus presentaciones y su stock_actual
    const branchId = request.user?.branch_id
    const presRows = await db
      .select()
      .from(schema.presentaciones)
      .where(eq(schema.presentaciones.producto_uuid, id))

    const stockConds = [eq(schema.stock_actual.producto_id, id)]
    if (branchId) {
      stockConds.push(eq(schema.stock_actual.branch_id, branchId))
    }
    const stockRows = await db
      .select()
      .from(schema.stock_actual)
      .where(and(...stockConds))

    const stockPorPres = {}
    let stockProducto = 0
    stockRows.forEach(s => {
      const saldo = toVolumenVisual(s.saldo_actual, factorVolumen)
      stockProducto = Number((stockProducto + saldo).toFixed(4))
      if (s.presentacion_id) {
        stockPorPres[s.presentacion_id] = Number(((stockPorPres[s.presentacion_id] || 0) + saldo).toFixed(4))
      }
    })

    const presentaciones = presRows.map(pres => {
      const multiplicaPor = Math.max(1, Number(pres.multiplica_por || 1))
      const stockPres = calcularStockPresentacion(stockProducto, multiplicaPor)
      const presUnidad = pres.unidad_medida_id || null
      return {
        id: pres.id,
        nombre: pres.nombre,
        cod_barra: pres.cod_barra,
        unidad_medida_id: presUnidad,
        unidad_medida_descripcion: presUnidad ? (unidadesMap[presUnidad] || presUnidad) : null,
        multiplica_por: multiplicaPor,
        stock_actual: stockPres,
        stock_base_producto: stockProducto,
        precio_costo: Number(pres.precio_costo || 0) / factorPrecio,
        precio_venta: Number(pres.precio_venta || 0) / factorPrecio,
        precio_mayor: Number(pres.precio_mayor || 0) / factorPrecio,
        precio_especial: Number(pres.precio_especial || 0) / factorPrecio,
        precio_otros: Number(pres.precio_otros || 0) / factorPrecio,
        precio_costo_raw: Number(pres.precio_costo || 0),
        precio_venta_raw: Number(pres.precio_venta || 0),
        activo: pres.activo
      }
    })

    const principal = presentaciones[0] || null

    return reply.code(200).send({
      data: {
        ...producto,
        stock_actual: stockProducto,
        stock: stockProducto,
        stock_minimo_raw: Number(producto.stock_minimo || 0),
        presentaciones,
        precio_costo: principal ? principal.precio_costo : 0,
        precio_venta: principal ? principal.precio_venta : 0,
        precio_mayor: principal ? principal.precio_mayor : 0,
        precio_especial: principal ? principal.precio_especial : 0
      },
      factores: { factorPrecio, factorVolumen }
    })
  })

  // ── GET /api/productos/:id/kardex ───────────────────────────────────────────────
  fastify.get('/:id/kardex', async (request, reply) => {
    const { id } = request.params
    const branchId = request.user?.branch_id
    const { factorVolumen } = await getFactores()

    const conditions = [eq(schema.stock.producto_id, id)]
    if (!request.user?.es_super_admin && branchId) {
      conditions.push(eq(schema.stock.branch_id, branchId))
    }

    const rawMovimientos = await db
      .select({
        id: schema.stock.id,
        producto_id: schema.stock.producto_id,
        presentacion_id: schema.stock.presentacion_id,
        presentacion_nombre: schema.presentaciones.nombre,
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

    return reply.code(200).send({ success: true, data: movimientos })
  })

  // ── POST /api/productos ─────────────────────────────────────────────────────────
  fastify.post('/', async (request, reply) => {
    const payload = request.body
    const empresaId = payload.empresa_id || request.user?.empresa_id || payload.branch_id || request.user?.branch_id

    if (!payload.nombre || payload.nombre.trim() === '') {
      throw fastify.httpErrors.badRequest('El nombre del producto es obligatorio.')
    }

    const { factorPrecio } = await getFactores()

    // Validar presentaciones (por defecto debe haber al menos una inicial)
    let presentacionesPayload = Array.isArray(payload.presentaciones) && payload.presentaciones.length > 0
      ? payload.presentaciones
      : [
        {
          nombre: payload.presentacion_nombre || 'UNIDAD',
          cod_barra: payload.codigo_barra || null,
          multiplica_por: 1,
          precio_costo: Number(payload.precio_costo || 0),
          precio_venta: Number(payload.precio_venta || 0),
          precio_mayor: Number(payload.precio_mayor || 0),
          precio_especial: Number(payload.precio_especial || 0),
          precio_otros: Number(payload.precio_otros || 0),
          activo: true
        }
      ]

    const toCentimos = (val) => Math.round(Number(val || 0) * factorPrecio)

    const cleanUuid = (val) => {
      if (!val || typeof val !== 'string') return null
      const trimmed = val.trim()
      // Regex estándar para UUID v4 / UUID canónico
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(trimmed) ? trimmed : null
    }

    const result = await db.transaction(async (tx) => {
      // 1. Insertar Producto (stock_minimo se guarda como número entero, codigo es autogenerado por BD)
      const [nuevoProducto] = await tx
        .insert(schema.productos)
        .values({
          nombre: payload.nombre.trim(),
          descripcion: payload.descripcion || null,
          codigo_barra: payload.codigo_barra || null,
          palabra_clave: payload.palabra_clave || null,
          unidad_medida_id: payload.unidad_medida_id || 'NIU',
          codigo_sunat: payload.codigo_sunat || null,
          es_facturable: payload.es_facturable ?? true,
          es_vendible: payload.es_vendible ?? true,
          es_insumo: payload.es_insumo ?? false,
          es_producido: payload.es_producido ?? false,
          es_combo: payload.es_combo ?? false,
          activo: payload.activo ?? true,
          stock_minimo: Math.round(Number(payload.stock_minimo || 0)),
          categoria: cleanUuid(payload.categoria_id),
          sub_categoria: cleanUuid(payload.sub_categoria_id),
          tipo_existencia: payload.tipo_existencia_id && String(payload.tipo_existencia_id).trim() !== '' ? String(payload.tipo_existencia_id).trim() : null,
          tipo_tributo: payload.tipo_tributo_id && String(payload.tipo_tributo_id).trim() !== '' ? String(payload.tipo_tributo_id).trim() : null,
          empresa_id: cleanUuid(empresaId)
        })
        .returning()

      // 2. Insertar Presentaciones asociadas multiplicadas por factorPrecio (céntimos en BD)
      const presInsertadas = []
      for (const pres of presentacionesPayload) {
        const unidadMedidaPres = (pres.unidad_medida_id || payload.unidad_medida_id || 'NIU').trim()
        if (!unidadMedidaPres) {
          throw fastify.httpErrors.badRequest(`La presentación "${pres.nombre || 'UNIDAD'}" requiere una unidad de medida válida.`)
        }

        const [pRow] = await tx
          .insert(schema.presentaciones)
          .values({
            producto_uuid: nuevoProducto.id,
            nombre: pres.nombre || 'UNIDAD',
            cod_barra: pres.cod_barra || payload.codigo_barra || null,
            unidad_medida_id: unidadMedidaPres,
            multiplica_por: Number(pres.multiplica_por || 1),
            precio_costo: toCentimos(pres.precio_costo),
            precio_venta: toCentimos(pres.precio_venta),
            precio_mayor: toCentimos(pres.precio_mayor),
            precio_especial: toCentimos(pres.precio_especial),
            precio_otros: toCentimos(pres.precio_otros),
            activo: pres.activo ?? true
          })
          .returning()
        presInsertadas.push({
          ...pRow,
          precio_costo: Number(pRow.precio_costo || 0) / factorPrecio,
          precio_venta: Number(pRow.precio_venta || 0) / factorPrecio,
          precio_mayor: Number(pRow.precio_mayor || 0) / factorPrecio,
          precio_especial: Number(pRow.precio_especial || 0) / factorPrecio,
          precio_otros: Number(pRow.precio_otros || 0) / factorPrecio
        })
      }

      return {
        ...nuevoProducto,
        presentaciones: presInsertadas
      }
    })

    return reply.code(201).send({ message: 'Producto registrado exitosamente', data: result })
  })

  // ── PUT /api/productos/:id ──────────────────────────────────────────────────────
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const payload = request.body
    const { factorPrecio } = await getFactores()

    const [existente] = await db.select().from(schema.productos).where(eq(schema.productos.id, id))
    if (!existente) {
      throw fastify.httpErrors.notFound('Producto no encontrado')
    }

    const toCentimos = (val) => Math.round(Number(val || 0) * factorPrecio)

    const cleanUuid = (val) => {
      if (!val || typeof val !== 'string') return null
      const trimmed = val.trim()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(trimmed) ? trimmed : null
    }

    const result = await db.transaction(async (tx) => {
      // 1. Actualizar Producto (el codigo autogenerado no se sobreescribe)
      const [prodActualizado] = await tx
        .update(schema.productos)
        .set({
          nombre: payload.nombre !== undefined ? payload.nombre.trim() : existente.nombre,
          descripcion: payload.descripcion !== undefined ? (payload.descripcion || null) : existente.descripcion,
          codigo_barra: payload.codigo_barra !== undefined ? (payload.codigo_barra || null) : existente.codigo_barra,
          palabra_clave: payload.palabra_clave !== undefined ? (payload.palabra_clave || null) : existente.palabra_clave,
          unidad_medida_id: payload.unidad_medida_id !== undefined ? payload.unidad_medida_id : existente.unidad_medida_id,
          codigo_sunat: payload.codigo_sunat !== undefined ? (payload.codigo_sunat || null) : existente.codigo_sunat,
          es_facturable: payload.es_facturable !== undefined ? payload.es_facturable : existente.es_facturable,
          es_vendible: payload.es_vendible !== undefined ? payload.es_vendible : existente.es_vendible,
          es_insumo: payload.es_insumo !== undefined ? payload.es_insumo : existente.es_insumo,
          es_producido: payload.es_producido !== undefined ? payload.es_producido : existente.es_producido,
          es_combo: payload.es_combo !== undefined ? payload.es_combo : existente.es_combo,
          activo: payload.activo !== undefined ? payload.activo : existente.activo,
          stock_minimo: payload.stock_minimo !== undefined ? Math.round(Number(payload.stock_minimo)) : existente.stock_minimo,
          categoria: payload.categoria_id !== undefined ? cleanUuid(payload.categoria_id) : existente.categoria,
          sub_categoria: payload.sub_categoria_id !== undefined ? cleanUuid(payload.sub_categoria_id) : existente.sub_categoria,
          tipo_existencia: payload.tipo_existencia_id !== undefined ? (payload.tipo_existencia_id && String(payload.tipo_existencia_id).trim() !== '' ? String(payload.tipo_existencia_id).trim() : null) : existente.tipo_existencia,
          tipo_tributo: payload.tipo_tributo_id !== undefined ? (payload.tipo_tributo_id && String(payload.tipo_tributo_id).trim() !== '' ? String(payload.tipo_tributo_id).trim() : null) : existente.tipo_tributo,
          updated_at: new Date().toISOString()
        })
        .where(eq(schema.productos.id, id))
        .returning()

      // 2. Gestionar Presentaciones (Si se enviaron en el payload)
      let presActualizadas = []
      if (Array.isArray(payload.presentaciones) && payload.presentaciones.length > 0) {
        // Obtener presentaciones existentes del producto para comparar y preservar UUIDs
        const existentesDb = await tx
          .select()
          .from(schema.presentaciones)
          .where(eq(schema.presentaciones.producto_uuid, id))

        const existingMap = new Map()
        existentesDb.forEach(p => existingMap.set(p.id, p))

        const incomingIds = new Set()

        for (const pres of payload.presentaciones) {
          const presId = cleanUuid(pres.id)
          const multiplicaPor = Number(pres.multiplica_por || 1)
          const unidadMedidaPres = (pres.unidad_medida_id || payload.unidad_medida_id || existente.unidad_medida_id || 'NIU').trim()

          if (!unidadMedidaPres) {
            throw fastify.httpErrors.badRequest(`La presentación "${pres.nombre || 'UNIDAD'}" requiere una unidad de medida válida.`)
          }

          if (presId && existingMap.has(presId)) {
            // A. UPDATE de presentación existente (mantiene su UUID para siempre)
            incomingIds.add(presId)
            const [pRow] = await tx
              .update(schema.presentaciones)
              .set({
                nombre: pres.nombre || 'UNIDAD',
                cod_barra: pres.cod_barra || payload.codigo_barra || null,
                unidad_medida_id: unidadMedidaPres,
                multiplica_por: multiplicaPor,
                precio_costo: toCentimos(pres.precio_costo),
                precio_venta: toCentimos(pres.precio_venta),
                precio_mayor: toCentimos(pres.precio_mayor),
                precio_especial: toCentimos(pres.precio_especial),
                precio_otros: toCentimos(pres.precio_otros),
                activo: pres.activo ?? true,
                updated_at: sql`NOW()`
              })
              .where(eq(schema.presentaciones.id, presId))
              .returning()

            presActualizadas.push({
              ...pRow,
              precio_costo: Number(pRow.precio_costo || 0) / factorPrecio,
              precio_venta: Number(pRow.precio_venta || 0) / factorPrecio,
              precio_mayor: Number(pRow.precio_mayor || 0) / factorPrecio,
              precio_especial: Number(pRow.precio_especial || 0) / factorPrecio,
              precio_otros: Number(pRow.precio_otros || 0) / factorPrecio
            })
          } else {
            // B. INSERT de nueva presentación agregada por el usuario
            const [pRow] = await tx
              .insert(schema.presentaciones)
              .values({
                producto_uuid: id,
                nombre: pres.nombre || 'UNIDAD',
                cod_barra: pres.cod_barra || payload.codigo_barra || null,
                unidad_medida_id: unidadMedidaPres,
                multiplica_por: multiplicaPor,
                precio_costo: toCentimos(pres.precio_costo),
                precio_venta: toCentimos(pres.precio_venta),
                precio_mayor: toCentimos(pres.precio_mayor),
                precio_especial: toCentimos(pres.precio_especial),
                precio_otros: toCentimos(pres.precio_otros),
                activo: pres.activo ?? true
              })
              .returning()

            incomingIds.add(pRow.id)
            presActualizadas.push({
              ...pRow,
              precio_costo: Number(pRow.precio_costo || 0) / factorPrecio,
              precio_venta: Number(pRow.precio_venta || 0) / factorPrecio,
              precio_mayor: Number(pRow.precio_mayor || 0) / factorPrecio,
              precio_especial: Number(pRow.precio_especial || 0) / factorPrecio,
              precio_otros: Number(pRow.precio_otros || 0) / factorPrecio
            })
          }
        }

        // C. Eliminar ÚNICAMENTE las presentaciones que el usuario quitó explícitamente en el modal
        const idsAEliminar = existentesDb
          .map(p => p.id)
          .filter(pid => !incomingIds.has(pid))

        if (idsAEliminar.length > 0) {
          const { inArray } = require('drizzle-orm')
          await tx
            .delete(schema.presentaciones)
            .where(inArray(schema.presentaciones.id, idsAEliminar))
        }
      } else {
        // Si no se envió array, recuperar las existentes convirtiendo a decimal
        const rawExisting = await tx
          .select()
          .from(schema.presentaciones)
          .where(eq(schema.presentaciones.producto_uuid, id))
        presActualizadas = rawExisting.map(pres => ({
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

    return reply.code(200).send({ message: 'Producto actualizado exitosamente', data: result })
  })

  // ── DELETE /api/productos/:id ───────────────────────────────────────────────────
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const [producto] = await db
      .update(schema.productos)
      .set({ activo: false, updated_at: new Date().toISOString() })
      .where(eq(schema.productos.id, id))
      .returning()

    if (!producto) {
      throw fastify.httpErrors.notFound('Producto no encontrado')
    }

    return reply.code(200).send({ message: 'Producto dado de baja exitosamente', data: producto })
  })
}

module.exports = productosRoutes
