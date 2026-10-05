'use strict'

/** Rutas CRUD — Usuarios  [JWT protegidas, solo rol admin] */
async function usuariosRoutes(fastify) {
  const auth      = { preHandler: [fastify.authenticate] }
  const adminOnly = {
    preHandler: [
      fastify.authenticate,
      async (request, reply) => {
        if (request.user.rol !== 'admin') {
          return reply.code(403).send({ message: 'Acceso restringido a administradores.' })
        }
      },
    ],
  }

  fastify.get('/',    auth,      async (request) => {
    // TODO: DB → SELECT id, email, nombre, rol, estado, ultimo_acceso
    return { data: [] }
  })

  fastify.get('/:id', auth, async (request, reply) => {
    return reply.notFound(`Usuario ${request.params.id} no encontrado.`)
  })

  fastify.post('/', {
    ...adminOnly,
    schema: {
      body: {
        type: 'object',
        required: ['email', 'nombre', 'password', 'rol'],
        properties: {
          email:    { type: 'string', format: 'email' },
          nombre:   { type: 'string' },
          password: { type: 'string', minLength: 6 },
          rol:      { type: 'string', enum: ['admin', 'vendedor', 'almacenero', 'contador'] },
        },
      },
    },
  }, async (request, reply) => {
    const bcrypt = require('bcrypt')
    const hash   = await bcrypt.hash(request.body.password, 10)
    // TODO: DB → INSERT INTO usuarios (email, nombre, password_hash, rol)
    return reply.code(201).send({ message: 'Usuario creado.' })
  })

  fastify.put('/:id', adminOnly, async (request) => {
    // TODO: DB → UPDATE usuarios SET ...
    return { message: `Usuario ${request.params.id} actualizado.` }
  })

  fastify.delete('/:id', adminOnly, async (request) => {
    // TODO: DB → UPDATE usuarios SET deleted_at = now()
    return { message: `Usuario ${request.params.id} eliminado.` }
  })
}

module.exports = usuariosRoutes
