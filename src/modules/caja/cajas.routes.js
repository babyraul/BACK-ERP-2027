'use strict'

const cajasController = require('./controllers/cajas.controller')

/**
 * Rutas especializadas para la Gestión de Cajas, Turnos, Arqueos y Cierres
 * Prefijo: /api/cajas
 * Arquitectura: Vertical Slice / Domain-Driven Design
 * Seguridad: Protegido por fastify.authorize (RBAC: cajas.ver, cajas.crear, cajas.editar, cajas.eliminar)
 */
async function cajasRoutes(fastify) {
  // Verificación de autenticación y autorización RBAC dinámica
  fastify.addHook('preHandler', fastify.authorize)

  // 1. Series y Correlativos de Caja
  fastify.get('/', cajasController.listar)
  fastify.get('/configuradas', cajasController.listarConfiguradas)
  fastify.post('/', cajasController.crear)
  fastify.put('/:id', cajasController.actualizar)
  fastify.delete('/:id', cajasController.eliminar) // Inactivación visual (Soft delete)

  // 2. Gestión de Turnos de Caja
  fastify.get('/turnos', cajasController.listarTurnos)
  fastify.get('/turnos/activo', cajasController.obtenerTurnoActivo)
  fastify.get('/turnos/:id', cajasController.obtenerTurnoDetalle)
  fastify.post('/turnos/apertura', cajasController.aperturarTurno)

  // 3. Movimientos Manuales (Ingresos / Egresos) y Arqueos
  fastify.get('/turnos/:id/movimientos', cajasController.listarMovimientos)
  fastify.post('/turnos/:id/movimientos', cajasController.registrarMovimiento)
  fastify.get('/movimientos/:movimientoId/arqueo', cajasController.obtenerArqueoMovimiento)
  fastify.get('/turnos/:id/arqueos', cajasController.listarArqueosTurno)

  // 4. Cierre de Turno y Conciliación Final
  fastify.post('/turnos/:id/cierre', cajasController.cerrarTurno)
}

module.exports = cajasRoutes
