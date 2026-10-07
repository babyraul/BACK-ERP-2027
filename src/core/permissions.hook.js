'use strict'

const { db } = require('../db')
const { eq, and } = require('drizzle-orm')
const { usuario_accesos, rol_permisos, permisos } = require('../db/schema')
const { sql } = require('drizzle-orm')

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

    const activeEmpresaId = request.headers['x-empresa-id']
    const activeBranchId = request.headers['x-branch-id']

    // Validar autorización cruzando todas las reglas
    // 1. Validar que la empresa tenga el módulo raíz habilitado
    // 2. Validar que el usuario tenga acceso a la empresa/sucursal
    // 3. Validar que el rol del usuario tenga el permiso (o por excepciones)
    
    const query = sql`
      WITH RECURSIVE module_tree AS (
        -- Encontramos el módulo inicial asociado al permiso
        SELECT m.id, m.padre_id 
        FROM modulos m
        INNER JOIN permisos p ON p.modulo_id = m.id
        WHERE p.codigo = ${permisoCodigo}
        
        UNION ALL
        
        -- Buscamos hacia arriba hasta llegar al módulo raíz
        SELECT m.id, m.padre_id 
        FROM modulos m
        INNER JOIN module_tree mt ON m.id = mt.padre_id
      ),
      root_module AS (
        SELECT id FROM module_tree WHERE padre_id IS NULL LIMIT 1
      )
      SELECT ua.id 
      FROM usuario_accesos ua
      INNER JOIN rol_permisos rp ON ua.rol_id = rp.rol_id
      INNER JOIN permisos p ON rp.permiso_id = p.id
      -- Verificamos que la empresa tiene el módulo raíz habilitado
      INNER JOIN empresa_modulos em ON em.empresa_id = ua.empresa_id 
        AND em.modulo_id = (SELECT id FROM root_module)
      WHERE ua.usuario_id = ${user.id}
        AND ua.activo = true
        AND em.activo = true
        AND p.codigo = ${permisoCodigo}
        ${activeEmpresaId ? sql`AND ua.empresa_id = ${activeEmpresaId}` : sql``}
        ${activeBranchId ? sql`AND ua.branch_id = ${activeBranchId}` : sql``}
      LIMIT 1
    `

    const result = await db.execute(query)

    if (result.length === 0) {
      return reply.code(403).send({ 
        message: `Acceso denegado al permiso: ${permisoCodigo}. Módulo deshabilitado o sin autorización en la sucursal actual.` 
      })
    }
  }
}

module.exports = requirePermission
