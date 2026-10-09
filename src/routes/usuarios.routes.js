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
      const { eq, inArray, lt, lte } = require('drizzle-orm')
      
      // 1. Encontrar todos los usuarios de la empresa
      const accesos = await db.select({ 
                                usuario_id: schema.usuario_accesos.usuario_id,
                                rol_id: schema.usuario_accesos.rol_id 
                              })
                              .from(schema.usuario_accesos)
                              .where(eq(schema.usuario_accesos.empresa_id, request.user.empresa_id))
      
      // 2. Extraer roles para determinar sus niveles
      const rolIds = [...new Set(accesos.map(a => a.rol_id).filter(Boolean))]
      const rolesData = rolIds.length > 0 
          ? await db.select({ id: schema.roles.id, nivel: schema.roles.nivel }).from(schema.roles).where(inArray(schema.roles.id, rolIds))
          : []
      
      const rolNivelMap = {}
      rolesData.forEach(r => rolNivelMap[r.id] = r.nivel)

      // 3. Agrupar el mejor nivel (mínimo número) de cada usuario
      const userMinLevel = {}
      for (const acc of accesos) {
         if (!acc.rol_id) continue
         const nivel = rolNivelMap[acc.rol_id] ?? 999
         if (!userMinLevel[acc.usuario_id] || nivel < userMinLevel[acc.usuario_id]) {
             userMinLevel[acc.usuario_id] = nivel
         }
      }

      // 4. Filtrar usuarios: Solo aquellos cuyo mejor rol sea estrictamente INFERIOR al nuestro (mayor número)
      let userIds = []
      if (request.user.rol_nivel !== undefined) {
         userIds = Object.keys(userMinLevel).filter(uid => userMinLevel[uid] > request.user.rol_nivel)
      } else {
         userIds = Object.keys(userMinLevel)
      }
      
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
    const { empresa_id, branch_id, rol_id, ...userPayload } = request.body
    
    // Validate uniqueness of username
    const { eq } = require('drizzle-orm')
    const [existing] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.usuario, userPayload.usuario))
    if (existing) {
      return reply.code(400).send({ message: 'El nombre de usuario ya está en uso.' })
    }

    if (userPayload.password) {
      userPayload.password = await bcrypt.hash(userPayload.password, 10)
    } else {
      return reply.code(400).send({ message: 'La contraseña es obligatoria para un usuario nuevo.' })
    }

    // Default current_session_id for new users to a unique placeholder
    if (!userPayload.current_session_id) {
      userPayload.current_session_id = require('crypto').randomUUID()
    }

    // Validación de Jerarquía para el acceso inicial
    let targetRol = null
    if (rol_id) {
      const [rol] = await db.select().from(schema.roles).where(eq(schema.roles.id, rol_id))
      targetRol = rol
      if (!request.user.es_super_admin && request.user.rol_nivel !== undefined) {
        if (!targetRol) return reply.code(400).send({ message: 'Rol inválido.' })
        if (targetRol.nivel <= request.user.rol_nivel) {
          return reply.code(403).send({ message: 'No puedes asignar un rol de nivel igual o superior al tuyo.' })
        }
      }
    }

    try {
      const result = await db.transaction(async (tx) => {
        // 1. Insertar el usuario
        const [newUser] = await tx.insert(schema.usuarios).values(userPayload).returning()

        // 2. Insertar el acceso inicial si se proporcionaron los datos
        if (empresa_id && branch_id && rol_id) {
          await tx.insert(schema.usuario_accesos).values({
            usuario_id: newUser.id,
            empresa_id,
            branch_id,
            rol_id,
            es_predeterminado: true,
            activo: true
          })
        }

        return newUser
      })

      const { password, ...safeData } = result
      return reply.code(201).send({ message: 'Usuario creado exitosamente', data: safeData })
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ message: 'Error al crear el usuario', error: error.message })
    }
  })

  fastify.put('/:id', async (request, reply) => {
    const { empresa_id, branch_id, rol_id, ...payload } = request.body

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
  fastify.get('/:id/accesos', { config: { permission: 'usuarios.ver' } }, async (request, reply) => {
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
  fastify.post('/:id/accesos', { config: { permission: 'usuarios.editar' } }, async (request, reply) => {
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

    // Validación de Jerarquía: No puede asignar un rol de nivel igual o superior al suyo
    if (!request.user.es_super_admin && request.user.rol_nivel !== undefined) {
      const [targetRol] = await db.select().from(schema.roles).where(eq(schema.roles.id, payload.rol_id))
      if (!targetRol) return reply.code(400).send({ message: 'Rol inválido.' })
      if (targetRol.nivel <= request.user.rol_nivel) {
        return reply.code(403).send({ message: 'No puedes asignar un rol de nivel igual o superior al tuyo.' })
      }
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
  fastify.put('/:id/accesos/:accesoId', { config: { permission: 'usuarios.editar' } }, async (request, reply) => {
    const userId = request.params.id
    const accesoId = request.params.accesoId
    const payload = request.body

    const { eq } = require('drizzle-orm')

    // Validación de Jerarquía
    if (!request.user.es_super_admin && request.user.rol_nivel !== undefined) {
      const accesoActual = await accesosService.getById(accesoId)
      if (!accesoActual) return reply.code(404).send({ message: 'Acceso no encontrado.' })

      const [rolActual] = await db.select().from(schema.roles).where(eq(schema.roles.id, accesoActual.rol_id))
      if (rolActual && rolActual.nivel <= request.user.rol_nivel) {
        return reply.code(403).send({ message: 'No puedes modificar un acceso que tiene un rol de nivel igual o superior al tuyo.' })
      }

      if (payload.rol_id && payload.rol_id !== accesoActual.rol_id) {
        const [nuevoRol] = await db.select().from(schema.roles).where(eq(schema.roles.id, payload.rol_id))
        if (nuevoRol && nuevoRol.nivel <= request.user.rol_nivel) {
          return reply.code(403).send({ message: 'No puedes asignar un rol de nivel igual o superior al tuyo.' })
        }
      }
    }

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
  fastify.delete('/:id/accesos/:accesoId', { config: { permission: 'usuarios.editar' } }, async (request, reply) => {
    // Validación de Jerarquía
    if (!request.user.es_super_admin && request.user.rol_nivel !== undefined) {
      const accesoActual = await accesosService.getById(request.params.accesoId)
      if (!accesoActual) return reply.code(404).send({ message: 'Acceso no encontrado.' })

      const { eq } = require('drizzle-orm')
      const [rolActual] = await db.select().from(schema.roles).where(eq(schema.roles.id, accesoActual.rol_id))
      if (rolActual && rolActual.nivel <= request.user.rol_nivel) {
        return reply.code(403).send({ message: 'No puedes eliminar un acceso de nivel igual o superior al tuyo.' })
      }
    }

    const data = await accesosService.remove(request.params.accesoId)
    return reply.code(200).send({ message: 'Acceso removido', data })
  })
}

module.exports = usuariosRoutes
