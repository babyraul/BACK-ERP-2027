'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const GenericService = require('../core/generic.service')

async function empresasRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate)

  // Bloqueo para superadmin
  const requireSuperAdmin = async (request, reply) => {
    if (!request.user.es_super_admin) {
      return reply.code(403).send({ message: 'Acceso restringido a super administradores.' })
    }
  }

  const empresasService = new GenericService(schema.empresas)

  // GET /empresas
  fastify.get('/', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { eq } = require('drizzle-orm')
    
    const rawData = await db
      .select({
        empresa: schema.empresas,
        ubigeo: schema.ubigeo
      })
      .from(schema.empresas)
      .leftJoin(schema.ubigeo, eq(schema.empresas.ubigeo, schema.ubigeo.codigo))

    const data = rawData.map(row => ({
      ...row.empresa,
      ubigeo_descripcion: row.ubigeo 
        ? `${row.ubigeo.departamento}, ${row.ubigeo.provincia}, ${row.ubigeo.distrito}`
        : null
    }))
    
    return reply.code(200).send({ data })
  })

  // GET /empresas/:id
  fastify.get('/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const data = await empresasService.getById(request.params.id)
    if (!data) throw fastify.httpErrors.notFound(`Empresa no encontrada`)
    return reply.code(200).send({ data })
  })

  // POST /empresas (Creación en Cascada: Empresa -> Sucursal -> Almacén)
  fastify.post('/', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const datosEmpresa = request.body

    try {
      const result = await db.transaction(async (tx) => {
        // 1. Crear Empresa
        const [nuevaEmpresa] = await tx.insert(schema.empresas).values({
          ruc: datosEmpresa.ruc,
          razon_social: datosEmpresa.razon_social,
          nombre_comercial: datosEmpresa.nombre_comercial,
          direccion: datosEmpresa.direccion,
          ubigeo: datosEmpresa.ubigeo,
          telefono1: datosEmpresa.telefono1,
          email1: datosEmpresa.email1,
        }).returning()

        // 2. Crear Sucursal Principal
        const [nuevaSucursal] = await tx.insert(schema.sucursales).values({
          empresa_id: nuevaEmpresa.id,
          ruc: nuevaEmpresa.ruc,
          razon_social: nuevaEmpresa.razon_social,
          nombre_comercial: nuevaEmpresa.nombre_comercial,
          sucursal_nombre: "SEDE PRINCIPAL",
          direccion: nuevaEmpresa.direccion,
          ubigeo: nuevaEmpresa.ubigeo,
        }).returning()

        // 3. Crear Almacén Principal
        const [nuevoAlmacen] = await tx.insert(schema.almacenes).values({
          branch_id: nuevaSucursal.id,
          nombre: "ALMACÉN PRINCIPAL",
          direccion: nuevaSucursal.direccion,
          es_principal: true,
        }).returning()

        return { empresa: nuevaEmpresa, sucursal: nuevaSucursal, almacen: nuevoAlmacen }
      })

      return reply.code(201).send({ message: 'Empresa, Sucursal y Almacén creados correctamente', data: result.empresa })
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ message: 'Error al crear la empresa en cascada', error: error.message })
    }
  })

  // PUT /empresas/:id
  fastify.put('/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const data = await empresasService.update(request.params.id, request.body)
    return reply.code(200).send({ message: 'Empresa actualizada', data })
  })

  // DELETE /empresas/:id
  fastify.delete('/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const data = await empresasService.remove(request.params.id)
    return reply.code(200).send({ message: 'Empresa eliminada', data })
  })

  // GET /empresas/:id/modulos
  fastify.get('/:id/modulos', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { eq } = require('drizzle-orm')
    const empresaId = request.params.id
    
    const records = await db
      .select({ modulo_id: schema.empresa_modulos.modulo_id })
      .from(schema.empresa_modulos)
      .where(eq(schema.empresa_modulos.empresa_id, empresaId))
      
    // Devolvemos solo un array de IDs para facilitar el chequeo en el frontend
    const modulosIds = records.map(r => r.modulo_id)
    return reply.code(200).send({ data: modulosIds })
  })

  // POST /empresas/:id/modulos
  fastify.post('/:id/modulos', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { eq } = require('drizzle-orm')
    const empresaId = request.params.id
    const { modulosIds } = request.body // Array de UUIDs
    
    try {
      await db.transaction(async (tx) => {
        // 1. Eliminar módulos actuales de la empresa
        await tx.delete(schema.empresa_modulos)
          .where(eq(schema.empresa_modulos.empresa_id, empresaId))
          
        // 2. Insertar los nuevos módulos
        if (modulosIds && modulosIds.length > 0) {
          const insertData = modulosIds.map(moduloId => ({
            empresa_id: empresaId,
            modulo_id: moduloId,
            activo: true
          }))
          await tx.insert(schema.empresa_modulos).values(insertData)
        }
      })
      
      return reply.code(200).send({ message: 'Módulos asignados correctamente' })
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ message: 'Error al asignar módulos a la empresa', error: error.message })
    }
  })
}

module.exports = empresasRoutes
