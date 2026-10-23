'use strict'

const stockController = require('./controllers/stock.controller')

/**
 * Rutas para el Módulo de Control de Stock Actual y Kárdex Histórico
 * Prefijo: /api/stock
 * Arquitectura: Vertical Slice / Domain-Driven Design (Transporte HTTP puro)
 * Seguridad: Protegido por fastify.authorize (RBAC: stock.ver, stock.crear, stock.editar, kardexprod.ver)
 */
async function stockRoutes(fastify) {
  // Hook global de autorización RBAC + inyección de active_acceso (empresa_id, branch_id, rol_nivel)
  fastify.addHook('preHandler', fastify.authorize)

  // 1. GET /api/stock - Lista productos con sus presentaciones y saldo en stock_actual
  fastify.get(
    '/',
    {
      config: {
        permission: ['stock.ver', 'kardexprod.ver']
      }
    },
    stockController.getStock
  )

  // 2. GET /api/stock/kardex - Consulta Kárdex histórico por producto/presentación
  fastify.get(
    '/kardex',
    {
      config: {
        permission: ['stock.ver', 'kardexprod.ver']
      }
    },
    stockController.getKardex
  )

  // 3. POST /api/stock/ajuste - Registra movimiento manual de stock (Entrada/Salida)
  fastify.post(
    '/ajuste',
    {
      config: {
        permission: ['stock.crear', 'stock.editar', 'kardexprod.crear', 'kardexprod.editar']
      }
    },
    stockController.registrarAjuste
  )

  // 4. POST /api/stock/reiniciar-masivo - Reinicia a 0 stock_actual con compensación en kárdex
  fastify.post(
    '/reiniciar-masivo',
    {
      config: {
        permission: ['stock.editar', 'kardexprod.editar']
      }
    },
    stockController.reiniciarMasivo
  )

  // 5. POST /api/stock/carga-masiva - Carga e inventario masivo en presentación principal
  fastify.post(
    '/carga-masiva',
    {
      config: {
        permission: ['stock.crear', 'stock.editar', 'kardexprod.crear', 'kardexprod.editar']
      }
    },
    stockController.cargaMasiva
  )
}

module.exports = stockRoutes
