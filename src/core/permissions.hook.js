'use strict'

const { db } = require('../db')
const { eq, and } = require('drizzle-orm')
const { usuario_accesos, rol_permisos, permisos } = require('../db/schema')

/**
 * Crea un hook preHandler de Fastify para verificar si el usuario tiene un permiso.
 * @param {string} permisoCodigo - El código del permiso a validar (ej: 'CREAR_EMPRESAS')
 */
function requirePermission(permisoCodigo) {
  return async function (request, reply) {
    const user = request.user
    
    // Los Super Administradores saltan la validación de permisos
    if (user.es_super_admin) {
      return
    }

    // Validación de permisos cruzando 3 tablas:
    // usuario_accesos (los roles que tiene asignados el usuario) -> rol_permisos -> permisos
    const rows = await db.select({
      codigo: permisos.codigo
    })
    .from(usuario_accesos)
    .innerJoin(rol_permisos, eq(usuario_accesos.rol_id, rol_permisos.rol_id))
    .innerJoin(permisos, eq(rol_permisos.permiso_id, permisos.id))
    .where(
      and(
        eq(usuario_accesos.usuario_id, user.id),
        eq(permisos.codigo, permisoCodigo)
      )
    )
    .limit(1)

    // Si el array está vacío, significa que ninguno de sus roles tiene este permiso
    if (rows.length === 0) {
      return reply.code(403).send({ 
        message: `Acceso denegado. Necesitas el permiso: ${permisoCodigo}` 
      })
    }
  }
}

module.exports = requirePermission
