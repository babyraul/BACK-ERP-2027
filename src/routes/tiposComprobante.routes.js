'use strict'

const buildCrudRoutes = require('../core/crud.factory')
const schema = require('../db/schema')

async function tiposComprobanteRoutes(fastify) {
  // Catálogo maestro SUNAT: lectura libre para cualquier usuario autenticado
  const crud = buildCrudRoutes(schema.tipo_comprobante, {
    publicRead: true
  })
  await crud(fastify)
}

module.exports = tiposComprobanteRoutes
