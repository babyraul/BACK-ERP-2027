'use strict'

const authService = require('../services/auth_service')

/**
 * Rutas de autenticación
 *
 * POST /api/auth/login    → { access_token, refresh_token, user }
 * POST /api/auth/refresh  → { access_token }
 * POST /api/auth/logout   → { message }
 * GET  /api/auth/me       → { user }  [protegida]
 */
async function authRoutes(fastify) {

  // ── POST /login ────────────────────────────────────────────────────────────
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['usuario', 'password'],
        properties: {
          usuario:  { type: 'string' },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
  }, async (request, reply) => {
    const { usuario, password } = request.body
    const result = await authService.login(fastify, usuario, password)
    return reply.code(200).send(result)
  })

  // ── POST /refresh ──────────────────────────────────────────────────────────
  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { refresh_token } = request.body
    const result = await authService.refresh(fastify, refresh_token)
    return reply.code(200).send(result)
  })

  // ── POST /logout ───────────────────────────────────────────────────────────
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    await authService.logout(fastify, request.user.id)
    return reply.code(200).send({ message: 'Sesión cerrada correctamente.' })
  })

  // ── GET /me ────────────────────────────────────────────────────────────────
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await authService.getMe(fastify, request.user.id)
    return reply.code(200).send({ user })
  })

  // ── GET /menu ──────────────────────────────────────────────────────────────
  fastify.get('/menu', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const activeEmpresaId = request.headers['x-empresa-id']
    const menu = await authService.getUserMenu(fastify, request.user.id, activeEmpresaId, request.user.es_super_admin)
    return reply.code(200).send(menu)
  })
}

module.exports = authRoutes
