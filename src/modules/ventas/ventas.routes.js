'use strict'

const ventasController = require('./controllers/ventas.controller')

/**
 * Rutas Transaccionales para Ventas Finales y Facturación
 * Prefijo: /api/ventas
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authorize (RBAC integrado y compatibilidad multi-permiso)
 */
async function ventasRoutes(fastify) {
  // PreHandler RBAC global para todo el módulo de ventas
  fastify.addHook('preHandler', fastify.authorize)

  // 1. Listar ventas con filtros y paginación defensiva (permite ventas.ver o facturacion.ver)
  fastify.get('/', {
    config: { permission: ['ventas.ver', 'facturacion.ver'] }
  }, ventasController.listar)

  // 2. Obtener detalle completo de la venta
  fastify.get('/:id', {
    config: { permission: ['ventas.ver', 'facturacion.ver'] }
  }, ventasController.obtenerPorId)

  // 3. Transacción final de Venta (Cobro de Preventa + Generación Comprobante)
  fastify.post('/', {
    config: { permission: ['ventas.crear', 'facturacion.crear'] }
  }, ventasController.crear)

  // 4. Anular venta emitida (Baja lógica / Inactivación y restitución de stock)
  fastify.post('/:id/anular', {
    config: { permission: ['ventas.anular', 'facturacion.anular'] }
  }, ventasController.anular)
}

module.exports = ventasRoutes

