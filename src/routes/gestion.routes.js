'use strict'

const buildCrudRoutes = require('../core/crud.factory')
const schema = require('../db/schema')

/**
 * Archivo centralizado para todos los catálogos y tablas de Gestión Administrativa
 */
async function gestionRoutes(fastify) {
  // Configuración para Empresas (Solo Super Admin)
  fastify.register(buildCrudRoutes(schema.empresas, { requireAdmin: true }), { prefix: '/empresas' })
  
  // Configuración para Sucursales (Solo Super Admin)
  fastify.register(buildCrudRoutes(schema.sucursales, { requireAdmin: true }), { prefix: '/sucursales' })

  // Configuración de Módulos (Validación estricta y protección por RBAC granular)
  const modulosOpts = {
    // Si quieres que un Vendedor no pueda borrar módulos, le exiges el permiso específico:
    permissions: {
      read:   'LEER_MODULOS',
      create: 'CREAR_MODULOS',
      update: 'EDITAR_MODULOS',
      delete: 'ELIMINAR_MODULOS'
    },
    // Inyectamos la validación Fastify JSON Schema para cuando alguien haga POST
    schemas: {
      create: {
        body: {
          type: 'object',
          required: ['codigo', 'nombre'],
          properties: {
            codigo: { type: 'string' },
            nombre: { type: 'string' },
            descripcion: { type: 'string' }
          }
        }
      }
    }
  }
  fastify.register(buildCrudRoutes(schema.modulos, modulosOpts), { prefix: '/modulos' })

  // Roles y Permisos (Por ahora solo admins)
  fastify.register(buildCrudRoutes(schema.roles, { requireAdmin: true }),      { prefix: '/roles' })
  fastify.register(buildCrudRoutes(schema.permisos, { requireAdmin: true }),   { prefix: '/permisos' })
}

module.exports = gestionRoutes

