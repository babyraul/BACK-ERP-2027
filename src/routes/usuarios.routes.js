'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const GenericService = require('../core/generic.service')
const bcrypt = require('bcrypt')

async function usuariosRoutes(fastify) {
  // Middleware Global para todas las rutas de este bloque
  // Validará automáticamente los permisos infiriéndolos de la URL (ej. usuarios.ver)
  fastify.addHook('preHandler', fastify.authorize)

  const usuariosService = new GenericService(schema.usuarios)

  fastify.get('/', async (request, reply) => {
    // ── Row-Level Security (RLS) ──
    // Obtener los IDs de usuarios que pertenecen a la empresa del usuario actual
    let safeData = []
    
    if (request.user.es_super_admin) {
      const data = await usuariosService.getAll(request.query)
      safeData = data.map(({ password, ...rest }) => rest)
    } else if (request.user.empresa_id) {
      const { eq, inArray } = require('drizzle-orm')
      // Buscar qué usuarios tienen acceso a la misma empresa
      const accesos = await db.select({ usuario_id: schema.usuario_accesos.usuario_id })
                              .from(schema.usuario_accesos)
                              .where(eq(schema.usuario_accesos.empresa_id, request.user.empresa_id))
      
      const userIds = accesos.map(a => a.usuario_id)
      
      if (userIds.length > 0) {
        const data = await db.select().from(schema.usuarios).where(inArray(schema.usuarios.id, userIds))
        safeData = data.map(({ password, ...rest }) => rest)
      }
    }
    
    return reply.code(200).send({ data: safeData })
  })

  fastify.get('/:id', async (request, reply) => {
    const data = await usuariosService.getById(request.params.id)
    if (!data) throw fastify.httpErrors.notFound(`Usuario no encontrado`)
    const { password, ...safeData } = data
    return reply.code(200).send({ data: safeData })
  })

  fastify.post('/', async (request, reply) => {
    const payload = request.body
    
    // Validate uniqueness of username
    const { eq } = require('drizzle-orm')
    const [existing] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.usuario, payload.usuario))
    if (existing) {
      return reply.code(400).send({ message: 'El nombre de usuario ya está en uso.' })
    }

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10)
    } else {
      return reply.code(400).send({ message: 'La contraseña es obligatoria para un usuario nuevo.' })
    }

    // Default current_session_id for new users to empty or placeholder
    if (!payload.current_session_id) {
      payload.current_session_id = ''
    }

    const data = await usuariosService.create(payload)
    const { password, ...safeData } = data
    return reply.code(201).send({ message: 'Usuario creado exitosamente', data: safeData })
  })

  fastify.put('/:id', async (request, reply) => {
    const payload = request.body

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10)
    } else {
      // Remove password from payload so it doesn't get updated to null/empty
      delete payload.password
    }

    // Ensure we don't accidentally update the username to an existing one
    if (payload.usuario) {
       const { eq, and, ne } = require('drizzle-orm')
       const [existing] = await db.select().from(schema.usuarios).where(
         and(
           eq(schema.usuarios.usuario, payload.usuario),
           ne(schema.usuarios.id, request.params.id)
         )
       )
       if (existing) {
         return reply.code(400).send({ message: 'El nombre de usuario ya está en uso por otra persona.' })
       }
    }

    const data = await usuariosService.update(request.params.id, payload)
    const { password, ...safeData } = data
    return reply.code(200).send({ message: 'Usuario actualizado', data: safeData })
  })

  fastify.delete('/:id', async (request, reply) => {
    const data = await usuariosService.remove(request.params.id)
    return reply.code(200).send({ message: 'Usuario eliminado', data })
  })

  // ==========================================
  // RUTAS PARA GESTIÓN DE ACCESOS (EMPRESA + SUCURSAL + ROL)
  // ==========================================

  const accesosService = new GenericService(schema.usuario_accesos)

  // Obtener accesos de un usuario con joins para mostrar nombres legibles
  fastify.get('/:id/accesos', { config: { permission: 'usuarios.accesos' } }, async (request, reply) => {
    const { eq } = require('drizzle-orm')
    const userId = request.params.id

    const rows = await db.select({
      id: schema.usuario_accesos.id,
      empresa_id: schema.usuario_accesos.empresa_id,
      branch_id: schema.usuario_accesos.branch_id,
      rol_id: schema.usuario_accesos.rol_id,
      es_predeterminado: schema.usuario_accesos.es_predeterminado,
      activo: schema.usuario_accesos.activo,
      empresa_nombre: schema.empresas.razon_social,
      sucursal_nombre: schema.sucursales.sucursal_nombre,
      direccion: schema.sucursales.direccion,
      rol_nombre: schema.roles.nombre
    })
    .from(schema.usuario_accesos)
    .leftJoin(schema.empresas, eq(schema.usuario_accesos.empresa_id, schema.empresas.id))
    .leftJoin(schema.sucursales, eq(schema.usuario_accesos.branch_id, schema.sucursales.id))
    .leftJoin(schema.roles, eq(schema.usuario_accesos.rol_id, schema.roles.id))
    .where(eq(schema.usuario_accesos.usuario_id, userId))

    return reply.code(200).send({ data: rows })
  })

  // Crear un nuevo acceso para un usuario
  fastify.post('/:id/accesos', { config: { permission: 'usuarios.accesos' } }, async (request, reply) => {
    const userId = request.params.id
    const payload = { ...request.body, usuario_id: userId }
    
    const { eq, and } = require('drizzle-orm')

    // Verificar si ya tiene un acceso para esa misma sucursal
    const [existing] = await db.select().from(schema.usuario_accesos).where(
      and(
        eq(schema.usuario_accesos.usuario_id, userId),
        eq(schema.usuario_accesos.branch_id, payload.branch_id)
      )
    )

    if (existing) {
      return reply.code(400).send({ message: 'El usuario ya tiene un acceso configurado para esta sucursal.' })
    }

    // Si es predeterminado, quitar el flag a los demás
    if (payload.es_predeterminado) {
      await db.update(schema.usuario_accesos)
        .set({ es_predeterminado: false })
        .where(eq(schema.usuario_accesos.usuario_id, userId))
    }

    const data = await accesosService.create(payload)
    return reply.code(201).send({ message: 'Acceso asignado exitosamente', data })
  })

  // Actualizar un acceso existente
  fastify.put('/:id/accesos/:accesoId', { config: { permission: 'usuarios.accesos' } }, async (request, reply) => {
    const userId = request.params.id
    const accesoId = request.params.accesoId
    const payload = request.body

    const { eq } = require('drizzle-orm')

    // Si se marca como predeterminado, quitar a los demás
    if (payload.es_predeterminado) {
      await db.update(schema.usuario_accesos)
        .set({ es_predeterminado: false })
        .where(eq(schema.usuario_accesos.usuario_id, userId))
    }

    const data = await accesosService.update(accesoId, payload)
    return reply.code(200).send({ message: 'Acceso actualizado', data })
  })

  // Eliminar un acceso
  fastify.delete('/:id/accesos/:accesoId', { config: { permission: 'usuarios.accesos' } }, async (request, reply) => {
    const data = await accesosService.remove(request.params.accesoId)
    return reply.code(200).send({ message: 'Acceso removido', data })
  })
}

module.exports = usuariosRoutes
