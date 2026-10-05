'use strict'

require('dotenv').config()

const buildApp = require('./src/app')

const PORT = Number(process.env.PORT) || 5000
const HOST = '0.0.0.0'

async function main() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`🚀 SERVER_NUBE corriendo en http://${HOST}:${PORT}`)
    // SERVER_NUBE NO inicia Sync Worker. Solo espera conexiones.
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

process.on('SIGINT',  () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

main()
