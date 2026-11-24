'use strict'

const productosController = require('./controllers/productos.controller')

/**
 * Rutas CRUD de Productos con Drizzle ORM
 * Prefijo: /api/productos
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authorize (RBAC: productos.ver, productos.crear, productos.editar, productos.eliminar)
 */
async function productosRoutes(fastify) {
  // Verificación de autenticación y autorización RBAC automática (productos.ver, etc.)
  fastify.addHook('preHandler', fastify.authorize)

  // 1. GET /api/productos - Listar catálogo con presentaciones y stock
  fastify.get('/', productosController.listar)

  // 1.1 GET /api/productos/precios - Listar precios por presentación para edición masiva
  fastify.get('/precios', { config: { permission: 'productos.ver' } }, productosController.listarPrecios)

  // 1.2 PUT /api/productos/precios/masivo - Actualización masiva atómica de precios
  fastify.put(
    '/precios/masivo',
    {
      config: { permission: 'productos.editar' },
      schema: {
        body: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['presentacion_id'],
                properties: {
                  presentacion_id: { type: 'string' },
                  precio_costo: { type: 'number', minimum: 0 },
                  precio_venta: { type: 'number', minimum: 0 },
                  precio_mayor: { type: 'number', minimum: 0 },
                  precio_especial: { type: 'number', minimum: 0 },
                  precio_otros: { type: 'number', minimum: 0 },
                  descuento_predefinido: { type: 'number', minimum: 0 }
                }
              }
            }
          }
        }
      }
    },
    productosController.actualizarPreciosMasivo
  )

  // 2. GET /api/productos/:id - Detalle de producto y presentaciones
  fastify.get('/:id', productosController.obtenerPorId)

  // 3. GET /api/productos/:id/kardex - Consulta kárdex histórico de movimientos
  fastify.get('/:id/kardex', productosController.consultarKardex)

  // 4. POST /api/productos - Crear producto y presentaciones
  fastify.post('/', productosController.crear)

  // 5. PUT /api/productos/:id - Actualizar producto y sincronizar presentaciones
  fastify.put('/:id', productosController.actualizar)

  // 6. DELETE /api/productos/:id - Inactivación visual (Soft delete: activo = false)
  fastify.delete('/:id', productosController.eliminar)
}

module.exports = productosRoutes
