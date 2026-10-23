'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, sql } = require('drizzle-orm')
const cajasRepository = require('../repositories/cajas.repository')
const { getFactores } = require('../../../utils/factores')

/**
 * Caso de Uso Especializado: Cierre de Turno de Caja y Conciliación Final
 */
const cierreTurnoService = {
  async cerrarTurno(cajaTurnoId, body) {
    const { totales_cierre, observacion_general, arqueo, conteos } = body

    const turno = await cajasRepository.getTurnoById(cajaTurnoId)
    if (!turno) {
      const error = new Error('Turno de caja no encontrado')
      error.statusCode = 404
      throw error
    }

    if (turno.estado === 'CERRADA') {
      const error = new Error('El turno ya se encuentra cerrado.')
      error.statusCode = 400
      throw error
    }

    const { factorPrecio } = await getFactores()
    const resumenActual = await cajasRepository.getResumenTurno(cajaTurnoId)
    const montoAperturaTurno = Number(resumenActual?.monto_apertura || 0)

    // Regla de Negocio VAL-DUR-02:
    if (Array.isArray(totales_cierre)) {
      const efectivoItem = totales_cierre.find(
        (tc) => String(tc.metodo_pago_id) === '1' || String(tc.metodo_pago_id) === '01'
      )
      const declaradoEfectivo = Number(efectivoItem?.monto_declarado || 0)
      if (declaradoEfectivo <= 0 && montoAperturaTurno > 0) {
        const error = new Error('El monto físico no puede ser cero, por favor ingresar la cantidad solicitada')
        error.statusCode = 400
        throw error
      }
    }

    const ventasTurno = await cajasRepository.getVentasTurno(cajaTurnoId)
    const pagosVentas = await cajasRepository.getTotalesPagosVentasTurno(cajaTurnoId)

    const mapaVentas = {}
    pagosVentas.forEach((v) => {
      mapaVentas[String(v.metodo_pago_id)] = Number(v.total || 0)
    })

    const movimientos = await cajasRepository.getTotalesMovimientosCaja(cajaTurnoId)
    let totalIngresos = 0
    let totalEgresos = 0
    movimientos.forEach((m) => {
      if (m.tipo === 'INGRESO') totalIngresos += Number(m.total || 0)
      if (m.tipo === 'EGRESO') totalEgresos += Number(m.total || 0)
    })
    const netMovimientosEfectivo = totalIngresos - totalEgresos

    // Métricas analíticas
    let totalVentasBrutas = 0
    let totalVentasNetas = 0
    let totalVentasCredito = 0
    let totalVentasContado = 0
    let totalFacturas = 0
    let cantFacturas = 0
    let totalBoletas = 0
    let cantBoletas = 0
    let totalVales = 0
    let cantVales = 0
    let totalNC = 0
    let totalND = 0
    let totalAceptados = 0
    let totalObservados = 0
    let totalRechazados = 0
    let totalPendientesEnvio = 0
    let cantPendientesEnvio = 0
    let totalAnulaciones = 0
    let cantAnulaciones = 0
    let totalDescuentos = 0
    let cantDescuentos = 0
    let totalImpuestos = 0
    let totalGravado = 0
    let totalExonerado = 0
    let totalInafecto = 0
    const anulacionesList = []

    ventasTurno.forEach((v) => {
      const totalDoc = Number(v.total_venta || 0)
      const estadoVenta = String(v.estado || '').toUpperCase()

      if (estadoVenta === 'ANULADO') {
        totalAnulaciones += totalDoc
        cantAnulaciones += 1
        anulacionesList.push({
          id: v.id,
          tipo_comprobante_id: v.tipo_comprobante_id,
          total: totalDoc
        })
        return
      }

      totalVentasBrutas += totalDoc
      totalVentasNetas += totalDoc - Number(v.descuento || 0)

      if (v.tipo_pago_id === '2' || String(v.tipo_pago_id).toUpperCase() === 'CREDITO') {
        totalVentasCredito += totalDoc
      } else {
        totalVentasContado += totalDoc
      }

      const tipoComp = String(v.tipo_comprobante_id || '')
      if (tipoComp === '01') {
        totalFacturas += totalDoc
        cantFacturas += 1
      } else if (tipoComp === '03') {
        totalBoletas += totalDoc
        cantBoletas += 1
      } else if (tipoComp === 'VL' || tipoComp === '00' || tipoComp === '99') {
        totalVales += totalDoc
        cantVales += 1
      } else if (tipoComp === '07') {
        totalNC += totalDoc
      } else if (tipoComp === '08') {
        totalND += totalDoc
      }

      if (v.descuento && Number(v.descuento) > 0) {
        totalDescuentos += Number(v.descuento)
        cantDescuentos += 1
      }
      totalImpuestos += Number(v.igv || 0)
      totalGravado += Number(v.gravadas || 0)
      totalExonerado += Number(v.exoneradas || 0)
      totalInafecto += Number(v.inafectas || 0)

      const fact = String(v.facturado || '').toUpperCase()
      if (fact === 'ACEPTADO') totalAceptados += totalDoc
      else if (fact === 'OBSERVADO') totalObservados += totalDoc
      else if (fact === 'RECHAZADO') totalRechazados += totalDoc
      else {
        totalPendientesEnvio += totalDoc
        cantPendientesEnvio += 1
      }
    })

    // Normalizar denominaciones de arqueo de cierre
    let billete_200 = 0
    let billete_100 = 0
    let billete_50 = 0
    let billete_20 = 0
    let billete_10 = 0
    let moneda_5 = 0
    let moneda_2 = 0
    let moneda_1 = 0
    let moneda_050 = 0
    let moneda_020 = 0
    let moneda_010 = 0

    if (arqueo && typeof arqueo === 'object') {
      billete_200 = parseInt(arqueo.billete_200 || 0, 10) || 0
      billete_100 = parseInt(arqueo.billete_100 || 0, 10) || 0
      billete_50 = parseInt(arqueo.billete_50 || 0, 10) || 0
      billete_20 = parseInt(arqueo.billete_20 || 0, 10) || 0
      billete_10 = parseInt(arqueo.billete_10 || 0, 10) || 0
      moneda_5 = parseInt(arqueo.moneda_5 || 0, 10) || 0
      moneda_2 = parseInt(arqueo.moneda_2 || 0, 10) || 0
      moneda_1 = parseInt(arqueo.moneda_1 || 0, 10) || 0
      moneda_050 = parseInt(arqueo.moneda_050 || 0, 10) || 0
      moneda_020 = parseInt(arqueo.moneda_020 || 0, 10) || 0
      moneda_010 = parseInt(arqueo.moneda_010 || 0, 10) || 0
    } else if (Array.isArray(conteos)) {
      conteos.forEach((c) => {
        const val = Number(c.denominacion || c.valor || 0)
        const cant = parseInt(c.cantidad || 0, 10) || 0
        if (val === 200) billete_200 = cant
        else if (val === 100) billete_100 = cant
        else if (val === 50) billete_50 = cant
        else if (val === 20) billete_20 = cant
        else if (val === 10) billete_10 = cant
        else if (val === 5) moneda_5 = cant
        else if (val === 2) moneda_2 = cant
        else if (val === 1) moneda_1 = cant
        else if (Math.abs(val - 0.5) < 0.001) moneda_050 = cant
        else if (Math.abs(val - 0.2) < 0.001) moneda_020 = cant
        else if (Math.abs(val - 0.1) < 0.001) moneda_010 = cant
      })
    }

    return db.transaction(async (tx) => {
      // 1. Actualizar estado del turno a CERRADA
      const [turnoActualizado] = await tx
        .update(schema.caja_turnos)
        .set({
          estado: 'CERRADA',
          fecha_cierre_f: sql`NOW()`,
          updated_at: sql`NOW()`
        })
        .where(eq(schema.caja_turnos.id, cajaTurnoId))
        .returning()

      // 2. Procesar caja_turno_pagos por cada método
      const listaMetodosCierre = Array.isArray(totales_cierre) ? totales_cierre : []
      const desgloseMetodosJSON = []

      for (const item of listaMetodosCierre) {
        const metodoIdStr = String(item.metodo_pago_id)
        const esEfectivo = metodoIdStr === '1' || metodoIdStr === '01'
        const ventasSistemaInt = Number(mapaVentas[metodoIdStr] || 0)
        const sistemaEsperadoInt = esEfectivo
          ? montoAperturaTurno + ventasSistemaInt + netMovimientosEfectivo
          : ventasSistemaInt

        const declaradoInt = Math.round(Number(item.monto_declarado || 0) * factorPrecio)
        const diferenciaInt = declaradoInt - sistemaEsperadoInt

        const [pagoExistente] = await tx
          .select()
          .from(schema.caja_turno_pagos)
          .where(
            and(
              eq(schema.caja_turno_pagos.caja_turno_id, cajaTurnoId),
              eq(schema.caja_turno_pagos.metodo_pago_id, metodoIdStr)
            )
          )

        if (pagoExistente) {
          await tx
            .update(schema.caja_turno_pagos)
            .set({
              monto_sistema: sistemaEsperadoInt,
              monto_declarado: declaradoInt,
              diferencia: diferenciaInt,
              observacion: item.observacion || observacion_general || null,
              updated_at: sql`NOW()`
            })
            .where(eq(schema.caja_turno_pagos.id, pagoExistente.id))
        } else {
          await tx.insert(schema.caja_turno_pagos).values({
            caja_turno_id: cajaTurnoId,
            metodo_pago_id: metodoIdStr,
            monto_sistema: sistemaEsperadoInt,
            monto_declarado: declaradoInt,
            diferencia: diferenciaInt,
            observacion: item.observacion || observacion_general || null,
            sincronizado: false,
            created_at: sql`NOW()`,
            updated_at: sql`NOW()`
          })
        }

        desgloseMetodosJSON.push({
          metodo_pago_id: metodoIdStr,
          monto_sistema: sistemaEsperadoInt,
          monto_declarado: declaradoInt,
          diferencia: diferenciaInt
        })
      }

      // 3. Registrar o actualizar resumen analítico en caja_turnos_resumen
      const desgloseTiposPago = [
        { tipo: 'CONTADO', total: totalVentasContado },
        { tipo: 'CREDITO', total: totalVentasCredito }
      ]

      const payloadResumen = {
        total_ventas_bruto: totalVentasBrutas,
        total_ventas_neto: totalVentasNetas,
        total_ventas_credito: totalVentasCredito,
        total_ventas_contado: totalVentasContado,
        total_facturas: totalFacturas,
        cant_facturas: cantFacturas,
        total_boletas: totalBoletas,
        cant_boletas: cantBoletas,
        total_vales: totalVales,
        cant_vales: cantVales,
        total_notas_credito: totalNC,
        total_notas_debito: totalND,
        total_ingresos_manuales: totalIngresos,
        total_egresos_manuales: totalEgresos,
        total_comprobantes_aceptados: totalAceptados,
        total_comprobantes_observados: totalObservados,
        total_comprobantes_rechazados: totalRechazados,
        total_comprobantes_pendientes_envio: totalPendientesEnvio,
        cant_comprobantes_pendientes_envio: cantPendientesEnvio,
        total_anulaciones: totalAnulaciones,
        cant_anulaciones: cantAnulaciones,
        total_descuentos_aplicados: totalDescuentos,
        cant_descuentos_aplicados: cantDescuentos,
        total_impuestos_retenidos: totalImpuestos,
        total_base_gravada: totalGravado,
        total_base_exonerada: totalExonerado,
        total_base_inafecta: totalInafecto,
        desglose_metodos_pago_jsonb: desgloseMetodosJSON,
        desglose_tipos_pago_jsonb: desgloseTiposPago,
        desglose_anulaciones_jsonb: anulacionesList,
        observacion: observacion_general || null,
        updated_at: sql`NOW()`
      }

      const [resumenExistente] = await tx
        .select()
        .from(schema.caja_turnos_resumen)
        .where(eq(schema.caja_turnos_resumen.caja_turno_id, cajaTurnoId))

      if (resumenExistente) {
        await tx
          .update(schema.caja_turnos_resumen)
          .set(payloadResumen)
          .where(eq(schema.caja_turnos_resumen.caja_turno_id, cajaTurnoId))
      } else {
        await tx.insert(schema.caja_turnos_resumen).values({
          caja_turno_id: cajaTurnoId,
          monto_apertura: montoAperturaTurno,
          ...payloadResumen,
          created_at: sql`NOW()`
        })
      }

      // 4. Registrar Arqueo de cierre en caja_arqueos
      const sumaArqueoCentimos =
        Math.round(
          (billete_200 * 200 +
            billete_100 * 100 +
            billete_50 * 50 +
            billete_20 * 20 +
            billete_10 * 10 +
            moneda_5 * 5 +
            moneda_2 * 2 +
            moneda_1 * 1 +
            moneda_050 * 0.5 +
            moneda_020 * 0.2 +
            moneda_010 * 0.1) *
            factorPrecio
        )

      await tx.insert(schema.caja_arqueos).values({
        caja_turno_id: cajaTurnoId,
        caja_movimiento_id: null,
        subtotal: sumaArqueoCentimos,
        billete_200,
        billete_100,
        billete_50,
        billete_20,
        billete_10,
        moneda_5,
        moneda_2,
        moneda_1,
        moneda_050,
        moneda_020,
        moneda_010,
        sincronizado: false,
        created_at: sql`NOW()`,
        updated_at: sql`NOW()`
      })

      return turnoActualizado
    })
  }
}

module.exports = cierreTurnoService
