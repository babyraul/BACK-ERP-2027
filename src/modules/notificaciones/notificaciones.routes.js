'use strict'

const notificacionesController = require('./controllers/notificaciones.controller')

/**
 * Rutas de Notificaciones In-App
 * Prefijo: /api/notificaciones
 * Seguridad: fastify.authenticate (cada usuario consulta y marca sus propias notificaciones)
 */
async function notificacionesRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate)

  fastify.get('/', notificacionesController.listar)
  fastify.get('/resumen', notificacionesController.resumen)
  fastify.post('/marcar-todas-leidas', notificacionesController.marcarTodasLeidas)
  fastify.post('/:id/marcar-leida', notificacionesController.marcarLeida)
}

module.exports = notificacionesRoutes
