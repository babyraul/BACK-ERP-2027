'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const GenericService = require('../core/generic.service')

async function rolesRoutes(fastify) {
  // Middleware Global para todas las rutas de este bloque
  // Validará automáticamente los permisos infiriéndolos de la URL (ej. roles.ver)
  fastify.addHook('preHandler', fastify.authorize)

  const rolesService = new GenericService(schema.roles)

  // GET /roles
  fastify.get('/', async (request, reply) => {
    const { eq, or, isNull, gt, and } = require('drizzle-orm')
    let baseQuery = db.select().from(schema.roles)
    
    // ── Row-Level Security (RLS) ──
    if (!request.user.es_super_admin) {
      const conditions = [
        or(
          eq(schema.roles.empresa_id, request.user.empresa_id),
          isNull(schema.roles.empresa_id) // roles del sistema
        )
      ]

      // Jerarquía de roles: No puede ver roles de nivel igual o superior al suyo (menor o igual numéricamente)
      if (request.user.rol_nivel !== undefined) {
        conditions.push(gt(schema.roles.nivel, request.user.rol_nivel))
      }

      baseQuery = baseQuery.where(and(...conditions))
    }
    
    const data = await baseQuery
    return reply.code(200).send({ data })
  })

  // GET /roles/:id
  fastify.get('/:id', async (request, reply) => {
    const data = await rolesService.getById(request.params.id)
    if (!data) throw fastify.httpErrors.notFound(`Rol no encontrado`)
    return reply.code(200).send({ data })
  })

  // POST /roles
  fastify.post('/', async (request, reply) => {
    const payload = request.body
    if (!request.user.es_super_admin && request.user.rol_nivel !== undefined) {
      if (payload.nivel <= request.user.rol_nivel) {
        return reply.code(403).send({ message: 'No puedes crear un rol con un nivel igual o superior al tuyo.' })
      }
    }
    const data = await rolesService.create(payload)
    return reply.code(201).send({ message: 'Rol creado', data })
  })

  // PUT /roles/:id
  fastify.put('/:id', async (request, reply) => {
    const existing = await rolesService.getById(request.params.id)
    if (!existing) throw fastify.httpErrors.notFound(`Rol no encontrado`)

    if (!request.user.es_super_admin && request.user.rol_nivel !== undefined) {
      if (existing.nivel <= request.user.rol_nivel) {
        return reply.code(403).send({ message: 'No puedes modificar un rol de nivel igual o superior al tuyo.' })
      }
      if (request.body.nivel !== undefined && request.body.nivel <= request.user.rol_nivel) {
        return reply.code(403).send({ message: 'No puedes asignar un nivel igual o superior al tuyo.' })
      }
    }

    const data = await rolesService.update(request.params.id, request.body)
    return reply.code(200).send({ message: 'Rol actualizado', data })
  })

  // DELETE /roles/:id
  fastify.delete('/:id', async (request, reply) => {
    const existing = await rolesService.getById(request.params.id)
    if (!existing) throw fastify.httpErrors.notFound(`Rol no encontrado`)

    if (!request.user.es_super_admin && request.user.rol_nivel !== undefined) {
      if (existing.nivel <= request.user.rol_nivel) {
        return reply.code(403).send({ message: 'No puedes eliminar un rol de nivel igual o superior al tuyo.' })
      }
    }

    const data = await rolesService.remove(request.params.id)
    return reply.code(200).send({ message: 'Rol eliminado', data })
  })

  // GET /roles/:id/permisos
  fastify.get('/:id/permisos', { config: { permission: 'roles.ver' } }, async (request, reply) => {
    const { eq } = require('drizzle-orm')
    const rolId = request.params.id
    
    const records = await db
      .select({ permiso_id: schema.rol_permisos.permiso_id })
      .from(schema.rol_permisos)
      .where(eq(schema.rol_permisos.rol_id, rolId))
      
    const permisosIds = records.map(r => r.permiso_id)
    return reply.code(200).send({ data: permisosIds })
  })

  // POST /roles/:id/permisos
  fastify.post('/:id/permisos', { config: { permission: 'roles.editar' } }, async (request, reply) => {
    const { eq } = require('drizzle-orm')
    const rolId = request.params.id
    const { permisosIds } = request.body // Array de UUIDs
    
    // Validación de Jerarquía
    const existing = await rolesService.getById(rolId)
    if (!existing) throw fastify.httpErrors.notFound(`Rol no encontrado`)

    if (!request.user.es_super_admin && request.user.rol_nivel !== undefined) {
      if (existing.nivel <= request.user.rol_nivel) {
        return reply.code(403).send({ message: 'No puedes modificar los permisos de un rol de nivel igual o superior al tuyo.' })
      }
    }

    try {
      await db.transaction(async (tx) => {
        // 1. Eliminar permisos actuales del rol
        await tx.delete(schema.rol_permisos)
          .where(eq(schema.rol_permisos.rol_id, rolId))
          
        // 2. Insertar los nuevos permisos
        if (permisosIds && permisosIds.length > 0) {
          const insertData = permisosIds.map(permisoId => ({
            rol_id: rolId,
            permiso_id: permisoId
          }))
          await tx.insert(schema.rol_permisos).values(insertData)
        }
      })
      
      return reply.code(200).send({ message: 'Permisos asignados correctamente al rol' })
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ message: 'Error al asignar permisos al rol', error: error.message })
    }
  })
}

module.exports = rolesRoutes
