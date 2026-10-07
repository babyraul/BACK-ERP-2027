'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const GenericService = require('../core/generic.service')

async function modulosRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate)

  const requireSuperAdmin = async (request, reply) => {
    if (!request.user.es_super_admin) {
      return reply.code(403).send({ message: 'Acceso restringido a super administradores.' })
    }
  }

  const modulosService = new GenericService(schema.modulos)

  fastify.get('/', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const rawData = await modulosService.getAll(request.query)
    
    // Ordenar lógicamente: Padres primero según su orden, y luego sus hijos inmediatamente abajo según su orden
    const parents = rawData.filter(m => !m.padre_id).sort((a, b) => a.orden - b.orden)
    const children = rawData.filter(m => m.padre_id).sort((a, b) => a.orden - b.orden)
    
    const sortedData = []
    parents.forEach(p => {
      sortedData.push(p)
      sortedData.push(...children.filter(c => c.padre_id === p.id))
    })
    
    // Por si algún hijo quedó "huérfano" en la base de datos (inconsistencia)
    const assignedIds = new Set(sortedData.map(d => d.id))
    children.forEach(c => {
      if (!assignedIds.has(c.id)) sortedData.push(c)
    })

    return reply.code(200).send({ data: sortedData })
  })

  fastify.get('/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const data = await modulosService.getById(request.params.id)
    if (!data) throw fastify.httpErrors.notFound(`Módulo no encontrado`)
    return reply.code(200).send({ data })
  })

  fastify.post('/', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const payload = request.body
    
    try {
      const result = await db.transaction(async (tx) => {
        const [nuevoModulo] = await tx.insert(schema.modulos).values(payload).returning()
        
        // Generación automática de permisos CRUD si es un MENU
        if (nuevoModulo.tipo === 'MENU') {
          const acciones = ['ver', 'crear', 'editar', 'eliminar']
          const permisosBase = acciones.map(accion => {
            const verb = accion === 'eliminar' ? 'Inactivar' : (accion.charAt(0).toUpperCase() + accion.slice(1))
            return {
              modulo_id: nuevoModulo.id,
              codigo: `${nuevoModulo.codigo.toLowerCase()}.${accion}`,
              nombre: `${verb} ${nuevoModulo.nombre.toLowerCase()}`,
              descripcion: `Permiso para ${verb.toLowerCase()} en ${nuevoModulo.nombre}`
            }
          })
          
          await tx.insert(schema.permisos).values(permisosBase)
        }
        
        return nuevoModulo
      })
      
      return reply.code(201).send({ message: 'Módulo creado exitosamente', data: result })
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ message: 'Error al crear el módulo', error: error.message })
    }
  })

  fastify.put('/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    // Si cambia de tipo a MENU podríamos crear los permisos si no existen, pero lo dejamos simple por ahora.
    const data = await modulosService.update(request.params.id, request.body)
    return reply.code(200).send({ message: 'Módulo actualizado', data })
  })

  fastify.delete('/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const data = await modulosService.remove(request.params.id)
    return reply.code(200).send({ message: 'Módulo eliminado', data })
  })

  // Sincronizador de permisos base para menús existentes (Backfill)
  fastify.post('/sync-permisos', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { eq } = require('drizzle-orm')
    
    try {
      let creados = 0
      await db.transaction(async (tx) => {
        const menus = await tx.select().from(schema.modulos).where(eq(schema.modulos.tipo, 'MENU'))
        const permisosActuales = await tx.select().from(schema.permisos)
        
        for (const menu of menus) {
          const acciones = ['ver', 'crear', 'editar', 'eliminar']
          for (const accion of acciones) {
            const codigoBuscado = `${menu.codigo.toLowerCase()}.${accion}`
            const existe = permisosActuales.find(p => p.codigo === codigoBuscado)
            
            const verb = accion === 'eliminar' ? 'Inactivar' : (accion.charAt(0).toUpperCase() + accion.slice(1))
            const nombreGenerado = `${verb} ${menu.nombre.toLowerCase()}`

            if (!existe) {
              await tx.insert(schema.permisos).values({
                modulo_id: menu.id,
                codigo: codigoBuscado,
                nombre: nombreGenerado,
                descripcion: `Permiso automático de sincronización para ${verb.toLowerCase()}`
              })
              creados++
            } else if (accion === 'eliminar' && existe.nombre.startsWith('Eliminar')) {
              // Update existing "Eliminar" names to "Inactivar"
              await tx.update(schema.permisos)
                .set({ nombre: nombreGenerado, descripcion: `Permiso automático de sincronización para ${verb.toLowerCase()}` })
                .where(eq(schema.permisos.id, existe.id))
            }
          }
        }
      })
      return reply.code(200).send({ message: `Sincronización completada. ${creados} permisos creados.` })
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ message: 'Error al sincronizar permisos', error: error.message })
    }
  })
}

module.exports = modulosRoutes
