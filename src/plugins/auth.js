'use strict'

/**
 * Plugin: Auth (JWT)
 *
 * - Registra @fastify/jwt con el secret del .env
 * - Decora fastify.authenticate  → preHandler que valida Bearer token
 * - Decora fastify.authenticateApiKey → valida header x-api-key (rutas /sync)
 * - En cada request autenticado, request.user = { id, email, rol }
 */

const fp  = require('fastify-plugin')
const jwt = require('@fastify/jwt')

async function authPlugin(fastify) {
  // ── Registro JWT ─────────────────────────────────────────────────────────
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'sistema-market-default-dev-secret-change-me-in-prod',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    },
  })

  // ── Decorator: validar Bearer token ──────────────────────────────────────
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token inválido o expirado.',
      })
    }
  })

  // ── Decorator: validar API Key (comunicación server-to-server) ───────────
  fastify.decorate('authenticateApiKey', async function (request, reply) {
    const apiKey = request.headers['x-api-key']
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'API Key inválida.',
      })
    }
  })
}

module.exports = fp(authPlugin, { name: 'auth' })
