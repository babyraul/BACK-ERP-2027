'use strict'

const proveedoresController = require('./controllers/proveedores.controller')

/**
 * Rutas CRUD para Proveedores
 * Prefijo: /api/proveedores
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authorize (RBAC: proveedores.ver, proveedores.crear, proveedores.editar, proveedores.eliminar)
 */
async function proveedoresRoutes(fastify) {
  // Verificación de autenticación y autorización RBAC dinámica
  fastify.addHook('preHandler', fastify.authorize)

  // 1. GET /api/proveedores - Listar proveedores con filtro y RLS
  fastify.get('/', proveedoresController.listar)

  // 2. GET /api/proveedores/:id - Obtener proveedor por ID
  fastify.get('/:id', proveedoresController.obtenerPorId)

  // 3. POST /api/proveedores - Crear proveedor
  fastify.post('/', proveedoresController.crear)

  // 4. PUT /api/proveedores/:id - Actualizar proveedor
  fastify.put('/:id', proveedoresController.actualizar)

  // 5. DELETE /api/proveedores/:id - Inactivación visual (Soft delete: activo = false)
  fastify.delete('/:id', proveedoresController.eliminar)
}

module.exports = proveedoresRoutes
