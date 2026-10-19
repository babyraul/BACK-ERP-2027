'use strict'

const { db } = require('../db')
const schema = require('../db/schema')
const { eq, and, sql, or } = require('drizzle-orm')

/**
 * Worker de Expiración Automática de Pre-ventas
 * Reglas de negocio:
 * - RN-12: Expiran preventas en estado 'PENDIENTE' tras 1 hora desde su creación.
 * - RN-13: El plazo se extiende a 3 horas si el Alias (en mayúsculas) inicia con 'MESA' o es 'DELIVERY'.
 */
class PreventasExpirationWorker {
  constructor(logger = console) {
    this.logger = logger
    this.intervalId = null
    // Ejecutar verificación cada 5 minutos
    this.checkIntervalMs = 5 * 60 * 1000
  }

  start() {
    if (this.intervalId) return
    this.logger.info?.('[PreventasWorker] Iniciando worker de expiración automática de preventas...')
    // Ejecución inmediata al inicio
    this.runExpirationCycle().catch((err) =>
      this.logger.error?.('[PreventasWorker] Error en ciclo inicial:', err)
    )

    this.intervalId = setInterval(() => {
      this.runExpirationCycle().catch((err) =>
        this.logger.error?.('[PreventasWorker] Error en ciclo periódico:', err)
      )
    }, this.checkIntervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.logger.info?.('[PreventasWorker] Worker de expiración detenido.')
    }
  }

  async runExpirationCycle() {
    try {
      // Condición: Estado PENDIENTE y vencida según plazo
      // - 3 horas si UPPER(alias) LIKE 'MESA%' o UPPER(alias) = 'DELIVERY'
      // - 1 hora para cualquier otro caso
      const expiredCondition = sql`
        (${schema.pre_ventas.estado} = 'PENDIENTE' OR ${schema.pre_ventas.estado} = 'GENERADO')
        AND (
          (
            (UPPER(COALESCE(${schema.pre_ventas.alias}, '')) LIKE 'MESA%' OR UPPER(COALESCE(${schema.pre_ventas.alias}, '')) = 'DELIVERY')
            AND ${schema.pre_ventas.created_at} <= NOW() - INTERVAL '3 hours'
          )
          OR
          (
            (UPPER(COALESCE(${schema.pre_ventas.alias}, '')) NOT LIKE 'MESA%' AND UPPER(COALESCE(${schema.pre_ventas.alias}, '')) != 'DELIVERY')
            AND ${schema.pre_ventas.created_at} <= NOW() - INTERVAL '1 hour'
          )
        )
      `

      // Anulación lógica atómica
      const result = await db
        .update(schema.pre_ventas)
        .set({
          estado: 'ANULADO',
          updated_at: sql`NOW()`
        })
        .where(expiredCondition)
        .returning({ id: schema.pre_ventas.id, alias: schema.pre_ventas.alias })

      if (result && result.length > 0) {
        this.logger.info?.(
          `[PreventasWorker] Se auto-expiraron ${result.length} preventas pendientes (IDs: ${result.map((r) => r.id).join(', ')})`
        )
      }
    } catch (error) {
      this.logger.error?.('[PreventasWorker] Error al ejecutar expiración de preventas:', error)
    }
  }
}

module.exports = PreventasExpirationWorker
