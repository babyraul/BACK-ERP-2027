'use strict'

/**
 * Rutas de Sincronización
 *
 * POST /api/sync/push    → recibe cambios del otro servidor (autenticado por API-Key)
 * GET  /api/sync/pull    → devuelve cambios desde ?since=<ISO timestamp>  (API-Key)
 * GET  /api/sync/status  → estado del último sync (JWT)
 */
async function syncRoutes(fastify) {

  const apiKeyAuth = { preHandler: [fastify.authenticateApiKey] }
  const jwtAuth    = { preHandler: [fastify.authenticate] }

  // ── POST /push ─────────────────────────────────────────────────────────────
  // El SERVER_LOCAL llama a este endpoint en SERVER_NUBE para enviar sus cambios.
  // SERVER_NUBE también lo expone por si en el futuro se necesita sync inverso.
  fastify.post('/push', {
    ...apiKeyAuth,
    schema: {
      body: {
        type: 'object',
        required: ['registros'],
        properties: {
          registros: {
            type: 'array',
            items: {
              type: 'object',
              required: ['tabla', 'registro_id', 'operacion', 'payload', 'updated_at'],
              properties: {
                tabla:        { type: 'string' },
                registro_id:  { type: 'string' },
                operacion:    { type: 'string', enum: ['insert', 'update', 'delete'] },
                payload:      { type: 'object' },
                updated_at:   { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { registros } = request.body
    const rechazados    = []
    const aplicados     = []

    for (const reg of registros) {
      try {
        // TODO: DB → aplicar cada registro según operación (Last-Write-Wins)
        // const tablaMap = { productos: 'productos', clientes: 'clientes', ventas: 'ventas' }
        // await applyRecord(fastify.sql, reg)
        aplicados.push(reg.registro_id)
      } catch (err) {
        fastify.log.error({ err, reg }, 'Error al aplicar registro sync')
        rechazados.push({ id: reg.registro_id, error: err.message })
      }
    }

    fastify.log.info(`Sync push: ${aplicados.length} aplicados, ${rechazados.length} rechazados`)

    return { ok: true, aplicados: aplicados.length, rechazados }
  })

  // ── GET /pull ──────────────────────────────────────────────────────────────
  // SERVER_LOCAL llama esto a SERVER_NUBE para obtener cambios desde un timestamp.
  fastify.get('/pull', {
    ...apiKeyAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'string', description: 'ISO 8601 timestamp' },
        },
      },
    },
  }, async (request) => {
    const { since } = request.query
    const sinceDate  = since ? new Date(since) : new Date(0)

    // TODO: DB → SELECT * FROM sync_log WHERE created_at > $sinceDate AND enviado = false
    // Por ahora devuelve array vacío
    const registros = []

    return {
      since:     sinceDate.toISOString(),
      timestamp: new Date().toISOString(),
      total:     registros.length,
      registros,
    }
  })

  // ── GET /status ────────────────────────────────────────────────────────────
  fastify.get('/status', jwtAuth, async () => {
    // TODO: DB → SELECT * FROM sync_state LIMIT 1
    return {
      status:       'idle',
      last_sync_at: null,
      next_sync_in: Number(process.env.SYNC_INTERVAL_SECONDS || 30),
    }
  })
}

module.exports = syncRoutes
