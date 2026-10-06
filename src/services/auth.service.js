'use strict'

const bcrypt = require('bcrypt')
const { db } = require('../db')
const { usuarios } = require('../db/schema')
const { eq } = require('drizzle-orm')

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

  const payload = { id: user.id, usuario: user.usuario, es_super_admin: user.es_super_admin }

  const access_token = fastify.jwt.sign(payload)

  const refresh_token = fastify.jwt.sign(
    { id: user.id, type: 'refresh' },
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  )

  refreshTokenStore.set(user.id, refresh_token)

  return {
    access_token,
    refresh_token,
    user: { id: user.id, usuario: user.usuario, nombre: user.nombre, es_super_admin: user.es_super_admin },
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

module.exports = { login, refresh, logout, getMe }
