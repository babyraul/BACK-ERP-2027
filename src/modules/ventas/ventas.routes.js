'use strict'

const ventasController = require('./controllers/ventas.controller')

/**
 * Rutas Transaccionales para Ventas Finales y Facturación
 * Prefijo: /api/ventas
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authenticate (RBAC integrado)
 */
async function ventasRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

  // 1. Listar ventas con filtros
  fastify.get('/', auth, ventasController.listar)

  // 2. Obtener detalle completo de la venta
  fastify.get('/:id', auth, ventasController.obtenerPorId)

  // 3. Transacción final de Venta (Cobro de Preventa + Generación Comprobante)
  fastify.post('/', auth, ventasController.crear)

  // 4. Anular venta emitida (Baja lógica / Inactivación y restitución de stock)
  fastify.post('/:id/anular', auth, ventasController.anular)
}

module.exports = ventasRoutes
