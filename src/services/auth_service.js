'use strict'

const bcrypt = require('bcrypt')
const { db } = require('../db')
const { usuarios, usuario_accesos, empresas, sucursales, roles } = require('../db/schema')
const { eq, and } = require('drizzle-orm')

/**
 * Servicio de autenticación real conectado a la BD.
 */

// Almacén temporal de refresh tokens (reemplazar con tabla DB o Redis en el futuro)
const refreshTokenStore = new Map()

async function login(fastify, usuario, password) {
  // Buscar en BD
  const [user] = await db.select().from(usuarios).where(eq(usuarios.usuario, usuario));

  if (!user || !user.activo || user.bloqueado) {
    throw fastify.httpErrors.unauthorized('Credenciales incorrectas o usuario inactivo.')
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    // Podríamos registrar un intento fallido aquí
    throw fastify.httpErrors.unauthorized('Credenciales incorrectas.')
  }

  let active_acceso = null
  let accesosList = []
  
  if (!user.es_super_admin) {
    accesosList = await db.select({
      id: usuario_accesos.id,
      empresa_id: usuario_accesos.empresa_id,
      branch_id: usuario_accesos.branch_id,
      rol_id: usuario_accesos.rol_id,
      es_predeterminado: usuario_accesos.es_predeterminado,
      empresa_nombre: empresas.razon_social,
      sucursal_nombre: sucursales.nombre_comercial,
      rol_nombre: roles.nombre
    })
    .from(usuario_accesos)
    .innerJoin(empresas, eq(usuario_accesos.empresa_id, empresas.id))
    .innerJoin(sucursales, eq(usuario_accesos.branch_id, sucursales.id))
    .innerJoin(roles, eq(usuario_accesos.rol_id, roles.id))
    .where(and(eq(usuario_accesos.usuario_id, user.id), eq(usuario_accesos.activo, true)))

    if (accesosList.length === 0) {
      throw fastify.httpErrors.unauthorized('El usuario no tiene ninguna sucursal asignada.')
    }

    active_acceso = accesosList.find(a => a.es_predeterminado) || accesosList[0]
  }

  const payload = { 
    id: user.id, 
    usuario: user.usuario, 
    es_super_admin: user.es_super_admin,
    empresa_id: active_acceso?.empresa_id,
    branch_id: active_acceso?.branch_id,
    rol_id: active_acceso?.rol_id
  }

  const access_token = fastify.jwt.sign(payload)

  const refresh_token = fastify.jwt.sign(
    { id: user.id, type: 'refresh' },
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  )

  refreshTokenStore.set(user.id, refresh_token)

  return {
    access_token,
    refresh_token,
    user: { 
      id: user.id, 
      usuario: user.usuario, 
      nombre: user.nombre, 
      es_super_admin: user.es_super_admin,
      active_acceso,
      accesos: accesosList
    },
  }
}

async function refresh(fastify, refreshToken) {
  let payload
  try {
    payload = fastify.jwt.verify(refreshToken)
  } catch {
    throw fastify.httpErrors.unauthorized('Refresh token inválido o expirado.')
  }

  if (payload.type !== 'refresh') {
    throw fastify.httpErrors.unauthorized('Token no es de tipo refresh.')
  }

  const stored = refreshTokenStore.get(payload.id)
  if (stored !== refreshToken) {
    throw fastify.httpErrors.unauthorized('Refresh token no reconocido.')
  }

  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, payload.id));

  if (!user || !user.activo || user.bloqueado) {
    throw fastify.httpErrors.unauthorized('Usuario inactivo o bloqueado.')
  }

  const access_token = fastify.jwt.sign({
    id: user.id, usuario: user.usuario, es_super_admin: user.es_super_admin,
  })

  return { access_token }
}

async function logout(fastify, userId) {
  refreshTokenStore.delete(userId)
}

async function getMe(fastify, userId) {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, userId));
  
  if (!user) {
    throw fastify.httpErrors.notFound('Usuario no encontrado.')
  }
  
  const { password, ...safeUser } = user
  return safeUser
}

const { sql } = require('drizzle-orm')

async function getUserMenu(fastify, userId, activeEmpresaId, esSuperAdmin) {
  // If Super Admin, they can see all active modules
  if (esSuperAdmin) {
    const rows = await db.execute(sql`
      SELECT id, padre_id, codigo, nombre, descripcion, ruta, tipo, orden, icon
      FROM modulos
      WHERE activo = true
      ORDER BY orden ASC
    `)
    return buildTree(rows)
  }

  // Otherwise, filter by company and user access
  const empresaFilter = activeEmpresaId ? sql`AND ua.empresa_id = ${activeEmpresaId}` : sql``
  
  const rows = await db.execute(sql`
    WITH RECURSIVE module_tree AS (
      -- Get modules the user has permissions for
      SELECT m.id, m.padre_id, m.codigo, m.nombre, m.descripcion, m.ruta, m.tipo, m.orden, m.icon
      FROM modulos m
      INNER JOIN permisos p ON p.modulo_id = m.id
      INNER JOIN rol_permisos rp ON rp.permiso_id = p.id
      INNER JOIN usuario_accesos ua ON ua.rol_id = rp.rol_id
      WHERE ua.usuario_id = ${userId}
        AND ua.activo = true
        AND m.activo = true
        ${empresaFilter}
      
      UNION
      
      -- Add parent modules to complete the tree
      SELECT m.id, m.padre_id, m.codigo, m.nombre, m.descripcion, m.ruta, m.tipo, m.orden, m.icon
      FROM modulos m
      INNER JOIN module_tree mt ON m.id = mt.padre_id
      WHERE m.activo = true
    ),
    root_modules AS (
      SELECT id FROM module_tree WHERE padre_id IS NULL
    )
    SELECT DISTINCT mt.*
    FROM module_tree mt
    -- Validation: Ensure the root module is enabled for the active company
    INNER JOIN empresa_modulos em ON em.modulo_id = 
      COALESCE((
         WITH RECURSIVE mt_up AS (
           SELECT id, padre_id FROM modulos WHERE id = mt.id
           UNION ALL
           SELECT m2.id, m2.padre_id FROM modulos m2 INNER JOIN mt_up ON m2.id = mt_up.padre_id
         ) SELECT id FROM mt_up WHERE padre_id IS NULL LIMIT 1
      ), mt.id)
    INNER JOIN usuario_accesos ua ON ua.empresa_id = em.empresa_id
    WHERE ua.usuario_id = ${userId}
      AND ua.activo = true
      AND em.activo = true
      ${empresaFilter}
    ORDER BY mt.orden ASC
  `)

  return buildTree(rows)
}

function buildTree(items) {
  const rootItems = []
  const lookup = {}

  for (const item of items) {
    lookup[item.id] = { ...item, items: [] }
  }

  for (const item of items) {
    if (item.padre_id) {
      if (lookup[item.padre_id]) {
        lookup[item.padre_id].items.push(lookup[item.id])
      }
    } else {
      rootItems.push(lookup[item.id])
    }
  }

  return rootItems
}

module.exports = { login, refresh, logout, getMe, getUserMenu, buildTree }
