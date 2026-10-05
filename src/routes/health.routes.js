'use strict'

/** GET /api/health — Estado del servidor */
async function healthRoutes(fastify) {
  fastify.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status:    { type: 'string' },
            server:    { type: 'string' },
            timestamp: { type: 'string' },
            uptime:    { type: 'number' },
            db:        { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Verificar conexión DB
    let dbStatus = 'disconnected'
    if (fastify.sql) {
      try {
        await fastify.sql`SELECT 1`
        dbStatus = 'ok'
      } catch {
        dbStatus = 'error'
      }
    }

    return {
      status:    'ok',
      server:    'SERVER_NUBE',
      timestamp: new Date().toISOString(),
      uptime:    Math.floor(process.uptime()),
      db:        dbStatus,
    }
  })
}

module.exports = healthRoutes
