'use strict'

require('dotenv').config()
const Fastify = require('fastify')

const authPlugin = require('./plugins/auth')
const dbPlugin = require('./plugins/db')
const corsPlugin = require('./plugins/cors')
const sensiblePlugin = require('./plugins/sensible')

const healthRoutes = require('./routes/health.routes')
const authRoutes = require('./modules/auth/auth.routes')
const productosRoutes = require('./modules/productos/productos.routes')
const clientesRoutes = require('./modules/clientes/clientes.routes')
const ventasRoutes = require('./modules/ventas/ventas.routes')
const usuariosRoutes = require('./modules/manager/usuarios.routes')
const syncRoutes = require('./routes/sync.routes')
const gestionRoutes = require('./modules/manager/gestion.routes')
const utilsRoutes = require('./routes/utils.routes')
const tablasFijasRoutes = require('./routes/tablasFijas.routes')
const proveedoresRoutes = require('./modules/proveedores/proveedores.routes')
const preventasRoutes = require('./modules/ventas/preventas.routes')
const stockRoutes = require('./modules/stock/stock.routes')
const combosRoutes = require('./modules/combos/combos.routes')

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

  await app.register(healthRoutes, { prefix: '/api' })
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(productosRoutes, { prefix: '/api/productos' })
  await app.register(clientesRoutes, { prefix: '/api/clientes' })
  await app.register(preventasRoutes, { prefix: '/api/preventas' })
  await app.register(ventasRoutes, { prefix: '/api/ventas' })
  await app.register(usuariosRoutes, { prefix: '/api/usuarios' })
  await app.register(syncRoutes, { prefix: '/api/sync' })
  await app.register(gestionRoutes, { prefix: '/api' })
  await app.register(utilsRoutes, { prefix: '/api/utils' })
  await app.register(tablasFijasRoutes, { prefix: '/api' })
  await app.register(proveedoresRoutes, { prefix: '/api/proveedores' })
  await app.register(stockRoutes, { prefix: '/api/stock' })
  await app.register(combosRoutes, { prefix: '/api/combos' })

  return app
}

module.exports = buildApp
