'use strict'

require('dotenv').config()

const buildApp = require('./src/app')
const PreventasExpirationWorker = require('./src/workers/preventasExpirationWorker')

const PORT = Number(process.env.PORT) || 5000
const HOST = '0.0.0.0'

async function main() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`🚀 SERVER_NUBE corriendo en http://${HOST}:${PORT}`)

    // Iniciar worker de expiración automática de pre-ventas (1h general, 3h mesas/delivery)
    const expirationWorker = new PreventasExpirationWorker(app.log)
    expirationWorker.start()

    process.on('SIGINT', () => {
      expirationWorker.stop()
      process.exit(0)
    })
    process.on('SIGTERM', () => {
      expirationWorker.stop()
      process.exit(0)
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
