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

  // ── Decorator: authorize (Validación Dinámica ERP) ──────────────────────
  fastify.decorate('authorize', async function (request, reply) {
    // 1. Asegurar autenticación
    try {
      await request.jwtVerify()
      // Injectar variables de acceso activo a nivel raíz para fácil acceso
      if (request.user && request.user.active_acceso) {
        request.user.empresa_id = request.user.active_acceso.empresa_id
        request.user.branch_id = request.user.active_acceso.branch_id
        request.user.rol_nivel = request.user.active_acceso.rol_nivel
      }
    } catch (err) {
      return reply.code(401).send({ message: 'Token inválido o expirado.' })
    }

    // 2. Superadmin pasa directo
    if (request.user.es_super_admin) return

    // 3. Extraer configuración explícita de la ruta (si la hay)
    const routeConfig = request.routeOptions.config || {}
    if (routeConfig.public) return // Rutas que no requieren validación granular

    let requiredPermission = routeConfig.permission

    // 4. Si no hay permiso explícito, inferir del path y method
    if (!requiredPermission) {
      const match = request.routeOptions.url.match(/^\/api\/([^\/]+)/)
      if (!match) return // No es una ruta estándar de API, dejar pasar o manejar diferente
      
      const resource = match[1] // ej. "empresas"
      
      const methodMap = {
        GET: 'ver',
        POST: 'crear',
        PUT: 'editar',
        PATCH: 'editar',
        DELETE: 'eliminar'
      }
      const action = methodMap[request.method]
      if (!action) return // Método no mapeado
      
      requiredPermission = `${resource}.${action}`
    }

    // 5. Validar en Memoria O(1) extraído del JWT
    const { permisos } = request.user
    if (!permisos || !permisos.includes(requiredPermission)) {
      return reply.code(403).send({ message: `Acceso denegado. Se requiere el permiso: ${requiredPermission}` })
    }
  })
}

module.exports = fp(authPlugin, { name: 'auth' })
