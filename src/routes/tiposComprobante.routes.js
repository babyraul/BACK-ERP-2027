'use strict'

const buildCrudRoutes = require('../core/crud.factory')
const schema = require('../db/schema')

async function tiposComprobanteRoutes(fastify) {
  // Catálogo de lectura global
  const crud = buildCrudRoutes(schema.tipo_comprobante, {
    permissionOverride: {
      GET: 'cajas.ver' // Permite a cualquiera con permiso de ver cajas poder ver este catálogo
    }
  })
  await crud(fastify)
}

module.exports = tiposComprobanteRoutes
