'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')

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

  // Obtener factores de conversión del sistema (default PRECIO: 100, VOLUMEN: 1000000)
  const getFactores = async () => {
    try {
      const factoresRows = await db.select().from(schema.tipo_factores)
      const fPrecio = factoresRows.find(f => f.codigo === 'PRECIO')?.valor || 100
      const fVolumen = factoresRows.find(f => f.codigo === 'VOLUMEN')?.valor || 1000000
      return { factorPrecio: Number(fPrecio), factorVolumen: Number(fVolumen) }
    } catch (e) {
      return { factorPrecio: 100, factorVolumen: 1000000 }
    }
  }

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
          ilike(schema.productos.codigo_barra, search),
          ilike(schema.productos.palabra_clave, search)
        )
      )
    }

    let query = db
      .select({
        id: schema.productos.id,
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
        sub_categoria_nombre: schema.subcategoria.Nombre
      })
      .from(schema.productos)
      .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))
      .leftJoin(schema.subcategoria, eq(schema.productos.sub_categoria, schema.subcategoria.id))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const productosRows = await query.orderBy(desc(schema.productos.created_at))

    const { factorPrecio, factorVolumen } = await getFactores()

    // Cargar presentaciones asociadas a los productos obtenidos
    const prodIds = productosRows.map(p => p.id)
    let presentacionesRows = []
    if (prodIds.length > 0) {
      const { inArray } = require('drizzle-orm')
      presentacionesRows = await db
        .select()
        .from(schema.presentaciones)
        .where(inArray(schema.presentaciones.producto_uuid, prodIds))
    }

    // Mapear presentaciones por producto convirtiendo de entero (BD) a decimal visual
    const presMap = {}
    presentacionesRows.forEach(pres => {
      if (!presMap[pres.producto_uuid]) presMap[pres.producto_uuid] = []
      presMap[pres.producto_uuid].push({
        id: pres.id,
        nombre: pres.nombre,
        cod_barra: pres.cod_barra,
        multiplica_por: Number(pres.multiplica_por || 1),
        // Conversión con factor de precio (céntimos -> decimal)
        precio_costo: Number(pres.precio_costo || 0) / factorPrecio,
        precio_venta: Number(pres.precio_venta || 0) / factorPrecio,
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
      return {
        ...p,
        // Conversión con factor de volumen si aplica en stock mínimo
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
        sub_categoria_nombre: schema.subcategoria.Nombre
      })
      .from(schema.productos)
      .leftJoin(schema.categorias, eq(schema.productos.categoria, schema.categorias.id))
      .leftJoin(schema.subcategoria, eq(schema.productos.sub_categoria, schema.subcategoria.id))
      .where(eq(schema.productos.id, id))

    if (!producto) {
      throw fastify.httpErrors.notFound(`Producto no encontrado`)
    }

    // Obtener todas sus presentaciones
    const presRows = await db
      .select()
      .from(schema.presentaciones)
      .where(eq(schema.presentaciones.producto_uuid, id))

    const presentaciones = presRows.map(pres => ({
      id: pres.id,
      nombre: pres.nombre,
      cod_barra: pres.cod_barra,
      multiplica_por: Number(pres.multiplica_por || 1),
      precio_costo: Number(pres.precio_costo || 0) / factorPrecio,
      precio_venta: Number(pres.precio_venta || 0) / factorPrecio,
      precio_mayor: Number(pres.precio_mayor || 0) / factorPrecio,
      precio_especial: Number(pres.precio_especial || 0) / factorPrecio,
      precio_otros: Number(pres.precio_otros || 0) / factorPrecio,
      precio_costo_raw: Number(pres.precio_costo || 0),
      precio_venta_raw: Number(pres.precio_venta || 0),
      activo: pres.activo
    }))

    const principal = presentaciones[0] || null

    return reply.code(200).send({
      data: {
        ...producto,
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
      // 1. Insertar Producto (stock_minimo se guarda como número entero)
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
        const [pRow] = await tx
          .insert(schema.presentaciones)
          .values({
            producto_uuid: nuevoProducto.id,
            nombre: pres.nombre || 'UNIDAD',
            cod_barra: pres.cod_barra || payload.codigo_barra || null,
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
      // 1. Actualizar Producto
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
        // Eliminar presentaciones previas o sincronizar
        await tx.delete(schema.presentaciones).where(eq(schema.presentaciones.producto_uuid, id))

        for (const pres of payload.presentaciones) {
          const [pRow] = await tx
            .insert(schema.presentaciones)
            .values({
              producto_uuid: id,
              nombre: pres.nombre || 'UNIDAD',
              cod_barra: pres.cod_barra || payload.codigo_barra || null,
              multiplica_por: Number(pres.multiplica_por || 1),
              precio_costo: toCentimos(pres.precio_costo),
              precio_venta: toCentimos(pres.precio_venta),
              precio_mayor: toCentimos(pres.precio_mayor),
              precio_especial: toCentimos(pres.precio_especial),
              precio_otros: toCentimos(pres.precio_otros),
              activo: pres.activo ?? true
            })
            .returning()
          presActualizadas.push({
            ...pRow,
            precio_costo: Number(pRow.precio_costo || 0) / factorPrecio,
            precio_venta: Number(pRow.precio_venta || 0) / factorPrecio,
            precio_mayor: Number(pRow.precio_mayor || 0) / factorPrecio,
            precio_especial: Number(pRow.precio_especial || 0) / factorPrecio,
            precio_otros: Number(pRow.precio_otros || 0) / factorPrecio
          })
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
