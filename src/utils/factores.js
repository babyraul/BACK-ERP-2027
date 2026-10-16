'use strict'

const { db } = require('../db')
const schema = require('../db/schema')

// Caché en memoria con TTL para evitar llamadas continuas a la base de datos
let cachedFactores = null
let lastFetchTime = 0
const CACHE_TTL_MS = 60 * 1000 // 1 minuto de expiración

/**
 * Obtener factores de conversión del sistema (tipo_factores)
 * - PRECIO: Factor para multiplicar/dividir precios en céntimos (default: 100)
 * - VOLUMEN: Factor para multiplicar/dividir cantidades/volúmenes (default: 1000000)
 * 
 * @param {boolean} forceRefresh - Forzar lectura directa desde la base de datos
 * @returns {Promise<{ factorPrecio: number, factorVolumen: number, raw: Array }>}
 */
async function getFactores(forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && cachedFactores && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedFactores
  }

  try {
    const rows = await db.select().from(schema.tipo_factores)
    const fPrecio = rows.find((f) => f.codigo === 'PRECIO')?.valor || 100
    const fVolumen = rows.find((f) => f.codigo === 'VOLUMEN')?.valor || 1000000

    cachedFactores = {
      factorPrecio: Number(fPrecio),
      factorVolumen: Number(fVolumen),
      raw: rows
    }
    lastFetchTime = now
    return cachedFactores
  } catch (error) {
    console.error('Error al consultar tipo_factores desde BD, usando valores por defecto:', error.message)
    return {
      factorPrecio: 100,
      factorVolumen: 1000000,
      raw: []
    }
  }
}

/**
 * Convierte un monto decimal visual a entero escalado para almacenar en bigint
 * Ej: S/ 79.66 -> 7966
 * 
 * @param {number|string} visualAmount - Monto decimal
 * @param {number} factor - Factor de precio (por defecto 100)
 * @returns {number} Monto entero redondeado
 */
function toPrecioInt(visualAmount, factor = 100) {
  const num = Number(visualAmount || 0)
  return Math.round(num * factor)
}

/**
 * Convierte un entero almacenado en bigint a decimal visual
 * Ej: 7966 -> 79.66
 * 
 * @param {number|string} intAmount - Monto entero
 * @param {number} factor - Factor de precio (por defecto 100)
 * @param {number} decimals - Número de decimales (default: 2)
 * @returns {number} Monto decimal
 */
function toPrecioVisual(intAmount, factor = 100, decimals = 2) {
  const num = Number(intAmount || 0)
  return Number((num / factor).toFixed(decimals))
}

/**
 * Convierte una cantidad visual decimal a entero escalado según el factor de volumen
 * 
 * @param {number|string} visualVol - Cantidad visual
 * @param {number} factor - Factor de volumen (por defecto 1000000)
 * @returns {number} Entero redondeado
 */
function toVolumenInt(visualVol, factor = 1000000) {
  const num = Number(visualVol || 0)
  return Math.round(num * factor)
}

/**
 * Invalida la caché de factores manualmente (ej: tras actualizar tipo_factores)
 */
function invalidarCacheFactores() {
  cachedFactores = null
  lastFetchTime = 0
}

module.exports = {
  getFactores,
  toPrecioInt,
  toPrecioVisual,
  toVolumenInt,
  invalidarCacheFactores
}
