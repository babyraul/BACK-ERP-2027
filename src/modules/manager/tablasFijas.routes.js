'use strict'

const buildCrudRoutes = require('../../core/crud.factory')
const schema = require('../../db/schema')

/**
 * Rutas Centralizadas para Tablas Fijas / Catálogos SUNAT y Maestros
 * 
 * Acceso público para usuarios autenticados (`publicRead: true`),
 * evitando restricciones de permisos dinámicos RBAC específicos por módulo.
 */
async function tablasFijasRoutes(fastify) {
  // 1. Tipos de Comprobante (Factura, Boleta, Nota de Crédito, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_comprobante, { publicRead: true }), {
    prefix: '/tipos-comprobante'
  })

  // 2. Tipos de Documento de Identidad (DNI, RUC, Pasaporte, CE, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_documento, { publicRead: true }), {
    prefix: '/tipos-documento'
  })

  // 3. Tipos de Afectación al IGV (Gravado, Exonerado, Inafecto, Exportación, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_afectacion_igv, { publicRead: true }), {
    prefix: '/tipos-afectacion-igv'
  })

  // 4. Tipos de Unidades de Medida (NIU, KGM, LTR, ZZ, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_unidades_medida, { publicRead: true }), {
    prefix: '/tipos-unidades-medida'
  })

  // 5. Monedas (PEN, USD, EUR, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_moneda, { publicRead: true }), {
    prefix: '/tipos-moneda'
  })

  // 6. Métodos de Pago (Efectivo, Yape, Plin, Transferencia, Tarjeta, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_metodo_pago, { publicRead: true }), {
    prefix: '/tipos-metodo-pago'
  })

  // 7. Tipos de Pago / Condición (Contado, Crédito)
  fastify.register(buildCrudRoutes(schema.tipo_pago, { publicRead: true }), {
    prefix: '/tipos-pago'
  })

  // 8. Tipos de Operación SUNAT (Venta interna, Exportación, Anticipo, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_operacion, { publicRead: true }), {
    prefix: '/tipos-operacion'
  })

  // 9. Tipos de Tributos (IGV, ISC, IVAP, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_tributos, { publicRead: true }), {
    prefix: '/tipos-tributos'
  })

  // 10. Tipos de Existencia (Mercadería, Materia Prima, Producto Terminado, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_existencia, { publicRead: true }), {
    prefix: '/tipos-existencia'
  })

  // 11. Impuestos del Sistema
  fastify.register(buildCrudRoutes(schema.tipo_impuesto, { publicRead: true }), {
    prefix: '/tipos-impuesto'
  })

  // 12. Factores y Porcentajes del Sistema
  fastify.register(buildCrudRoutes(schema.tipo_factores, { publicRead: true }), {
    prefix: '/tipos-factores'
  })

  // 13. Tipos de Stock (Físico, Comprometido, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_stock, { publicRead: true }), {
    prefix: '/tipos-stock'
  })

  // 14. Motivos de Traslado (Venta, Compra, Traslado entre almacenes, etc.)
  fastify.register(buildCrudRoutes(schema.tipo_motivo_traslado, { publicRead: true }), {
    prefix: '/tipos-motivo-traslado'
  })

  // 15. Códigos de Detracción SUNAT
  fastify.register(buildCrudRoutes(schema.tipo_codigos_detraccion, { publicRead: true }), {
    prefix: '/tipos-detraccion'
  })

  // 16. Tipo de Cambio
  fastify.register(buildCrudRoutes(schema.tipo_cambio, { publicRead: true }), {
    prefix: '/tipos-cambio'
  })
}

module.exports = tablasFijasRoutes
