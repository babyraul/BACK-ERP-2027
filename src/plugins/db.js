'use strict'

/**
 * Plugin: Base de datos
 *
 * Crea la conexión a PostgreSQL 18 usando el driver 'postgres'.
 * Decora fastify.db con la instancia de Drizzle ORM.
 *
 * NOTA: El schema de Drizzle (src/db/schema.js) se completará cuando
 *       se defina la base de datos. Por ahora expone el cliente sql
 *       y un objeto db vacío listo para recibir el schema.
 */

const fp       = require('fastify-plugin')
const postgres = require('postgres')

async function dbPlugin(fastify) {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    fastify.log.warn('⚠️ DATABASE_URL no está definida en el archivo .env. Modo sin DB activo.')
    fastify.decorate('sql', null)
    fastify.decorate('db', null)
    return
  }

  // ── Conexión PostgreSQL 18 ────────────────────────────────────────────────
  const sql = postgres(connectionString, {
    max:         10,          // pool máximo de conexiones
    idle_timeout: 30,         // segundos inactivo antes de cerrar
    connect_timeout: 10,      // timeout de conexión
    onnotice: (notice) => fastify.log.debug({ notice }, 'PG notice'),
  })

  // ── Verificar conexión al arrancar ────────────────────────────────────────
  try {
    await sql`SELECT 1`
    fastify.log.info('✅ Conectado a PostgreSQL 18')
  } catch (err) {
    fastify.log.warn({ err: err.message }, '⚠️ No se pudo conectar con PostgreSQL 18 al iniciar (verificar credenciales o servicio)')
  }

  // ── Decorar instancia Fastify ─────────────────────────────────────────────
  // fastify.sql → cliente raw (para queries directas)
  // fastify.db  → se completará con Drizzle cuando el schema esté listo
  fastify.decorate('sql', sql)
  fastify.decorate('db', null) // TODO: inicializar con drizzle(sql, { schema })

  // ── Cerrar conexión al apagar el servidor ─────────────────────────────────
  fastify.addHook('onClose', async () => {
    await sql.end()
    fastify.log.info('🔌 Conexión PostgreSQL cerrada')
  })
}

module.exports = fp(dbPlugin, { name: 'db' })
