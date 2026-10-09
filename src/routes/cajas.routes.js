'use strict'

const buildCrudRoutes = require('../core/crud.factory')
const schema = require('../db/schema')

/**
 * Rutas CRUD — Cajas (caja_serie_correlativo)
 * 
 * Generadas dinámicamente mediante crud.factory.js.
 * Utiliza RLS por branch_id automáticamente.
 */
async function cajasRoutes(fastify) {
  // El factory injecta automáticamente la protección JWT, authorize() y RLS.
  // Permisos requeridos automáticamente: cajas.ver, cajas.crear, cajas.editar, cajas.eliminar
  const crud = buildCrudRoutes(schema.caja_serie_correlativo)
  await crud(fastify)
}

module.exports = cajasRoutes
