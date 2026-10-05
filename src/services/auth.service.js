'use strict'

const bcrypt = require('bcrypt')

/**
 * Servicio de autenticación.
 *
 * NOTA: Las queries SQL se completarán cuando el schema de BD esté definido.
 *       Por ahora los métodos devuelven datos mock para que el servidor arranque.
 *       Busca el comentario "// TODO: DB" para reemplazar con queries reales.
 */

const MOCK_USER = {
  id:       '00000000-0000-0000-0000-000000000001',
  email:    'admin@sistemmarket.pe',
  nombre:   'Administrador',
  rol:      'admin',
  // hash de 'admin123'
  password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
}

// Almacén temporal de refresh tokens (reemplazar con tabla DB)
const refreshTokenStore = new Map()

async function login(fastify, email, password) {
  // TODO: DB → SELECT * FROM usuarios WHERE email = $email AND deleted_at IS NULL
  const user = email === MOCK_USER.email ? MOCK_USER : null

  if (!user) {
    throw fastify.httpErrors.unauthorized('Credenciales incorrectas.')
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    throw fastify.httpErrors.unauthorized('Credenciales incorrectas.')
  }

  const payload = { id: user.id, email: user.email, rol: user.rol }

  const access_token = fastify.jwt.sign(payload)

  // Refresh token con mayor expiración
  const refresh_token = fastify.jwt.sign(
    { id: user.id, type: 'refresh' },
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  )

  // TODO: DB → INSERT INTO refresh_tokens (user_id, token, expires_at)
  refreshTokenStore.set(user.id, refresh_token)

  return {
    access_token,
    refresh_token,
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
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

  // TODO: DB → SELECT * FROM refresh_tokens WHERE user_id = $id AND token = $token
  const stored = refreshTokenStore.get(payload.id)
  if (stored !== refreshToken) {
    throw fastify.httpErrors.unauthorized('Refresh token no reconocido.')
  }

  // TODO: DB → SELECT * FROM usuarios WHERE id = $id
  const user = MOCK_USER

  const access_token = fastify.jwt.sign({
    id: user.id, email: user.email, rol: user.rol,
  })

  return { access_token }
}

async function logout(fastify, userId) {
  // TODO: DB → DELETE FROM refresh_tokens WHERE user_id = $userId
  refreshTokenStore.delete(userId)
}

async function getMe(fastify, userId) {
  // TODO: DB → SELECT id, email, nombre, rol FROM usuarios WHERE id = $userId
  if (userId !== MOCK_USER.id) {
    throw fastify.httpErrors.notFound('Usuario no encontrado.')
  }
  const { password_hash, ...user } = MOCK_USER
  return user
}

module.exports = { login, refresh, logout, getMe }
