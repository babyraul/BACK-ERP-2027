'use strict'

const buildCrudRoutes = require('../core/crud.factory')
const schema = require('../db/schema')

const empresasRoutes = require('./empresas.routes')

/**
 * Archivo centralizado para todos los catálogos y tablas de Gestión Administrativa
 */
async function gestionRoutes(fastify) {
  // Configuración para Empresas (Creación en cascada y CRUD)
  fastify.register(empresasRoutes, { prefix: '/empresas' })
  
  // Configuración para Sucursales (Solo Super Admin)
  const sucursalesRoutes = require('./sucursales.routes')
  fastify.register(sucursalesRoutes, { prefix: '/sucursales' })

  // Configuración para Almacenes (Solo Super Admin)
  fastify.register(buildCrudRoutes(schema.almacenes, { requireAdmin: true }), { prefix: '/almacenes' })

  // Configuración de Módulos (Incluye autogeneración de permisos)
  const modulosRoutes = require('./modulos.routes')
  fastify.register(modulosRoutes, { prefix: '/modulos' })

  // Cajas (caja_serie_correlativo)
  const cajasRoutes = require('./cajas.routes')
  fastify.register(cajasRoutes, { prefix: '/cajas' })

  // Categorías y Subcategorías
  fastify.register(buildCrudRoutes(schema.categorias, { publicRead: true }), { prefix: '/categorias' })
  fastify.register(buildCrudRoutes(schema.subcategoria, { publicRead: true }), { prefix: '/subcategorias' })

  // Roles y Permisos
  const rolesRoutes = require('./roles.routes')
  fastify.register(rolesRoutes, { prefix: '/roles' })
  
  // Permisos (solo lectura para asignar en roles)
  fastify.register(buildCrudRoutes(schema.permisos, { 
    permissionOverride: { read: 'roles.ver' } 
  }), { prefix: '/permisos' })
}

module.exports = gestionRoutes

