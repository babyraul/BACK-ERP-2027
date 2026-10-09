'use strict'

const GenericService = require('./generic.service')
const requirePermission = require('./permissions.hook')

/**
 * Construye dinámicamente rutas CRUD para cualquier tabla de Drizzle ORM
 * @param {Object} table Objeto del Schema (ej: schema.empresas)
 * @param {Object} options Configuración de seguridad y esquemas 
 *                         (ej: { requireAdmin: true, permissions: { create: 'CREAR_EMP' }, schemas: { create: {...} } })
 */
function buildCrudRoutes(table, options = {}) {
  const service = new GenericService(table)

  return async function (fastify) {
    // Asegurar JWT en todas las rutas generadas
    fastify.addHook('preHandler', fastify.authenticate)

    // Middleware Global para todas las rutas generadas en este CRUD
    // Validará automáticamente los permisos infiriéndolos de la URL
    fastify.addHook('preHandler', fastify.authorize)

    // Helper para generar el arreglo de preHandlers adicionales (opcional)
    const getPreHandlers = (action) => {
      const handlers = []
      // Validación RBAC granular por código de permiso (si se requiere forzar uno específico)
      if (options.permissions && options.permissions[action]) {
        handlers.push(requirePermission(options.permissions[action]))
      }
      return handlers
    }

    const schemas = options.schemas || {}
    const permissionOverride = options.permissionOverride || {}

    // GET /
    fastify.get('/', { preHandler: getPreHandlers('read'), schema: schemas.read, config: { permission: permissionOverride.read } }, async (request, reply) => {
      const query = { ...request.query }
      
      // ── Row-Level Security (RLS) Genérica ──
      // Inyectar filtros de aislamiento si no es super admin y la tabla lo soporta
      if (!request.user.es_super_admin) {
        if (table.empresa_id && request.user.empresa_id) {
          query.empresa_id = request.user.empresa_id
        }
        if (table.branch_id && request.user.branch_id) {
          query.branch_id = request.user.branch_id
        }
      }

      const data = await service.getAll(query)
      return reply.code(200).send({ data })
    })

    // GET /:id
    fastify.get('/:id', { preHandler: getPreHandlers('read'), schema: schemas.read, config: { permission: permissionOverride.read } }, async (request, reply) => {
      const { id } = request.params
      const data = await service.getById(id)
      if (!data) throw fastify.httpErrors.notFound(`Registro no encontrado`)
      return reply.code(200).send({ data })
    })

    // POST /
    fastify.post('/', { preHandler: getPreHandlers('create'), schema: schemas.create, config: { permission: permissionOverride.create } }, async (request, reply) => {
      const payload = { ...request.body }
      
      // Auto-completar contexto (RLS)
      if (!request.user.es_super_admin) {
        if (table.empresa_id && !payload.empresa_id && request.user.empresa_id) {
          payload.empresa_id = request.user.empresa_id
        }
        if (table.branch_id && !payload.branch_id && request.user.branch_id) {
          payload.branch_id = request.user.branch_id
        }
      }

      const data = await service.create(payload)
      return reply.code(201).send({ message: 'Registro creado exitosamente', data })
    })

    // PUT /:id
    fastify.put('/:id', { preHandler: getPreHandlers('update'), schema: schemas.update, config: { permission: permissionOverride.update } }, async (request, reply) => {
      const { id } = request.params
      const existing = await service.getById(id)
      if (!existing) throw fastify.httpErrors.notFound(`Registro no encontrado`)
      
      const data = await service.update(id, request.body)
      return reply.code(200).send({ message: 'Registro actualizado', data })
    })

    // DELETE /:id
    fastify.delete('/:id', { preHandler: getPreHandlers('delete'), schema: schemas.delete, config: { permission: permissionOverride.delete } }, async (request, reply) => {
      const { id } = request.params
      const existing = await service.getById(id)
      if (!existing) throw fastify.httpErrors.notFound(`Registro no encontrado`)
      
      const data = await service.remove(id)
      return reply.code(200).send({ message: 'Registro eliminado/dado de baja', data })
    })
  }
}

module.exports = buildCrudRoutes

