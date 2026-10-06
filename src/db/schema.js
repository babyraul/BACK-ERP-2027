var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var schema_exports = {};
__export(schema_exports, {
  almacenes: () => almacenes,
  bancos: () => bancos,
  caja_arqueos: () => caja_arqueos,
  caja_chica: () => caja_chica,
  caja_chica_arqueos: () => caja_chica_arqueos,
  caja_chica_movimientos: () => caja_chica_movimientos,
  caja_chica_sesiones: () => caja_chica_sesiones,
  caja_chica_totales: () => caja_chica_totales,
  caja_movimientos: () => caja_movimientos,
  caja_serie_correlativo: () => caja_serie_correlativo,
  caja_totales: () => caja_totales,
  caja_turnos: () => caja_turnos,
  categorias: () => categorias,
  clientes: () => clientes,
  combo_detalle_pre_ventas: () => combo_detalle_pre_ventas,
  combo_detalle_ventas: () => combo_detalle_ventas,
  combo_detalles: () => combo_detalles,
  compra: () => compra,
  compra_cotizacion: () => compra_cotizacion,
  compra_cotizacion_detalle: () => compra_cotizacion_detalle,
  compra_detalle: () => compra_detalle,
  compra_flujo: () => compra_flujo,
  compra_orden: () => compra_orden,
  compra_orden_detalle: () => compra_orden_detalle,
  compra_requerimiento: () => compra_requerimiento,
  compra_requerimiento_detalle: () => compra_requerimiento_detalle,
  compras_pagos: () => compras_pagos,
  compras_sire: () => compras_sire,
  conductores: () => conductores,
  conf_envio_whatsapp: () => conf_envio_whatsapp,
  cotizaciones: () => cotizaciones,
  detalle_cotizaciones: () => detalle_cotizaciones,
  detalle_guias_remision: () => detalle_guias_remision,
  detalle_notas_credito: () => detalle_notas_credito,
  detalle_pre_ventas: () => detalle_pre_ventas,
  detalle_ventas: () => detalle_ventas,
  empresa_modulos: () => empresa_modulos,
  empresas: () => empresas,
  guias_remision: () => guias_remision,
  lotes: () => lotes,
  mensajeticket: () => mensajeticket,
  modulos: () => modulos,
  movimiento_almacen: () => movimiento_almacen,
  movimiento_almacen_detalle: () => movimiento_almacen_detalle,
  notas_credito: () => notas_credito,
  notificaciones: () => notificaciones,
  permisos: () => permisos,
  pre_ventas: () => pre_ventas,
  presentaciones: () => presentaciones,
  productos: () => productos,
  productos_proveedores: () => productos_proveedores,
  proveedores: () => proveedores,
  recetas: () => recetas,
  recetas_detalles: () => recetas_detalles,
  rol_permisos: () => rol_permisos,
  roles: () => roles,
  stock: () => stock,
  stock_actual: () => stock_actual,
  subcategoria: () => subcategoria,
  sucursales: () => sucursales,
  tipo_afectacion_igv: () => tipo_afectacion_igv,
  tipo_bancos: () => tipo_bancos,
  tipo_cambio: () => tipo_cambio,
  tipo_codigos_detraccion: () => tipo_codigos_detraccion,
  tipo_comprobante: () => tipo_comprobante,
  tipo_documento: () => tipo_documento,
  tipo_existencia: () => tipo_existencia,
  tipo_factores: () => tipo_factores,
  tipo_impuesto: () => tipo_impuesto,
  tipo_metodo_pago: () => tipo_metodo_pago,
  tipo_moneda: () => tipo_moneda,
  tipo_motivo_traslado: () => tipo_motivo_traslado,
  tipo_operacion: () => tipo_operacion,
  tipo_pago: () => tipo_pago,
  tipo_stock: () => tipo_stock,
  tipo_tributos: () => tipo_tributos,
  tipo_unidades_medida: () => tipo_unidades_medida,
  tokens_autorizacion: () => tokens_autorizacion,
  transportistas: () => transportistas,
  ubigeo: () => ubigeo,
  usuario_accesos: () => usuario_accesos,
  usuario_permisos: () => usuario_permisos,
  usuarios: () => usuarios,
  vehiculos: () => vehiculos,
  ventas: () => ventas,
  ventas_pagos: () => ventas_pagos,
  ventas_sire: () => ventas_sire
});
module.exports = __toCommonJS(schema_exports);
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_orm = require("drizzle-orm");
const ubigeo = (0, import_pg_core.pgTable)(
  "ubigeo",
  {
    codigo: (0, import_pg_core.varchar)("codigo", { length: 6 }).primaryKey().notNull(),
    departamento: (0, import_pg_core.varchar)("departamento", { length: 100 }).notNull(),
    provincia: (0, import_pg_core.varchar)("provincia", { length: 100 }).notNull(),
    distrito: (0, import_pg_core.varchar)("distrito", { length: 100 }).notNull()
  },
  (table) => {
    return {
      idx_ubigeo_departamento: (0, import_pg_core.index)("idx_ubigeo_departamento").using("btree", table.departamento),
      idx_ubigeo_distrito: (0, import_pg_core.index)("idx_ubigeo_distrito").using("btree", table.distrito),
      idx_ubigeo_full: (0, import_pg_core.index)("idx_ubigeo_full").using("btree", table.departamento, table.provincia, table.distrito),
      idx_ubigeo_provincia: (0, import_pg_core.index)("idx_ubigeo_provincia").using("btree", table.provincia)
    };
  }
);
const tipo_afectacion_igv = (0, import_pg_core.pgTable)(
  "tipo_afectacion_igv",
  {
    codigo: (0, import_pg_core.smallint)("codigo").primaryKey().notNull(),
    descripcion: (0, import_pg_core.varchar)("descripcion", { length: 120 }).notNull(),
    codigo_tributo: (0, import_pg_core.varchar)("codigo_tributo", { length: 10 }).notNull(),
    activo: (0, import_pg_core.boolean)("activo").default(true)
  },
  (table) => {
    return {
      idx_tipo_afectacion_igv_activo: (0, import_pg_core.index)("idx_tipo_afectacion_igv_activo").using("btree", table.activo),
      idx_tipo_afectacion_igv_activo_tributo: (0, import_pg_core.index)("idx_tipo_afectacion_igv_activo_tributo").using("btree", table.codigo_tributo, table.activo),
      idx_tipo_afectacion_igv_descripcion: (0, import_pg_core.index)("idx_tipo_afectacion_igv_descripcion").using("btree", table.descripcion),
      idx_tipo_afectacion_igv_tributo: (0, import_pg_core.index)("idx_tipo_afectacion_igv_tributo").using("btree", table.codigo_tributo)
    };
  }
);
const tipo_unidades_medida = (0, import_pg_core.pgTable)(
  "tipo_unidades_medida",
  {
    id: (0, import_pg_core.varchar)("id", { length: 5 }).primaryKey().notNull(),
    codigo: (0, import_pg_core.varchar)("codigo", { length: 5 }).notNull(),
    descripcion: (0, import_pg_core.varchar)("descripcion", { length: 100 }).notNull(),
    estado: (0, import_pg_core.boolean)("estado").default(true),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      idx_tipo_unidades_medida_codigo: (0, import_pg_core.index)("idx_tipo_unidades_medida_codigo").using("btree", table.codigo),
      idx_tipo_unidades_medida_descripcion: (0, import_pg_core.index)("idx_tipo_unidades_medida_descripcion").using("btree", table.descripcion),
      idx_tipo_unidades_medida_estado_codigo: (0, import_pg_core.index)("idx_tipo_unidades_medida_estado_codigo").using("btree", table.estado, table.codigo)
    };
  }
);
const clientes = (0, import_pg_core.pgTable)(
  "clientes",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    tipo_documento_id: (0, import_pg_core.varchar)("tipo_documento_id", { length: 2 }),
    numero_documento: (0, import_pg_core.varchar)("numero_documento", { length: 20 }).notNull(),
    nombre_razon_social: (0, import_pg_core.text)("nombre_razon_social").notNull(),
    direccion_1: (0, import_pg_core.text)("direccion_1"),
    direccion_2: (0, import_pg_core.text)("direccion_2"),
    direccion_3: (0, import_pg_core.text)("direccion_3"),
    email_1: (0, import_pg_core.text)("email_1"),
    email_2: (0, import_pg_core.text)("email_2"),
    email_3: (0, import_pg_core.text)("email_3"),
    telefono_1: (0, import_pg_core.varchar)("telefono_1", { length: 20 }),
    telefono_2: (0, import_pg_core.varchar)("telefono_2", { length: 20 }),
    telefono_3: (0, import_pg_core.varchar)("telefono_3", { length: 20 }),
    branch_id: (0, import_pg_core.uuid)("branch_id"),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    limite_credito_int: (0, import_pg_core.bigint)("limite_credito_int", { mode: "number" }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    saldo_utilizado_int: (0, import_pg_core.bigint)("saldo_utilizado_int", { mode: "number" }).default(0),
    dias_credito_pactado: (0, import_pg_core.integer)("dias_credito_pactado").default(30),
    cantidad_cuotas: (0, import_pg_core.integer)("cantidad_cuotas").default(1),
    estado_credito: (0, import_pg_core.varchar)("estado_credito", { length: 20 }).default("NORMAL")
  },
  (table) => {
    return {
      idx_clientes_branch: (0, import_pg_core.index)("idx_clientes_branch").using("btree", table.branch_id),
      idx_clientes_email1: (0, import_pg_core.index)("idx_clientes_email1").using("btree", table.email_1),
      idx_clientes_email2: (0, import_pg_core.index)("idx_clientes_email2").using("btree", table.email_2),
      idx_clientes_email3: (0, import_pg_core.index)("idx_clientes_email3").using("btree", table.email_3),
      idx_clientes_estado_credito: (0, import_pg_core.index)("idx_clientes_estado_credito").using("btree", table.estado_credito),
      idx_clientes_limite_saldo: (0, import_pg_core.index)("idx_clientes_limite_saldo").using("btree", table.limite_credito_int, table.saldo_utilizado_int),
      idx_clientes_tel1: (0, import_pg_core.index)("idx_clientes_tel1").using("btree", table.telefono_1),
      idx_clientes_tel2: (0, import_pg_core.index)("idx_clientes_tel2").using("btree", table.telefono_2),
      idx_clientes_tel3: (0, import_pg_core.index)("idx_clientes_tel3").using("btree", table.telefono_3),
      idx_clientes_tipo_dni_num: (0, import_pg_core.uniqueIndex)("idx_clientes_tipo_dni_num").using("btree", table.tipo_documento_id, table.numero_documento),
      clientes_tipo_documento_id_numero_documento_key: (0, import_pg_core.unique)("clientes_tipo_documento_id_numero_documento_key").on(table.numero_documento, table.tipo_documento_id)
    };
  }
);
const tipo_documento = (0, import_pg_core.pgTable)("tipo_documento", {
  id: (0, import_pg_core.varchar)("id", { length: 2 }).primaryKey().notNull(),
  descripcion: (0, import_pg_core.varchar)("descripcion", { length: 255 }).notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow(),
  abreviatura: (0, import_pg_core.varchar)("abreviatura", { length: 10 })
});
const tokens_autorizacion = (0, import_pg_core.pgTable)("tokens_autorizacion", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  token: (0, import_pg_core.varchar)("token", { length: 10 }).notNull(),
  tipo_uso: (0, import_pg_core.varchar)("tipo_uso", { length: 30 }).notNull(),
  usuario_autorizador_id: (0, import_pg_core.uuid)("usuario_autorizador_id"),
  usuario_solicitante_id: (0, import_pg_core.uuid)("usuario_solicitante_id").notNull(),
  estado: (0, import_pg_core.varchar)("estado", { length: 20 }).default("SOLICITADO").notNull(),
  fecha_expiracion: (0, import_pg_core.timestamp)("fecha_expiracion", { mode: "string" }),
  metadata: (0, import_pg_core.jsonb)("metadata"),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow(),
  used_at: (0, import_pg_core.timestamp)("used_at", { mode: "string" }),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false)
});
const notificaciones = (0, import_pg_core.pgTable)(
  "notificaciones",
  {
    id: (0, import_pg_core.uuid)("id").primaryKey().notNull(),
    branch_id: (0, import_pg_core.uuid)("branch_id"),
    usuario_id: (0, import_pg_core.uuid)("usuario_id"),
    titulo: (0, import_pg_core.varchar)("titulo", { length: 255 }).notNull(),
    mensaje: (0, import_pg_core.text)("mensaje").notNull(),
    tipo: (0, import_pg_core.varchar)("tipo", { length: 50 }).default("info"),
    leido: (0, import_pg_core.boolean)("leido").default(false),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      idx_notificaciones_branch: (0, import_pg_core.index)("idx_notificaciones_branch").using("btree", table.branch_id),
      idx_notificaciones_leido: (0, import_pg_core.index)("idx_notificaciones_leido").using("btree", table.leido),
      idx_notificaciones_usuario: (0, import_pg_core.index)("idx_notificaciones_usuario").using("btree", table.usuario_id)
    };
  }
);
const tipo_operacion = (0, import_pg_core.pgTable)("tipo_operacion", {
  id: (0, import_pg_core.varchar)("id", { length: 5 }).primaryKey().notNull(),
  codigo: (0, import_pg_core.varchar)("codigo", { length: 5 }).notNull(),
  descripcion: (0, import_pg_core.varchar)("descripcion", { length: 255 }).notNull(),
  estado: (0, import_pg_core.boolean)("estado").default(true)
});
const tipo_existencia = (0, import_pg_core.pgTable)("tipo_existencia", {
  id: (0, import_pg_core.varchar)("id", { length: 10 }).primaryKey().notNull(),
  codigo: (0, import_pg_core.varchar)("codigo", { length: 10 }).notNull(),
  descripcion: (0, import_pg_core.varchar)("descripcion", { length: 255 }).notNull(),
  estado: (0, import_pg_core.boolean)("estado").default(true)
});
const tipo_metodo_pago = (0, import_pg_core.pgTable)("tipo_metodo_pago", {
  id: (0, import_pg_core.varchar)("id", { length: 5 }).primaryKey().notNull(),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 50 }).notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const tipo_impuesto = (0, import_pg_core.pgTable)("tipo_impuesto", {
  id: (0, import_pg_core.varchar)("id", { length: 10 }).primaryKey().notNull(),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 100 }).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  valor: (0, import_pg_core.bigint)("valor", { mode: "number" }).notNull(),
  descripcion: (0, import_pg_core.varchar)("descripcion", { length: 255 })
});
const tipo_cambio = (0, import_pg_core.pgTable)(
  "tipo_cambio",
  {
    id: (0, import_pg_core.serial)("id").primaryKey().notNull(),
    fecha: (0, import_pg_core.date)("fecha").notNull(),
    compra: (0, import_pg_core.numeric)("compra", { precision: 10, scale: 3 }).notNull(),
    venta: (0, import_pg_core.numeric)("venta", { precision: 10, scale: 3 }).notNull(),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      idx_tipo_cambio_compra: (0, import_pg_core.index)("idx_tipo_cambio_compra").using("btree", table.compra),
      idx_tipo_cambio_fecha_compra: (0, import_pg_core.index)("idx_tipo_cambio_fecha_compra").using("btree", table.fecha, table.compra),
      idx_tipo_cambio_venta: (0, import_pg_core.index)("idx_tipo_cambio_venta").using("btree", table.venta),
      tipo_cambio_fecha_key: (0, import_pg_core.unique)("tipo_cambio_fecha_key").on(table.fecha)
    };
  }
);
const caja_serie_correlativo = (0, import_pg_core.pgTable)(
  "caja_serie_correlativo",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    identificador_caja: (0, import_pg_core.varchar)("identificador_caja", { length: 50 }),
    nombre: (0, import_pg_core.varchar)("nombre", { length: 50 }).notNull(),
    serie: (0, import_pg_core.varchar)("serie", { length: 10 }).notNull(),
    correlativo: (0, import_pg_core.integer)("correlativo").default(0),
    branch_id: (0, import_pg_core.uuid)("branch_id"),
    tipo_comprobante_id: (0, import_pg_core.varchar)("tipo_comprobante_id", { length: 10 }).references(() => tipo_comprobante.id),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
    activo: (0, import_pg_core.boolean)("activo").default(true),
    tipo_caja: (0, import_pg_core.varchar)("tipo_caja", { length: 20 }).default("ADMINISTRATIVA"),
    usuario_id: (0, import_pg_core.uuid)("usuario_id"),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      idx_caja_serie_correlativo_activas: (0, import_pg_core.index)("idx_caja_serie_correlativo_activas").using("btree", table.branch_id, table.tipo_caja).where(import_drizzle_orm.sql`(activo = true)`),
      idx_caja_serie_correlativo_activo: (0, import_pg_core.index)("idx_caja_serie_correlativo_activo").using("btree", table.activo),
      idx_caja_serie_correlativo_branch: (0, import_pg_core.index)("idx_caja_serie_correlativo_branch").using("btree", table.branch_id),
      idx_caja_serie_correlativo_identificador: (0, import_pg_core.index)("idx_caja_serie_correlativo_identificador").using("btree", table.identificador_caja),
      idx_caja_serie_correlativo_tipo_caja: (0, import_pg_core.index)("idx_caja_serie_correlativo_tipo_caja").using("btree", table.tipo_caja),
      idx_caja_serie_correlativo_tipo_comprobante: (0, import_pg_core.index)("idx_caja_serie_correlativo_tipo_comprobante").using("btree", table.tipo_comprobante_id),
      idx_caja_serie_correlativo_tipo_serie_corr: (0, import_pg_core.index)("idx_caja_serie_correlativo_tipo_serie_corr").using("btree", table.tipo_comprobante_id, table.serie, table.correlativo),
      idx_caja_serie_correlativo_usuario: (0, import_pg_core.index)("idx_caja_serie_correlativo_usuario").using("btree", table.usuario_id),
      uq_cajas_comprobante_serie: (0, import_pg_core.unique)("uq_cajas_comprobante_serie").on(table.serie, table.tipo_comprobante_id)
    };
  }
);
const tipo_comprobante = (0, import_pg_core.pgTable)("tipo_comprobante", {
  id: (0, import_pg_core.varchar)("id", { length: 2 }).primaryKey().notNull(),
  descripcion: (0, import_pg_core.varchar)("descripcion", { length: 100 }).notNull(),
  abreviatura: (0, import_pg_core.varchar)("abreviatura", { length: 10 }),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const tipo_stock = (0, import_pg_core.pgTable)("tipo_stock", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey().notNull(),
  descripcion: (0, import_pg_core.varchar)("descripcion", { length: 150 }).notNull()
});
const tipo_tributos = (0, import_pg_core.pgTable)(
  "tipo_tributos",
  {
    id: (0, import_pg_core.varchar)("id", { length: 10 }).primaryKey().notNull(),
    codigo: (0, import_pg_core.varchar)("codigo", { length: 10 }).notNull(),
    descripcion: (0, import_pg_core.varchar)("descripcion", { length: 255 }).notNull(),
    codigo_internacional: (0, import_pg_core.varchar)("codigo_internacional", { length: 10 }),
    nombre: (0, import_pg_core.varchar)("nombre", { length: 20 })
  },
  (table) => {
    return {
      idx_tipo_tributos_ci: (0, import_pg_core.index)("idx_tipo_tributos_ci").using("btree", table.codigo_internacional),
      idx_tipo_tributos_codigo: (0, import_pg_core.index)("idx_tipo_tributos_codigo").using("btree", table.codigo),
      idx_tipo_tributos_codigo_nombre: (0, import_pg_core.index)("idx_tipo_tributos_codigo_nombre").using("btree", table.codigo, table.nombre),
      idx_tipo_tributos_id_codigo: (0, import_pg_core.index)("idx_tipo_tributos_id_codigo").using("btree", table.id, table.codigo),
      idx_tipo_tributos_nombre: (0, import_pg_core.index)("idx_tipo_tributos_nombre").using("btree", table.nombre)
    };
  }
);
const tipo_bancos = (0, import_pg_core.pgTable)("tipo_bancos", {
  id: (0, import_pg_core.uuid)("id").primaryKey().notNull(),
  banco: (0, import_pg_core.varchar)("banco", { length: 100 }).notNull(),
  numero_cuenta: (0, import_pg_core.varchar)("numero_cuenta", { length: 100 }).notNull(),
  cci: (0, import_pg_core.varchar)("cci", { length: 100 }),
  tipo_moneda: (0, import_pg_core.varchar)("tipo_moneda", { length: 10 }).default("PEN").notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow(),
  es_detraccion: (0, import_pg_core.boolean)("es_detraccion").default(false)
});
const tipo_moneda = (0, import_pg_core.pgTable)(
  "tipo_moneda",
  {
    id: (0, import_pg_core.varchar)("id", { length: 3 }).primaryKey().notNull(),
    iso: (0, import_pg_core.varchar)("iso", { length: 3 }).notNull(),
    descripcion: (0, import_pg_core.varchar)("descripcion", { length: 50 }).notNull(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      uq_tipomoneda_iso: (0, import_pg_core.unique)("uq_tipomoneda_iso").on(table.iso)
    };
  }
);
const tipo_pago = (0, import_pg_core.pgTable)("tipo_pago", {
  id: (0, import_pg_core.varchar)("id", { length: 2 }).primaryKey().notNull(),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 50 }).notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const tipo_codigos_detraccion = (0, import_pg_core.pgTable)(
  "tipo_codigos_detraccion",
  {
    codigo: (0, import_pg_core.varchar)("codigo", { length: 10 }).primaryKey().notNull(),
    codigo_sunat: (0, import_pg_core.varchar)("codigo_sunat", { length: 10 }).notNull(),
    descripcion: (0, import_pg_core.varchar)("descripcion", { length: 255 }).notNull(),
    porcentaje: (0, import_pg_core.numeric)("porcentaje", { precision: 5, scale: 2 }).notNull(),
    activo: (0, import_pg_core.boolean)("activo").default(true),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      idx_codigos_detraccion_activo: (0, import_pg_core.index)("idx_codigos_detraccion_activo").using("btree", table.activo),
      idx_codigos_detraccion_desc: (0, import_pg_core.index)("idx_codigos_detraccion_desc").using("btree", table.descripcion),
      idx_codigos_detraccion_porcentaje: (0, import_pg_core.index)("idx_codigos_detraccion_porcentaje").using("btree", table.porcentaje),
      idx_codigos_detraccion_sunat: (0, import_pg_core.index)("idx_codigos_detraccion_sunat").using("btree", table.codigo_sunat),
      idx_codigos_detraccion_sunat_activo: (0, import_pg_core.index)("idx_codigos_detraccion_sunat_activo").using("btree", table.codigo_sunat, table.activo)
    };
  }
);
const tipo_factores = (0, import_pg_core.pgTable)(
  "tipo_factores",
  {
    id: (0, import_pg_core.serial)("id").primaryKey().notNull(),
    codigo: (0, import_pg_core.varchar)("codigo", { length: 50 }).notNull(),
    valor: (0, import_pg_core.integer)("valor").notNull(),
    descripcion: (0, import_pg_core.text)("descripcion"),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      factores_codigo_key: (0, import_pg_core.unique)("factores_codigo_key").on(table.codigo)
    };
  }
);
const empresas = (0, import_pg_core.pgTable)(
  "empresas",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    ruc: (0, import_pg_core.varchar)("ruc", { length: 11 }).notNull(),
    razon_social: (0, import_pg_core.varchar)("razon_social", { length: 150 }).notNull(),
    nombre_comercial: (0, import_pg_core.varchar)("nombre_comercial", { length: 200 }),
    ubigeo: (0, import_pg_core.varchar)("ubigeo", { length: 6 }),
    direccion: (0, import_pg_core.varchar)("direccion", { length: 255 }),
    telefono1: (0, import_pg_core.varchar)("telefono1", { length: 20 }),
    telefono2: (0, import_pg_core.varchar)("telefono2", { length: 20 }),
    email1: (0, import_pg_core.varchar)("email1", { length: 20 }),
    email2: (0, import_pg_core.varchar)("email2", { length: 20 }),
    activo: (0, import_pg_core.boolean)("activo").default(true),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
    created_at: (0, import_pg_core.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true, mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      idx_empresas_ruc: (0, import_pg_core.index)("idx_empresas_ruc").using("btree", table.ruc)
    };
  }
);
const sucursales = (0, import_pg_core.pgTable)(
  "sucursales",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    empresa_id: (0, import_pg_core.uuid)("empresa_id"),
    ruc: (0, import_pg_core.varchar)("ruc", { length: 11 }).notNull(),
    razon_social: (0, import_pg_core.varchar)("razon_social", { length: 150 }).notNull(),
    nombre_comercial: (0, import_pg_core.varchar)("nombre_comercial", { length: 150 }),
    sucursal_nombre: (0, import_pg_core.varchar)("sucursal_nombre", { length: 150 }),
    direccion: (0, import_pg_core.varchar)("direccion", { length: 255 }),
    ubigeo: (0, import_pg_core.varchar)("ubigeo", { length: 6 }),
    codigo_anexo: (0, import_pg_core.varchar)("codigo_anexo", { length: 4 }),
    telefono1: (0, import_pg_core.varchar)("telefono1", { length: 20 }),
    telefono2: (0, import_pg_core.varchar)("telefono2", { length: 20 }),
    email1: (0, import_pg_core.varchar)("email1", { length: 20 }),
    email2: (0, import_pg_core.varchar)("email2", { length: 20 }),
    sire_ruc: (0, import_pg_core.varchar)("sire_ruc", { length: 11 }),
    sire_usuario_sol: (0, import_pg_core.varchar)("sire_usuario_sol", { length: 50 }),
    sire_clave_sol: (0, import_pg_core.varchar)("sire_clave_sol", { length: 100 }),
    sire_client_id: (0, import_pg_core.varchar)("sire_client_id", { length: 250 }),
    sire_client_secret: (0, import_pg_core.varchar)("sire_client_secret", { length: 250 }),
    sire_ultimo_sync: (0, import_pg_core.timestamp)("sire_ultimo_sync", { withTimezone: true, mode: "string" }).defaultNow(),
    activo: (0, import_pg_core.boolean)("activo").default(true),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
    created_at: (0, import_pg_core.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true, mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      idx_sucursales_empresa_id: (0, import_pg_core.index)("idx_sucursales_empresa_id").using("btree", table.empresa_id),
      idx_sucursales_ruc: (0, import_pg_core.index)("idx_sucursales_ruc").using("btree", table.ruc)
    };
  }
);
const permisos = (0, import_pg_core.pgTable)(
  "permisos",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    modulo_id: (0, import_pg_core.uuid)("modulo_id").notNull(),
    codigo: (0, import_pg_core.varchar)("codigo", { length: 100 }).notNull(),
    nombre: (0, import_pg_core.varchar)("nombre", { length: 150 }).notNull(),
    descripcion: (0, import_pg_core.text)("descripcion"),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
  },
  (table) => {
    return {
      permisos_codigo_key: (0, import_pg_core.unique)("permisos_codigo_key").on(table.codigo)
    };
  }
);
const tipo_motivo_traslado = (0, import_pg_core.pgTable)("tipo_motivo_traslado", {
  id: (0, import_pg_core.varchar)("id", { length: 5 }).primaryKey().notNull(),
  codigo_sunat: (0, import_pg_core.varchar)("codigo_sunat", { length: 5 }).notNull(),
  descripcion: (0, import_pg_core.varchar)("descripcion", { length: 250 }).notNull(),
  mueve_stock: (0, import_pg_core.boolean)("mueve_stock").default(true),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const usuario_accesos = (0, import_pg_core.pgTable)("usuario_accesos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  empresa_id: (0, import_pg_core.uuid)("empresa_id").notNull(),
  rol_id: (0, import_pg_core.uuid)("rol_id").notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  es_predeterminado: (0, import_pg_core.boolean)("es_predeterminado").default(false),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const modulos = (0, import_pg_core.pgTable)(
  "modulos",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    codigo: (0, import_pg_core.varchar)("codigo", { length: 50 }).notNull(),
    nombre: (0, import_pg_core.varchar)("nombre", { length: 100 }).notNull(),
    descripcion: (0, import_pg_core.text)("descripcion"),
    activo: (0, import_pg_core.boolean)("activo").default(true),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
  },
  (table) => {
    return {
      modulos_codigo_key: (0, import_pg_core.unique)("modulos_codigo_key").on(table.codigo)
    };
  }
);
const empresa_modulos = (0, import_pg_core.pgTable)("empresa_modulos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  empresa_id: (0, import_pg_core.uuid)("empresa_id").notNull(),
  modulo_id: (0, import_pg_core.uuid)("modulo_id").notNull(),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const roles = (0, import_pg_core.pgTable)("roles", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  empresa_id: (0, import_pg_core.uuid)("empresa_id").notNull(),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 100 }).notNull(),
  descripcion: (0, import_pg_core.text)("descripcion"),
  nivel: (0, import_pg_core.integer)("nivel").default(100).notNull(),
  es_sistema: (0, import_pg_core.boolean)("es_sistema").default(false),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const rol_permisos = (0, import_pg_core.pgTable)("rol_permisos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  rol_id: (0, import_pg_core.uuid)("rol_id").notNull(),
  permiso_id: (0, import_pg_core.uuid)("permiso_id").notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const usuario_permisos = (0, import_pg_core.pgTable)("usuario_permisos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  acceso_id: (0, import_pg_core.uuid)("acceso_id").notNull(),
  permiso_id: (0, import_pg_core.uuid)("permiso_id").notNull(),
  permitido: (0, import_pg_core.boolean)("permitido").default(true).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const almacenes = (0, import_pg_core.pgTable)("almacenes", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 200 }).notNull(),
  direccion: (0, import_pg_core.varchar)("direccion", { length: 260 }),
  codigo: (0, import_pg_core.varchar)("codigo", { length: 50 }),
  es_principal: (0, import_pg_core.boolean)("es_principal").default(false),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true, mode: "string" }).defaultNow()
});
const productos = (0, import_pg_core.pgTable)("productos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 150 }).notNull(),
  descripcion: (0, import_pg_core.text)("descripcion"),
  palabra_clave: (0, import_pg_core.varchar)("palabra_clave", { length: 255 }),
  codigo_barra: (0, import_pg_core.varchar)("codigo_barra", { length: 100 }),
  es_facturable: (0, import_pg_core.boolean)("es_facturable").default(true),
  es_vendible: (0, import_pg_core.boolean)("es_vendible").default(true),
  es_insumo: (0, import_pg_core.boolean)("es_insumo").default(false),
  es_producido: (0, import_pg_core.boolean)("es_producido").default(false),
  es_combo: (0, import_pg_core.boolean)("es_combo").default(false),
  unidad_medida_id: (0, import_pg_core.varchar)("unidad_medida_id", { length: 5 }),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  codigo_sunat: (0, import_pg_core.varchar)("codigo_sunat", { length: 50 }),
  stock_minimo: (0, import_pg_core.integer)("stock_minimo").default(0),
  categoria: (0, import_pg_core.uuid)("categoria"),
  sub_categoria: (0, import_pg_core.uuid)("sub_categoria"),
  tipo_existencia: (0, import_pg_core.uuid)("tipo_existencia"),
  tipo_tributo: (0, import_pg_core.uuid)("tipo_tributo")
});
const presentaciones = (0, import_pg_core.pgTable)("presentaciones", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  producto_uuid: (0, import_pg_core.uuid)("producto_uuid"),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 250 }).notNull(),
  cod_barra: (0, import_pg_core.varchar)("cod_barra", { length: 200 }),
  palabra_clave: (0, import_pg_core.varchar)("palabra_clave", { length: 255 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  unidad_medida_id: (0, import_pg_core.bigint)("unidad_medida_id", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  multiplica_por: (0, import_pg_core.bigint)("multiplica_por", { mode: "number" }).default(1),
  ubicacion: (0, import_pg_core.varchar)("ubicacion", { length: 100 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_costo: (0, import_pg_core.bigint)("precio_costo", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_venta: (0, import_pg_core.bigint)("precio_venta", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_mayor: (0, import_pg_core.bigint)("precio_mayor", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_especial: (0, import_pg_core.bigint)("precio_especial", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_otros: (0, import_pg_core.bigint)("precio_otros", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  descuento_predefinido: (0, import_pg_core.bigint)("descuento_predefinido", { mode: "number" }).default(0),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true, mode: "string" }).defaultNow()
});
const stock = (0, import_pg_core.pgTable)("stock", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id"),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  lotes_id: (0, import_pg_core.uuid)("lotes_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  multiplica_por: (0, import_pg_core.integer)("multiplica_por").default(1),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad_base: (0, import_pg_core.bigint)("cantidad_base", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  saldo: (0, import_pg_core.bigint)("saldo", { mode: "number" }).default(0),
  documento_id: (0, import_pg_core.uuid)("documento_id"),
  documento: (0, import_pg_core.varchar)("documento", { length: 100 }),
  tipo_mov: (0, import_pg_core.integer)("tipo_mov"),
  concepto: (0, import_pg_core.varchar)("concepto", { length: 255 }),
  usuario_id: (0, import_pg_core.uuid)("usuario_id"),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  almacen_id: (0, import_pg_core.uuid)("almacen_id"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true, mode: "string" }).defaultNow()
});
const stock_actual = (0, import_pg_core.pgTable)("stock_actual", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  almacen_id: (0, import_pg_core.uuid)("almacen_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id").notNull(),
  lotes_id: (0, import_pg_core.uuid)("lotes_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  saldo_actual: (0, import_pg_core.bigint)("saldo_actual", { mode: "number" }).default(0).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const proveedores = (0, import_pg_core.pgTable)(
  "proveedores",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    branch_id: (0, import_pg_core.uuid)("branch_id"),
    ruc: (0, import_pg_core.varchar)("ruc", { length: 11 }).notNull(),
    razon_social: (0, import_pg_core.varchar)("razon_social", { length: 200 }).notNull(),
    nombre_comercial: (0, import_pg_core.varchar)("nombre_comercial", { length: 200 }),
    direccion: (0, import_pg_core.varchar)("direccion", { length: 255 }),
    ubigeo: (0, import_pg_core.varchar)("ubigeo", { length: 6 }),
    email: (0, import_pg_core.varchar)("email", { length: 150 }),
    telefono: (0, import_pg_core.varchar)("telefono", { length: 50 }),
    persona_contacto: (0, import_pg_core.varchar)("persona_contacto", { length: 150 }),
    es_mercaderia: (0, import_pg_core.boolean)("es_mercaderia").default(false),
    es_servicio: (0, import_pg_core.boolean)("es_servicio").default(false),
    es_activo: (0, import_pg_core.boolean)("es_activo").default(false),
    es_comisiones: (0, import_pg_core.boolean)("es_comisiones").default(false),
    activo: (0, import_pg_core.boolean)("activo").default(true),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(true),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      proveedores_ruc_key: (0, import_pg_core.unique)("proveedores_ruc_key").on(table.ruc)
    };
  }
);
const productos_proveedores = (0, import_pg_core.pgTable)("productos_proveedores", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  IdProducto: (0, import_pg_core.uuid)("IdProducto").notNull(),
  IdProveedor: (0, import_pg_core.uuid)("IdProveedor").notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(true),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const categorias = (0, import_pg_core.pgTable)("categorias", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 50 }).notNull(),
  activo: (0, import_pg_core.boolean)("activo").default(true).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(true),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const subcategoria = (0, import_pg_core.pgTable)("subcategoria", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  idcategoria: (0, import_pg_core.uuid)("idcategoria").notNull(),
  Nombre: (0, import_pg_core.varchar)("Nombre", { length: 50 }).notNull(),
  activo: (0, import_pg_core.boolean)("activo").default(true).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(true),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const mensajeticket = (0, import_pg_core.pgTable)("mensajeticket", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  mensaje: (0, import_pg_core.varchar)("mensaje", { length: 250 }).notNull()
});
const caja_turnos = (0, import_pg_core.pgTable)("caja_turnos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  caja_serie_correlativo_id: (0, import_pg_core.uuid)("caja_serie_correlativo_id").notNull(),
  identificador_caja: (0, import_pg_core.varchar)("identificador_caja", { length: 10 }).notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  fecha_apertura: (0, import_pg_core.timestamp)("fecha_apertura", { mode: "string" }).defaultNow(),
  fecha_cierre_f: (0, import_pg_core.timestamp)("fecha_cierre_f", { mode: "string" }),
  estado: (0, import_pg_core.varchar)("estado", { length: 20 }).default("ABIERTA"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const caja_totales = (0, import_pg_core.pgTable)("caja_totales", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  caja_turno_id: (0, import_pg_core.uuid)("caja_turno_id").notNull(),
  metodo_pago_id: (0, import_pg_core.varchar)("metodo_pago_id", { length: 5 }).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_apertura: (0, import_pg_core.bigint)("monto_apertura", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_sistema: (0, import_pg_core.bigint)("monto_sistema", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_declarado: (0, import_pg_core.bigint)("monto_declarado", { mode: "number" }).default(0),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  diferencia: (0, import_pg_core.bigint)("diferencia", { mode: "number" }).default(0),
  observacion: (0, import_pg_core.text)("observacion"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const caja_movimientos = (0, import_pg_core.pgTable)("caja_movimientos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  caja_turno_id: (0, import_pg_core.uuid)("caja_turno_id").notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  tipo_movimiento: (0, import_pg_core.varchar)("tipo_movimiento", { length: 20 }).notNull(),
  concepto: (0, import_pg_core.varchar)("concepto", { length: 150 }).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_total: (0, import_pg_core.bigint)("monto_total", { mode: "number" }).default(0).notNull(),
  observacion: (0, import_pg_core.text)("observacion"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const caja_arqueos = (0, import_pg_core.pgTable)("caja_arqueos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  caja_turno_id: (0, import_pg_core.uuid)("caja_turno_id").notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  denominacion: (0, import_pg_core.bigint)("denominacion", { mode: "number" }).notNull(),
  cantidad: (0, import_pg_core.integer)("cantidad").default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const bancos = (0, import_pg_core.pgTable)("bancos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  banco: (0, import_pg_core.varchar)("banco", { length: 100 }).notNull(),
  numero_cuenta: (0, import_pg_core.varchar)("numero_cuenta", { length: 100 }).notNull(),
  cci: (0, import_pg_core.varchar)("cci", { length: 100 }),
  tipo_moneda: (0, import_pg_core.varchar)("tipo_moneda", { length: 10 }).default("PEN").notNull(),
  es_detraccion: (0, import_pg_core.boolean)("es_detraccion").default(false),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compra_requerimiento = (0, import_pg_core.pgTable)("compra_requerimiento", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  serie: (0, import_pg_core.varchar)("serie", { length: 20 }).notNull(),
  correlativo: (0, import_pg_core.varchar)("correlativo", { length: 20 }).notNull(),
  id_usuario: (0, import_pg_core.uuid)("id_usuario").notNull(),
  fecha_emision: (0, import_pg_core.timestamp)("fecha_emision", { mode: "string" }).defaultNow().notNull(),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).notNull(),
  observaciones: (0, import_pg_core.text)("observaciones"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compra_requerimiento_detalle = (0, import_pg_core.pgTable)("compra_requerimiento_detalle", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  id_requerimiento: (0, import_pg_core.uuid)("id_requerimiento").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad_aprobada: (0, import_pg_core.bigint)("cantidad_aprobada", { mode: "number" }).default(0),
  observacion: (0, import_pg_core.varchar)("observacion", { length: 255 }),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compra_cotizacion = (0, import_pg_core.pgTable)("compra_cotizacion", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  id_requerimiento: (0, import_pg_core.uuid)("id_requerimiento"),
  id_proveedor: (0, import_pg_core.uuid)("id_proveedor").notNull(),
  codigo_cotizacion: (0, import_pg_core.varchar)("codigo_cotizacion", { length: 50 }).notNull(),
  fecha_cotizacion: (0, import_pg_core.date)("fecha_cotizacion").notNull(),
  id_moneda: (0, import_pg_core.varchar)("id_moneda", { length: 3 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tipo_cambio: (0, import_pg_core.bigint)("tipo_cambio", { mode: "number" }).default(1),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  impuesto: (0, import_pg_core.bigint)("impuesto", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).notNull(),
  observaciones: (0, import_pg_core.text)("observaciones"),
  archivo_xml: (0, import_pg_core.text)("archivo_xml"),
  archivo_cdr: (0, import_pg_core.text)("archivo_cdr"),
  archivo_pdf: (0, import_pg_core.text)("archivo_pdf"),
  texto_extraido: (0, import_pg_core.text)("texto_extraido"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compra_cotizacion_detalle = (0, import_pg_core.pgTable)("compra_cotizacion_detalle", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  id_cotizacion: (0, import_pg_core.uuid)("id_cotizacion").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_unitario: (0, import_pg_core.bigint)("precio_unitario", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  codigo_sku_proveedor: (0, import_pg_core.varchar)("codigo_sku_proveedor", { length: 100 }),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compra_orden = (0, import_pg_core.pgTable)("compra_orden", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  id_cotizacion: (0, import_pg_core.uuid)("id_cotizacion"),
  id_proveedor: (0, import_pg_core.uuid)("id_proveedor").notNull(),
  id_usuario: (0, import_pg_core.uuid)("id_usuario").notNull(),
  contacto: (0, import_pg_core.varchar)("contacto", { length: 50 }),
  serie: (0, import_pg_core.varchar)("serie", { length: 20 }).notNull(),
  correlativo: (0, import_pg_core.varchar)("correlativo", { length: 20 }).notNull(),
  fecha_emision: (0, import_pg_core.date)("fecha_emision").notNull(),
  fecha_entrega_esperada: (0, import_pg_core.date)("fecha_entrega_esperada"),
  condicion_pago: (0, import_pg_core.varchar)("condicion_pago", { length: 50 }).notNull(),
  id_moneda: (0, import_pg_core.varchar)("id_moneda", { length: 3 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tipo_cambio: (0, import_pg_core.bigint)("tipo_cambio", { mode: "number" }).default(1),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  impuesto: (0, import_pg_core.bigint)("impuesto", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).notNull(),
  observaciones: (0, import_pg_core.text)("observaciones"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compra_orden_detalle = (0, import_pg_core.pgTable)("compra_orden_detalle", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  id_orden_compra: (0, import_pg_core.uuid)("id_orden_compra").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad_recibida: (0, import_pg_core.bigint)("cantidad_recibida", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_unitario: (0, import_pg_core.bigint)("precio_unitario", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compra = (0, import_pg_core.pgTable)("compra", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  id_orden_compra: (0, import_pg_core.uuid)("id_orden_compra"),
  id_proveedor: (0, import_pg_core.uuid)("id_proveedor").notNull(),
  id_usuario: (0, import_pg_core.uuid)("id_usuario").notNull(),
  tipo_comprobante_id: (0, import_pg_core.varchar)("tipo_comprobante_id", { length: 2 }).notNull(),
  serie: (0, import_pg_core.varchar)("serie", { length: 10 }).notNull(),
  id_moneda: (0, import_pg_core.varchar)("id_moneda", { length: 3 }),
  correlativo: (0, import_pg_core.varchar)("correlativo", { length: 20 }).notNull(),
  fecha_emision: (0, import_pg_core.date)("fecha_emision").notNull(),
  fecha_vencimiento: (0, import_pg_core.date)("fecha_vencimiento").notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tipo_cambio: (0, import_pg_core.bigint)("tipo_cambio", { mode: "number" }).default(1),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  tipo_pago: (0, import_pg_core.varchar)("tipo_pago", { length: 2 }).default("1").notNull(),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).default("ACEPTADO").notNull(),
  estado_pago: (0, import_pg_core.varchar)("estado_pago", { length: 30 }).default("PENDIENTE").notNull(),
  estado_sunat: (0, import_pg_core.varchar)("estado_sunat", { length: 30 }).default("REGISTRADO").notNull(),
  archivo_xml: (0, import_pg_core.text)("archivo_xml"),
  archivo_cdr: (0, import_pg_core.text)("archivo_cdr"),
  archivo_pdf: (0, import_pg_core.text)("archivo_pdf"),
  sire_id: (0, import_pg_core.uuid)("sire_id"),
  periodo: (0, import_pg_core.varchar)("periodo", { length: 6 }),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compra_detalle = (0, import_pg_core.pgTable)("compra_detalle", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  id_compra: (0, import_pg_core.uuid)("id_compra").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_unitario: (0, import_pg_core.bigint)("precio_unitario", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  descripcion_proveedor: (0, import_pg_core.varchar)("descripcion_proveedor", { length: 255 }),
  codigo_sku_proveedor: (0, import_pg_core.varchar)("codigo_sku_proveedor", { length: 100 }),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compras_pagos = (0, import_pg_core.pgTable)("compras_pagos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  id_usuario: (0, import_pg_core.uuid)("id_usuario").notNull(),
  compra_id: (0, import_pg_core.uuid)("compra_id").notNull(),
  numero_cuota: (0, import_pg_core.integer)("numero_cuota").default(1).notNull(),
  metodo_pago_id: (0, import_pg_core.varchar)("metodo_pago_id", { length: 5 }).notNull(),
  banco_id: (0, import_pg_core.uuid)("banco_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto: (0, import_pg_core.bigint)("monto", { mode: "number" }).default(0).notNull(),
  fecha_programada: (0, import_pg_core.date)("fecha_programada"),
  fecha_pago: (0, import_pg_core.timestamp)("fecha_pago", { mode: "string" }),
  numero_operacion: (0, import_pg_core.varchar)("numero_operacion", { length: 100 }),
  observacion: (0, import_pg_core.text)("observacion"),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).default("PAGADO").notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const compras_sire = (0, import_pg_core.pgTable)("compras_sire", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  proveedor_ruc: (0, import_pg_core.varchar)("proveedor_ruc", { length: 20 }).notNull(),
  proveedor_nombre: (0, import_pg_core.varchar)("proveedor_nombre", { length: 250 }).notNull(),
  tipo_comprobante: (0, import_pg_core.varchar)("tipo_comprobante", { length: 5 }).notNull(),
  serie: (0, import_pg_core.varchar)("serie", { length: 20 }).notNull(),
  correlativo: (0, import_pg_core.varchar)("correlativo", { length: 20 }).notNull(),
  fecha_emision: (0, import_pg_core.date)("fecha_emision").notNull(),
  fecha_vencimiento: (0, import_pg_core.date)("fecha_vencimiento"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_neto: (0, import_pg_core.bigint)("monto_neto", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_igv: (0, import_pg_core.bigint)("monto_igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_total: (0, import_pg_core.bigint)("monto_total", { mode: "number" }).default(0).notNull(),
  moneda: (0, import_pg_core.varchar)("moneda", { length: 5 }).default("PEN"),
  estado_reconciliacion: (0, import_pg_core.varchar)("estado_reconciliacion", { length: 20 }).default("PENDIENTE"),
  orden_compra_id: (0, import_pg_core.uuid)("orden_compra_id"),
  periodo: (0, import_pg_core.varchar)("periodo", { length: 6 }).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow(),
  tipo_adquisicion: (0, import_pg_core.varchar)("tipo_adquisicion", { length: 30 }).default("MERCADERIA"),
  aplica_detraccion: (0, import_pg_core.boolean)("aplica_detraccion").default(false),
  tasa_detraccion: (0, import_pg_core.numeric)("tasa_detraccion", { precision: 5, scale: 2 }).default("0.00"),
  monto_detraccion: (0, import_pg_core.numeric)("monto_detraccion", { precision: 12, scale: 4 }).default("0.0000"),
  comisiones: (0, import_pg_core.numeric)("comisiones", { precision: 10, scale: 2 }).default("0"),
  archivo_xml: (0, import_pg_core.text)("archivo_xml"),
  archivo_pdf: (0, import_pg_core.text)("archivo_pdf"),
  estado_descarga_archivos: (0, import_pg_core.varchar)("estado_descarga_archivos", { length: 20 }).default("PENDIENTE")
});
const movimiento_almacen = (0, import_pg_core.pgTable)("movimiento_almacen", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  id_almacen_destino: (0, import_pg_core.uuid)("id_almacen_destino").notNull(),
  id_almacen_origen: (0, import_pg_core.uuid)("id_almacen_origen"),
  id_usuario: (0, import_pg_core.uuid)("id_usuario").notNull(),
  id_usuario_aprobador: (0, import_pg_core.uuid)("id_usuario_aprobador"),
  id_proveedor: (0, import_pg_core.uuid)("id_proveedor"),
  id_tipo_transaccion: (0, import_pg_core.varchar)("id_tipo_transaccion", { length: 10 }).notNull(),
  id_compra: (0, import_pg_core.uuid)("id_compra"),
  id_nota_egreso: (0, import_pg_core.uuid)("id_nota_egreso"),
  id_guia_remision: (0, import_pg_core.uuid)("id_guia_remision"),
  fecha_movimiento: (0, import_pg_core.timestamp)("fecha_movimiento", { mode: "string" }).defaultNow().notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tipo_movimiento: (0, import_pg_core.bigint)("tipo_movimiento", { mode: "number" }),
  observacion: (0, import_pg_core.text)("observacion"),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).default("REGISTRADO").notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const movimiento_almacen_detalle = (0, import_pg_core.pgTable)("movimiento_almacen_detalle", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  movimiento_almacen_id: (0, import_pg_core.uuid)("movimiento_almacen_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  lote_id: (0, import_pg_core.uuid)("lote_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_unitario: (0, import_pg_core.bigint)("precio_unitario", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  observacion: (0, import_pg_core.varchar)("observacion", { length: 255 }),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const recetas = (0, import_pg_core.pgTable)("recetas", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 150 }).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad_producida: (0, import_pg_core.bigint)("cantidad_producida", { mode: "number" }).default(1).notNull(),
  observacion: (0, import_pg_core.text)("observacion"),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const recetas_detalles = (0, import_pg_core.pgTable)("recetas_detalles", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  receta_id: (0, import_pg_core.uuid)("receta_id").notNull(),
  producto_insumo_id: (0, import_pg_core.uuid)("producto_insumo_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const lotes = (0, import_pg_core.pgTable)("lotes", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  id_usuario: (0, import_pg_core.uuid)("id_usuario").notNull(),
  codigo_lote: (0, import_pg_core.varchar)("codigo_lote", { length: 100 }).notNull(),
  fecha_fabricacion: (0, import_pg_core.date)("fecha_fabricacion"),
  fecha_vencimiento: (0, import_pg_core.date)("fecha_vencimiento"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  costo_unitario: (0, import_pg_core.bigint)("costo_unitario", { mode: "number" }).default(0).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const ventas_sire = (0, import_pg_core.pgTable)("ventas_sire", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  cliente_tipo_documento: (0, import_pg_core.varchar)("cliente_tipo_documento", { length: 5 }),
  cliente_ruc: (0, import_pg_core.varchar)("cliente_ruc", { length: 20 }),
  cliente_nombre: (0, import_pg_core.varchar)("cliente_nombre", { length: 250 }),
  tipo_comprobante: (0, import_pg_core.varchar)("tipo_comprobante", { length: 2 }).notNull(),
  serie: (0, import_pg_core.varchar)("serie", { length: 10 }).notNull(),
  correlativo: (0, import_pg_core.varchar)("correlativo", { length: 20 }).notNull(),
  fecha_emision: (0, import_pg_core.date)("fecha_emision").notNull(),
  fecha_vencimiento: (0, import_pg_core.date)("fecha_vencimiento"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_neto: (0, import_pg_core.bigint)("monto_neto", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_igv: (0, import_pg_core.bigint)("monto_igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_total: (0, import_pg_core.bigint)("monto_total", { mode: "number" }).default(0).notNull(),
  moneda: (0, import_pg_core.varchar)("moneda", { length: 5 }).default("PEN"),
  estado_reconciliacion: (0, import_pg_core.varchar)("estado_reconciliacion", { length: 20 }).default("PENDIENTE"),
  periodo: (0, import_pg_core.varchar)("periodo", { length: 6 }).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  venta_id: (0, import_pg_core.uuid)("venta_id"),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const pre_ventas = (0, import_pg_core.pgTable)("pre_ventas", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  estado: (0, import_pg_core.varchar)("estado", { length: 20 }),
  caja_id: (0, import_pg_core.uuid)("caja_id"),
  caja_turno_id: (0, import_pg_core.uuid)("caja_turno_id"),
  usuario_id: (0, import_pg_core.uuid)("usuario_id"),
  cliente_id: (0, import_pg_core.uuid)("cliente_id"),
  correo_cliente: (0, import_pg_core.varchar)("correo_cliente", { length: 120 }),
  alias: (0, import_pg_core.varchar)("alias", { length: 15 }),
  tipo_comprobante_id: (0, import_pg_core.varchar)("tipo_comprobante_id", { length: 2 }),
  tipo_pago_id: (0, import_pg_core.varchar)("tipo_pago_id", { length: 2 }).default("1"),
  moneda: (0, import_pg_core.varchar)("moneda", { length: 3 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tipo_cambio: (0, import_pg_core.bigint)("tipo_cambio", { mode: "number" }).default(1),
  fecha_emision: (0, import_pg_core.timestamp)("fecha_emision", { mode: "string" }).defaultNow(),
  fecha_vencimiento: (0, import_pg_core.timestamp)("fecha_vencimiento", { mode: "string" }).defaultNow(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  gravadas: (0, import_pg_core.bigint)("gravadas", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  exoneradas: (0, import_pg_core.bigint)("exoneradas", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  inafectas: (0, import_pg_core.bigint)("inafectas", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total_venta: (0, import_pg_core.bigint)("total_venta", { mode: "number" }),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const detalle_pre_ventas = (0, import_pg_core.pgTable)("detalle_pre_ventas", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  preventa_id: (0, import_pg_core.uuid)("preventa_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id").notNull(),
  lote_id: (0, import_pg_core.uuid)("lote_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_unitario: (0, import_pg_core.bigint)("precio_unitario", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const ventas = (0, import_pg_core.pgTable)(
  "ventas",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
    preventa_id: (0, import_pg_core.uuid)("preventa_id"),
    caja_id: (0, import_pg_core.uuid)("caja_id"),
    caja_turno_id: (0, import_pg_core.uuid)("caja_turno_id"),
    usuario_id: (0, import_pg_core.uuid)("usuario_id"),
    cliente_id: (0, import_pg_core.uuid)("cliente_id"),
    correo_cliente: (0, import_pg_core.varchar)("correo_cliente", { length: 120 }),
    alias: (0, import_pg_core.varchar)("alias", { length: 15 }),
    tipo_comprobante_id: (0, import_pg_core.varchar)("tipo_comprobante_id", { length: 2 }),
    serie: (0, import_pg_core.varchar)("serie", { length: 10 }),
    correlativo: (0, import_pg_core.integer)("correlativo"),
    fecha_emision: (0, import_pg_core.timestamp)("fecha_emision", { mode: "string" }).defaultNow(),
    fecha_vencimiento: (0, import_pg_core.timestamp)("fecha_vencimiento", { mode: "string" }).defaultNow(),
    moneda: (0, import_pg_core.varchar)("moneda", { length: 3 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    tipo_cambio: (0, import_pg_core.bigint)("tipo_cambio", { mode: "number" }).default(1),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    gravadas: (0, import_pg_core.bigint)("gravadas", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    exoneradas: (0, import_pg_core.bigint)("exoneradas", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    inafectas: (0, import_pg_core.bigint)("inafectas", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    igv: (0, import_pg_core.bigint)("igv", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    total_venta: (0, import_pg_core.bigint)("total_venta", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    descuento: (0, import_pg_core.bigint)("descuento", { mode: "number" }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    gratuitas: (0, import_pg_core.bigint)("gratuitas", { mode: "number" }).default(0),
    observacion_venta: (0, import_pg_core.text)("observacion_venta"),
    estado: (0, import_pg_core.varchar)("estado", { length: 20 }).default("EMITIDO"),
    tipo_pago_id: (0, import_pg_core.varchar)("tipo_pago_id", { length: 2 }).default("1"),
    impuesto_id: (0, import_pg_core.varchar)("impuesto_id", { length: 10 }),
    tipo_operacion_id: (0, import_pg_core.varchar)("tipo_operacion_id", { length: 5 }).default("1"),
    estado_pago: (0, import_pg_core.varchar)("estado_pago", { length: 20 }).default("PAGADO"),
    facturado: (0, import_pg_core.boolean)("facturado").default(false),
    ventas_facturacion_id: (0, import_pg_core.uuid)("ventas_facturacion_id"),
    xml_url: (0, import_pg_core.varchar)("xml_url", { length: 500 }),
    cdr_url: (0, import_pg_core.varchar)("cdr_url", { length: 500 }),
    pdf_url: (0, import_pg_core.varchar)("pdf_url", { length: 500 }),
    intentos_envio: (0, import_pg_core.integer)("intentos_envio").default(0),
    observacion_sunat: (0, import_pg_core.text)("observacion_sunat"),
    payment_info: (0, import_pg_core.jsonb)("payment_info"),
    detraccion_info: (0, import_pg_core.jsonb)("detraccion_info"),
    baja_ticket: (0, import_pg_core.varchar)("baja_ticket", { length: 250 }),
    baja_cdr_url: (0, import_pg_core.varchar)("baja_cdr_url", { length: 500 }),
    baja_xml_url: (0, import_pg_core.varchar)("baja_xml_url", { length: 500 }),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      ventas_preventa_id_key: (0, import_pg_core.unique)("ventas_preventa_id_key").on(table.preventa_id)
    };
  }
);
const detalle_ventas = (0, import_pg_core.pgTable)("detalle_ventas", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  venta_id: (0, import_pg_core.uuid)("venta_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  lote_id: (0, import_pg_core.uuid)("lote_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_unitario: (0, import_pg_core.bigint)("precio_unitario", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  descuento: (0, import_pg_core.bigint)("descuento", { mode: "number" }).default(0),
  tipo_afectacion_igv: (0, import_pg_core.smallint)("tipo_afectacion_igv").default(10),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const ventas_pagos = (0, import_pg_core.pgTable)("ventas_pagos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  venta_id: (0, import_pg_core.uuid)("venta_id").notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  numero_cuota: (0, import_pg_core.integer)("numero_cuota").default(1).notNull(),
  metodo_pago_id: (0, import_pg_core.varchar)("metodo_pago_id", { length: 5 }).notNull(),
  banco_id: (0, import_pg_core.uuid)("banco_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto: (0, import_pg_core.bigint)("monto", { mode: "number" }).default(0).notNull(),
  fecha_programada: (0, import_pg_core.date)("fecha_programada"),
  fecha_pago: (0, import_pg_core.timestamp)("fecha_pago", { mode: "string" }).defaultNow(),
  numero_operacion: (0, import_pg_core.varchar)("numero_operacion", { length: 100 }),
  observacion: (0, import_pg_core.text)("observacion"),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).default("PAGADO").notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const vehiculos = (0, import_pg_core.pgTable)(
  "vehiculos",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    empresa_id: (0, import_pg_core.uuid)("empresa_id"),
    placa: (0, import_pg_core.varchar)("placa", { length: 50 }).notNull(),
    descripcion: (0, import_pg_core.varchar)("descripcion", { length: 150 }),
    es_propio: (0, import_pg_core.boolean)("es_propio").default(true),
    tipo_vehiculo: (0, import_pg_core.varchar)("tipo_vehiculo", { length: 50 }).default("CAMION"),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(true),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      vehiculos_placa_key: (0, import_pg_core.unique)("vehiculos_placa_key").on(table.placa)
    };
  }
);
const conductores = (0, import_pg_core.pgTable)("conductores", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id"),
  numero_documento: (0, import_pg_core.varchar)("numero_documento", { length: 20 }).notNull(),
  nombres: (0, import_pg_core.varchar)("nombres", { length: 200 }).notNull(),
  licencia_conducir: (0, import_pg_core.varchar)("licencia_conducir", { length: 50 }),
  tipo_licencia: (0, import_pg_core.varchar)("tipo_licencia", { length: 50 }),
  fecha_vencimiento_licencia: (0, import_pg_core.date)("fecha_vencimiento_licencia"),
  estado: (0, import_pg_core.varchar)("estado", { length: 20 }),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const transportistas = (0, import_pg_core.pgTable)(
  "transportistas",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    branch_id: (0, import_pg_core.uuid)("branch_id"),
    ruc: (0, import_pg_core.varchar)("ruc", { length: 11 }).notNull(),
    razon_social: (0, import_pg_core.varchar)("razon_social", { length: 250 }).notNull(),
    nombre_comercial: (0, import_pg_core.varchar)("nombre_comercial", { length: 200 }),
    registro_mtc: (0, import_pg_core.varchar)("registro_mtc", { length: 50 }),
    direccion: (0, import_pg_core.varchar)("direccion", { length: 255 }),
    telefono: (0, import_pg_core.varchar)("telefono", { length: 50 }),
    email: (0, import_pg_core.varchar)("email", { length: 150 }),
    activo: (0, import_pg_core.boolean)("activo").default(true),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      transportistas_ruc_key: (0, import_pg_core.unique)("transportistas_ruc_key").on(table.ruc)
    };
  }
);
const guias_remision = (0, import_pg_core.pgTable)("guias_remision", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  venta_id: (0, import_pg_core.uuid)("venta_id"),
  cliente_id: (0, import_pg_core.uuid)("cliente_id").notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  almacen_origen_id: (0, import_pg_core.uuid)("almacen_origen_id").notNull(),
  caja_turno_id: (0, import_pg_core.uuid)("caja_turno_id").notNull(),
  vehiculo_id: (0, import_pg_core.uuid)("vehiculo_id"),
  conductor_id: (0, import_pg_core.uuid)("conductor_id"),
  transportista_id: (0, import_pg_core.uuid)("transportista_id"),
  tipo_comprobante_id: (0, import_pg_core.varchar)("tipo_comprobante_id", { length: 2 }).default("09"),
  serie: (0, import_pg_core.varchar)("serie", { length: 10 }).notNull(),
  correlativo: (0, import_pg_core.integer)("correlativo").notNull(),
  fecha_emision: (0, import_pg_core.timestamp)("fecha_emision", { mode: "string" }).defaultNow().notNull(),
  fecha_traslado: (0, import_pg_core.date)("fecha_traslado").notNull(),
  peso: (0, import_pg_core.varchar)("peso", { length: 10 }),
  num_bultos: (0, import_pg_core.integer)("num_bultos"),
  motivo_traslado_id: (0, import_pg_core.varchar)("motivo_traslado_id", { length: 5 }),
  descripcion_traslado: (0, import_pg_core.varchar)("descripcion_traslado", { length: 255 }),
  modalidad_transporte: (0, import_pg_core.varchar)("modalidad_transporte", { length: 5 }).notNull(),
  ubigeo_partida: (0, import_pg_core.varchar)("ubigeo_partida", { length: 6 }).notNull(),
  direccion_partida: (0, import_pg_core.varchar)("direccion_partida", { length: 255 }).notNull(),
  ubigeo_llegada: (0, import_pg_core.varchar)("ubigeo_llegada", { length: 6 }).notNull(),
  direccion_llegada: (0, import_pg_core.varchar)("direccion_llegada", { length: 255 }).notNull(),
  transportista_mtc: (0, import_pg_core.varchar)("transportista_mtc", { length: 50 }),
  estado: (0, import_pg_core.varchar)("estado", { length: 20 }).default("EMITIDO"),
  estado_sunat: (0, import_pg_core.varchar)("estado_sunat", { length: 30 }).default("REGISTRADO"),
  xml_url: (0, import_pg_core.varchar)("xml_url", { length: 500 }),
  cdr_url: (0, import_pg_core.varchar)("cdr_url", { length: 500 }),
  pdf_url: (0, import_pg_core.varchar)("pdf_url", { length: 500 }),
  observacion: (0, import_pg_core.text)("observacion"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const detalle_guias_remision = (0, import_pg_core.pgTable)("detalle_guias_remision", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  guia_remision_id: (0, import_pg_core.uuid)("guia_remision_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  lote_id: (0, import_pg_core.uuid)("lote_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  peso_total: (0, import_pg_core.bigint)("peso_total", { mode: "number" }).default(0),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const notas_credito = (0, import_pg_core.pgTable)("notas_credito", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  venta_id: (0, import_pg_core.uuid)("venta_id").notNull(),
  caja_id: (0, import_pg_core.uuid)("caja_id"),
  caja_turno_id: (0, import_pg_core.uuid)("caja_turno_id"),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  cliente_id: (0, import_pg_core.uuid)("cliente_id").notNull(),
  tipo_comprobante_id: (0, import_pg_core.varchar)("tipo_comprobante_id", { length: 2 }).default("07"),
  serie: (0, import_pg_core.varchar)("serie", { length: 10 }).notNull(),
  correlativo: (0, import_pg_core.integer)("correlativo").notNull(),
  fecha_emision: (0, import_pg_core.timestamp)("fecha_emision", { mode: "string" }).defaultNow().notNull(),
  tipo_nota_credito_id: (0, import_pg_core.varchar)("tipo_nota_credito_id", { length: 2 }).notNull(),
  sustento: (0, import_pg_core.text)("sustento").notNull(),
  moneda: (0, import_pg_core.varchar)("moneda", { length: 3 }).default("PEN"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tipo_cambio: (0, import_pg_core.bigint)("tipo_cambio", { mode: "number" }).default(1),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  gravadas: (0, import_pg_core.bigint)("gravadas", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  exoneradas: (0, import_pg_core.bigint)("exoneradas", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  inafectas: (0, import_pg_core.bigint)("inafectas", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  descuento: (0, import_pg_core.bigint)("descuento", { mode: "number" }).default(0),
  estado: (0, import_pg_core.varchar)("estado", { length: 20 }).default("EMITIDO"),
  estado_sunat: (0, import_pg_core.varchar)("estado_sunat", { length: 30 }).default("REGISTRADO"),
  xml_url: (0, import_pg_core.varchar)("xml_url", { length: 500 }),
  cdr_url: (0, import_pg_core.varchar)("cdr_url", { length: 500 }),
  pdf_url: (0, import_pg_core.varchar)("pdf_url", { length: 500 }),
  intentos_envio: (0, import_pg_core.integer)("intentos_envio").default(0),
  observacion_sunat: (0, import_pg_core.text)("observacion_sunat"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const detalle_notas_credito = (0, import_pg_core.pgTable)("detalle_notas_credito", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  nota_credito_id: (0, import_pg_core.uuid)("nota_credito_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  lote_id: (0, import_pg_core.uuid)("lote_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_unitario: (0, import_pg_core.bigint)("precio_unitario", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  descuento: (0, import_pg_core.bigint)("descuento", { mode: "number" }).default(0),
  tipo_afectacion_igv: (0, import_pg_core.smallint)("tipo_afectacion_igv").default(10),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const cotizaciones = (0, import_pg_core.pgTable)("cotizaciones", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  cliente_id: (0, import_pg_core.uuid)("cliente_id").notNull(),
  almacen_id: (0, import_pg_core.uuid)("almacen_id"),
  serie: (0, import_pg_core.varchar)("serie", { length: 10 }).default("COT1"),
  correlativo: (0, import_pg_core.integer)("correlativo").notNull(),
  fecha_emision: (0, import_pg_core.timestamp)("fecha_emision", { mode: "string" }).defaultNow().notNull(),
  fecha_vencimiento: (0, import_pg_core.date)("fecha_vencimiento").notNull(),
  moneda: (0, import_pg_core.varchar)("moneda", { length: 3 }).default("PEN"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tipo_cambio: (0, import_pg_core.bigint)("tipo_cambio", { mode: "number" }).default(1),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  gravadas: (0, import_pg_core.bigint)("gravadas", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  exoneradas: (0, import_pg_core.bigint)("exoneradas", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  inafectas: (0, import_pg_core.bigint)("inafectas", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  descuento: (0, import_pg_core.bigint)("descuento", { mode: "number" }).default(0),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).default("PENDIENTE"),
  observacion: (0, import_pg_core.text)("observacion"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const detalle_cotizaciones = (0, import_pg_core.pgTable)("detalle_cotizaciones", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  cotizacion_id: (0, import_pg_core.uuid)("cotizacion_id").notNull(),
  producto_id: (0, import_pg_core.uuid)("producto_id").notNull(),
  presentacion_id: (0, import_pg_core.uuid)("presentacion_id"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  precio_unitario: (0, import_pg_core.bigint)("precio_unitario", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  descuento: (0, import_pg_core.bigint)("descuento", { mode: "number" }).default(0),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const caja_chica = (0, import_pg_core.pgTable)("caja_chica", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  nombre: (0, import_pg_core.varchar)("nombre", { length: 150 }).notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_fondo_fijo: (0, import_pg_core.bigint)("monto_fondo_fijo", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_actual: (0, import_pg_core.bigint)("monto_actual", { mode: "number" }).default(0).notNull(),
  activo: (0, import_pg_core.boolean)("activo").default(true),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const caja_chica_sesiones = (0, import_pg_core.pgTable)("caja_chica_sesiones", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  caja_chica_id: (0, import_pg_core.uuid)("caja_chica_id").notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  fecha_apertura: (0, import_pg_core.timestamp)("fecha_apertura", { mode: "string" }).defaultNow().notNull(),
  fecha_cierre: (0, import_pg_core.timestamp)("fecha_cierre", { mode: "string" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_inicial: (0, import_pg_core.bigint)("monto_inicial", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_gastado: (0, import_pg_core.bigint)("monto_gastado", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_reembolsado: (0, import_pg_core.bigint)("monto_reembolsado", { mode: "number" }).default(0).notNull(),
  estado: (0, import_pg_core.varchar)("estado", { length: 20 }).default("ABIERTA").notNull(),
  observacion: (0, import_pg_core.text)("observacion"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const caja_chica_totales = (0, import_pg_core.pgTable)("caja_chica_totales", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  caja_chica_sesion_id: (0, import_pg_core.uuid)("caja_chica_sesion_id").notNull(),
  metodo_pago_id: (0, import_pg_core.varchar)("metodo_pago_id", { length: 5 }).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_sistema: (0, import_pg_core.bigint)("monto_sistema", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  monto_declarado: (0, import_pg_core.bigint)("monto_declarado", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  diferencia: (0, import_pg_core.bigint)("diferencia", { mode: "number" }).default(0).notNull(),
  observacion: (0, import_pg_core.text)("observacion"),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const caja_chica_movimientos = (0, import_pg_core.pgTable)("caja_chica_movimientos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  caja_chica_sesion_id: (0, import_pg_core.uuid)("caja_chica_sesion_id").notNull(),
  usuario_id: (0, import_pg_core.uuid)("usuario_id").notNull(),
  tipo_movimiento: (0, import_pg_core.varchar)("tipo_movimiento", { length: 20 }).notNull(),
  comprobante_id: (0, import_pg_core.uuid)("comprobante_id"),
  tipo_comprobante_id: (0, import_pg_core.varchar)("tipo_comprobante_id", { length: 2 }),
  serie: (0, import_pg_core.varchar)("serie", { length: 10 }),
  correlativo: (0, import_pg_core.varchar)("correlativo", { length: 20 }),
  metodo_pago_id: (0, import_pg_core.varchar)("metodo_pago_id", { length: 5 }).default("01").notNull(),
  banco_id: (0, import_pg_core.uuid)("banco_id"),
  numero_operacion: (0, import_pg_core.varchar)("numero_operacion", { length: 100 }),
  proveedor_id: (0, import_pg_core.uuid)("proveedor_id"),
  proveedor_nombre: (0, import_pg_core.varchar)("proveedor_nombre", { length: 200 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  igv: (0, import_pg_core.bigint)("igv", { mode: "number" }).default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  total: (0, import_pg_core.bigint)("total", { mode: "number" }).default(0).notNull(),
  concepto: (0, import_pg_core.varchar)("concepto", { length: 200 }).notNull(),
  foto_comprobante: (0, import_pg_core.text)("foto_comprobante"),
  archivo_pdf: (0, import_pg_core.text)("archivo_pdf"),
  observacion: (0, import_pg_core.text)("observacion"),
  estado: (0, import_pg_core.varchar)("estado", { length: 30 }).default("APROBADO").notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const caja_chica_arqueos = (0, import_pg_core.pgTable)("caja_chica_arqueos", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  caja_chica_sesion_id: (0, import_pg_core.uuid)("caja_chica_sesion_id").notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  denominacion: (0, import_pg_core.bigint)("denominacion", { mode: "number" }).notNull(),
  cantidad: (0, import_pg_core.integer)("cantidad").default(0).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  subtotal: (0, import_pg_core.bigint)("subtotal", { mode: "number" }).default(0).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const combo_detalles = (0, import_pg_core.pgTable)("combo_detalles", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  presentacion_combo_id: (0, import_pg_core.uuid)("presentacion_combo_id").notNull(),
  presentacion_componente_id: (0, import_pg_core.uuid)("presentacion_componente_id").notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad: (0, import_pg_core.bigint)("cantidad", { mode: "number" }).default(1).notNull(),
  activo: (0, import_pg_core.boolean)("activo").default(true).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false).notNull(),
  created_at: (0, import_pg_core.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull()
});
const combo_detalle_pre_ventas = (0, import_pg_core.pgTable)("combo_detalle_pre_ventas", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  detalle_pre_venta_id: (0, import_pg_core.uuid)("detalle_pre_venta_id").notNull(),
  producto_componente_id: (0, import_pg_core.uuid)("producto_componente_id").notNull(),
  presentacion_componente_id: (0, import_pg_core.uuid)("presentacion_componente_id"),
  producto_nombre_snapshot: (0, import_pg_core.varchar)("producto_nombre_snapshot", { length: 150 }).notNull(),
  presentacion_nombre_snapshot: (0, import_pg_core.varchar)("presentacion_nombre_snapshot", { length: 150 }).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  cantidad_base_prevista: (0, import_pg_core.bigint)("cantidad_base_prevista", { mode: "number" }).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  multiplica_por_snapshot: (0, import_pg_core.bigint)("multiplica_por_snapshot", { mode: "number" }).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const combo_detalle_ventas = (0, import_pg_core.pgTable)(
  "combo_detalle_ventas",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
    detalle_venta_id: (0, import_pg_core.uuid)("detalle_venta_id").notNull(),
    producto_componente_id: (0, import_pg_core.uuid)("producto_componente_id").notNull(),
    presentacion_componente_id: (0, import_pg_core.uuid)("presentacion_componente_id"),
    producto_nombre_snapshot: (0, import_pg_core.varchar)("producto_nombre_snapshot", { length: 150 }).notNull(),
    presentacion_nombre_snapshot: (0, import_pg_core.varchar)("presentacion_nombre_snapshot", { length: 150 }).notNull(),
    lote_id: (0, import_pg_core.uuid)("lote_id"),
    stock_movimiento_id: (0, import_pg_core.uuid)("stock_movimiento_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    cantidad_base: (0, import_pg_core.bigint)("cantidad_base", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    multiplica_por_snapshot: (0, import_pg_core.bigint)("multiplica_por_snapshot", { mode: "number" }).notNull(),
    costo_unitario_base_snapshot: (0, import_pg_core.numeric)("costo_unitario_base_snapshot", { precision: 20, scale: 6 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    costo_total_snapshot: (0, import_pg_core.bigint)("costo_total_snapshot", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    precio_proporcional_historico: (0, import_pg_core.bigint)("precio_proporcional_historico", { mode: "number" }).default(0).notNull(),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
  },
  (table) => {
    return {
      combo_detalle_ventas_stock_movimiento_id_key: (0, import_pg_core.unique)("combo_detalle_ventas_stock_movimiento_id_key").on(table.stock_movimiento_id)
    };
  }
);
const compra_flujo = (0, import_pg_core.pgTable)("compra_flujo", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  id_requerimiento: (0, import_pg_core.uuid)("id_requerimiento"),
  id_cotizacion: (0, import_pg_core.uuid)("id_cotizacion"),
  id_orden_compra: (0, import_pg_core.uuid)("id_orden_compra"),
  id_compra: (0, import_pg_core.uuid)("id_compra"),
  id_movimiento_almacen: (0, import_pg_core.uuid)("id_movimiento_almacen"),
  tipo_flujo_id: (0, import_pg_core.smallint)("tipo_flujo_id").notNull(),
  indicador_pasos: (0, import_pg_core.smallint)("indicador_pasos").default(0).notNull(),
  sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
});
const conf_envio_whatsapp = (0, import_pg_core.pgTable)("conf_envio_whatsapp", {
  id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
  branch_id: (0, import_pg_core.uuid)("branch_id").notNull(),
  instancia: (0, import_pg_core.varchar)("instancia", { length: 100 }).default("admin"),
  url: (0, import_pg_core.varchar)("url", { length: 255 }).notNull(),
  apikey: (0, import_pg_core.varchar)("apikey", { length: 255 }).notNull(),
  activo: (0, import_pg_core.boolean)("activo").default(true).notNull(),
  fecharegistro: (0, import_pg_core.timestamp)("fecharegistro", { mode: "string" }).defaultNow(),
  created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow().notNull(),
  updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow().notNull()
});
const usuarios = (0, import_pg_core.pgTable)(
  "usuarios",
  {
    id: (0, import_pg_core.uuid)("id").defaultRandom().primaryKey().notNull(),
    nombre: (0, import_pg_core.varchar)("nombre", { length: 100 }).notNull(),
    usuario: (0, import_pg_core.varchar)("usuario", { length: 100 }).notNull(),
    password: (0, import_pg_core.varchar)("password", { length: 255 }).notNull(),
    activo: (0, import_pg_core.boolean)("activo").default(true),
    es_super_admin: (0, import_pg_core.boolean)("es_super_admin").default(false),
    telefono: (0, import_pg_core.varchar)("telefono", { length: 20 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id_telegram: (0, import_pg_core.bigint)("id_telegram", { mode: "number" }),
    current_session_id: (0, import_pg_core.varchar)("current_session_id", { length: 255 }).notNull(),
    last_activity_at: (0, import_pg_core.timestamp)("last_activity_at", { mode: "string" }),
    intentos_fallidos: (0, import_pg_core.integer)("intentos_fallidos").default(0),
    bloqueado: (0, import_pg_core.boolean)("bloqueado").default(false),
    sincronizado: (0, import_pg_core.boolean)("sincronizado").default(false),
    created_at: (0, import_pg_core.timestamp)("created_at", { mode: "string" }).defaultNow(),
    updated_at: (0, import_pg_core.timestamp)("updated_at", { mode: "string" }).defaultNow()
  },
  (table) => {
    return {
      usuarios_current_session_id_key: (0, import_pg_core.unique)("usuarios_current_session_id_key").on(table.current_session_id),
      usuarios_usuario_key: (0, import_pg_core.unique)("usuarios_usuario_key").on(table.usuario)
    };
  }
);
