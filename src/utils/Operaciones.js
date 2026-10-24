'use strict'

/**
 * Utilidad global de cálculos matemáticos fiscales y de venta para el Backend (Operaciones.js).
 * Homologado 100% con FRONT/src/utils/Operaciones.js.
 * Centraliza la separación de bases fiscales (Gravadas, Exoneradas, Inafectas, Gratuitas, ICBPER)
 * y garantiza la exactitud monetaria en enteros (cero pérdida de céntimos en retail).
 */

const TASA_IGV = 0.18
const MONTO_ICBPER = 0.30
const FACTOR_MONETARIO = 1000

/**
 * Determina el tipo de clasificación fiscal a partir del código de afectación SUNAT.
 * 10: Gravada onerosa
 * 11-16: Gravada gratuita / retiro
 * 17: IVAP
 * 19 o ICBPER: Impuesto bolsas plásticas
 * 20: Exonerada onerosa
 * 21: Exonerada gratuita
 * 30: Inafecta onerosa
 * 31-37: Inafecta gratuita
 * 40: Exportación
 */
function getGrupoAfectacion(codigoAfectacion = '10') {
  const cod = String(codigoAfectacion || '10').trim()
  const num = parseInt(cod, 10)

  if (cod === '19' || cod === 'ICBPER') {
    return 'ICBPER'
  }
  if (num >= 11 && num <= 16) {
    return 'GRAVADA_GRATUITA'
  }
  if (num === 17) {
    return 'IVAP'
  }
  if (num === 10) {
    return 'GRAVADA'
  }
  if (num === 20) {
    return 'EXONERADA'
  }
  if (num === 21) {
    return 'EXONERADA_GRATUITA'
  }
  if (num === 30) {
    return 'INAFECTA'
  }
  if (num >= 31 && num <= 37) {
    return 'INAFECTA_GRATUITA'
  }
  if (num === 40) {
    return 'EXPORTACION'
  }
  return 'GRAVADA'
}

/**
 * Calcula los totales de una venta / preventa separando bases fiscales.
 * @param {Array} items - Arreglo de ítems con { cantidad, precio_unitario, descuento, tipo_afectacion_igv, gratuito, es_icbper }
 * @returns {{ subtotal: number, gravado: number, exonerado: number, inafecto: number, gratuito: number, icbper: number, igv: number, total: number, itemsProcesados: Array }}
 */
function calcularTotalesVenta(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0.00,
      gravado: 0.00,
      exonerado: 0.00,
      inafecto: 0.00,
      gratuito: 0.00,
      icbper: 0.00,
      igv: 0.00,
      total: 0.00,
      itemsProcesados: []
    }
  }

  let totalGravadoConIgvScaled = 0
  let exoneradoTotalScaled = 0
  let inafectoTotalScaled = 0
  let gratuitoTotalScaled = 0
  let icbperTotalScaled = 0

  const itemsProcesados = items.map((item) => {
    const cant = Number(item.cantidad || 0)
    const precio = Number(item.precio_unitario || item.precio || 0)
    const isGratuito = Boolean(item.gratuito || item.es_gratuito)
    const desc = isGratuito ? 0 : Number(item.descuento || 0)

    const afectacion = String(item.tipo_afectacion_igv || item.tipo_tributo_id || item.tipo_tributo || '10')
    const grupo = getGrupoAfectacion(afectacion)

    let itemTotalVisual = 0
    let itemSubtotalVisual = 0
    let itemIgvVisual = 0

    if (isGratuito || grupo === 'GRAVADA_GRATUITA' || grupo === 'EXONERADA_GRATUITA' || grupo === 'INAFECTA_GRATUITA') {
      const valorRefScaled = Math.round(cant * precio * FACTOR_MONETARIO)
      gratuitoTotalScaled += valorRefScaled
      itemTotalVisual = 0
      itemSubtotalVisual = 0
      itemIgvVisual = 0
    } else if (grupo === 'ICBPER' || Boolean(item.es_icbper)) {
      const icbperItemScaled = Math.round(cant * MONTO_ICBPER * FACTOR_MONETARIO)
      icbperTotalScaled += icbperItemScaled
      itemTotalVisual = Number((cant * MONTO_ICBPER).toFixed(2))
      itemSubtotalVisual = itemTotalVisual
      itemIgvVisual = 0
    } else if (grupo === 'EXONERADA') {
      const totalItemScaled = Math.max(0, Math.round((cant * precio - desc) * FACTOR_MONETARIO))
      exoneradoTotalScaled += totalItemScaled
      itemTotalVisual = Number((totalItemScaled / FACTOR_MONETARIO).toFixed(2))
      itemSubtotalVisual = itemTotalVisual
      itemIgvVisual = 0
    } else if (grupo === 'INAFECTA' || grupo === 'EXPORTACION') {
      const totalItemScaled = Math.max(0, Math.round((cant * precio - desc) * FACTOR_MONETARIO))
      inafectoTotalScaled += totalItemScaled
      itemTotalVisual = Number((totalItemScaled / FACTOR_MONETARIO).toFixed(2))
      itemSubtotalVisual = itemTotalVisual
      itemIgvVisual = 0
    } else {
      // Gravadas con IGV (1.18)
      const totalItemScaled = Math.max(0, Math.round((cant * precio - desc) * FACTOR_MONETARIO))
      totalGravadoConIgvScaled += totalItemScaled
      itemTotalVisual = Number((totalItemScaled / FACTOR_MONETARIO).toFixed(2))
      itemSubtotalVisual = Number((itemTotalVisual / (1 + TASA_IGV)).toFixed(2))
      itemIgvVisual = Number((itemTotalVisual - itemSubtotalVisual).toFixed(2))
    }

    return {
      ...item,
      cantVisual: cant,
      precioVisual: precio,
      descVisual: desc,
      itemTotalVisual,
      itemSubtotalVisual,
      itemIgvVisual
    }
  })

  // Desglose fiscal exacto a partir del total gravado
  const totalGravadoConIgv = totalGravadoConIgvScaled / FACTOR_MONETARIO
  const gravado = Number((totalGravadoConIgv / (1 + TASA_IGV)).toFixed(2))
  const igv = Number((totalGravadoConIgv - gravado).toFixed(2))
  const exonerado = Number((exoneradoTotalScaled / FACTOR_MONETARIO).toFixed(2))
  const inafecto = Number((inafectoTotalScaled / FACTOR_MONETARIO).toFixed(2))
  const gratuito = Number((gratuitoTotalScaled / FACTOR_MONETARIO).toFixed(2))
  const icbper = Number((icbperTotalScaled / FACTOR_MONETARIO).toFixed(2))

  const total = Number((totalGravadoConIgv + exonerado + inafecto + icbper).toFixed(2))

  return {
    subtotal: Number((gravado + exonerado + inafecto).toFixed(2)),
    gravado,
    exonerado,
    inafecto,
    gratuito,
    icbper,
    igv,
    total,
    itemsProcesados
  }
}

module.exports = {
  TASA_IGV,
  MONTO_ICBPER,
  FACTOR_MONETARIO,
  getGrupoAfectacion,
  calcularTotalesVenta
}
