'use strict'

require('dotenv').config()
const Fastify  = require('fastify')

const authPlugin     = require('./plugins/auth')
const dbPlugin       = require('./plugins/db')
const corsPlugin     = require('./plugins/cors')
const sensiblePlugin = require('./plugins/sensible')

const healthRoutes    = require('./routes/health.routes')
const authRoutes      = require('./routes/auth.routes')
const productosRoutes = require('./routes/productos.routes')
const clientesRoutes  = require('./routes/clientes.routes')
const ventasRoutes    = require('./routes/ventas.routes')
const usuariosRoutes  = require('./routes/usuarios.routes')
const syncRoutes      = require('./routes/sync.routes')
const gestionRoutes   = require('./routes/gestion.routes')

async function buildApp(opts = {}) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
          : undefined,
    },
    ...opts,
  })

  await app.register(sensiblePlugin)
  await app.register(corsPlugin)
  await app.register(dbPlugin)
  await app.register(authPlugin)

  await app.register(healthRoutes,    { prefix: '/api' })
  await app.register(authRoutes,      { prefix: '/api/auth' })
  await app.register(productosRoutes, { prefix: '/api/productos' })
  await app.register(clientesRoutes,  { prefix: '/api/clientes' })
  await app.register(ventasRoutes,    { prefix: '/api/ventas' })
  await app.register(usuariosRoutes,  { prefix: '/api/usuarios' })
  await app.register(syncRoutes,      { prefix: '/api/sync' })
  await app.register(gestionRoutes,   { prefix: '/api' })

  return app
}

module.exports = buildApp
