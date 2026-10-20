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
 * Normaliza un valor entero de volumen/cantidad proveniente de la BD.
 * Si proviene de registros previos no escalados (|valor| > 0 y < 1000 con factor >= 10000),
 * lo escala automáticamente por el factorVolumen para mantener consistencia aritmética.
 *
 * @param {number|string} rawVal - Valor almacenado en columna bigint
 * @param {number} factor - Factor de volumen (por defecto 1000000)
 * @returns {number} Entero escalado por factorVolumen
 */
function normalizeVolumenInt(rawVal, factor = 1000000) {
  const num = Number(rawVal || 0)
  if (!Number.isFinite(num) || num === 0) return 0
  if (factor >= 10000 && Math.abs(num) < 1000) {
    return Math.round(num * factor)
  }
  return Math.round(num)
}

/**
 * Convierte un entero de volumen almacenado en bigint a cantidad decimal visual
 * Ej: 1500000 -> 1.5
 *
 * @param {number|string} intVol - Cantidad entera en BD
 * @param {number} factor - Factor de volumen (por defecto 1000000)
 * @param {number} decimals - Máximo de decimales (default: 4)
 * @returns {number} Cantidad decimal visual (ej. 1.5, -7, 2)
 */
function toVolumenVisual(intVol, factor = 1000000, decimals = 4) {
  const normalized = normalizeVolumenInt(intVol, factor)
  if (normalized === 0) return 0
  const val = Number((normalized / factor).toFixed(decimals))
  return Object.is(val, -0) ? 0 : val
}

/**
 * Calcula el stock disponible para una presentación a partir del saldo base visual del producto.
 * - Si multiplica_por === 1 (unidad base, ej. NIU, KGM, LTR), preserva los decimales (ej. -1.5 kg).
 * - Si multiplica_por > 1 (empaque mayor, ej. DOCENA x6, CAJA x12), trunca a unidades completas de esa presentación.
 *
 * @param {number} saldoBaseVisual - Stock base total del producto en unidades visuales
 * @param {number} multiplicaPor - Factor multiplica_por de la presentación
 * @returns {number} Stock de la presentación
 */
function calcularStockPresentacion(saldoBaseVisual, multiplicaPor = 1) {
  const base = Number(saldoBaseVisual || 0)
  const mult = Math.max(1, Number(multiplicaPor || 1))
  if (mult > 1) {
    const calc = Math.trunc(base / mult)
    return Object.is(calc, -0) ? 0 : calc
  }
  const calc = Number(base.toFixed(4))
  return Object.is(calc, -0) ? 0 : calc
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
  normalizeVolumenInt,
  toVolumenVisual,
  calcularStockPresentacion,
  invalidarCacheFactores
}
