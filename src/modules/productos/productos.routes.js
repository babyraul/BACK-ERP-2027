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
