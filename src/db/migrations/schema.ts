import { pgTable, index, varchar, smallint, boolean, timestamp, uniqueIndex, unique, uuid, text, bigint, integer, jsonb, serial, date, numeric, foreignKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"



export const ubigeo = pgTable("ubigeo", {
	codigo: varchar("codigo", { length: 6 }).primaryKey().notNull(),
	departamento: varchar("departamento", { length: 100 }).notNull(),
	provincia: varchar("provincia", { length: 100 }).notNull(),
	distrito: varchar("distrito", { length: 100 }).notNull(),
},
(table) => {
	return {
		idx_ubigeo_departamento: index("idx_ubigeo_departamento").using("btree", table.departamento),
		idx_ubigeo_distrito: index("idx_ubigeo_distrito").using("btree", table.distrito),
		idx_ubigeo_full: index("idx_ubigeo_full").using("btree", table.departamento, table.provincia, table.distrito),
		idx_ubigeo_provincia: index("idx_ubigeo_provincia").using("btree", table.provincia),
	}
});

export const tipo_afectacion_igv = pgTable("tipo_afectacion_igv", {
	codigo: smallint("codigo").primaryKey().notNull(),
	descripcion: varchar("descripcion", { length: 120 }).notNull(),
	codigo_tributo: varchar("codigo_tributo", { length: 10 }).notNull(),
	activo: boolean("activo").default(true),
},
(table) => {
	return {
		idx_tipo_afectacion_igv_activo: index("idx_tipo_afectacion_igv_activo").using("btree", table.activo),
		idx_tipo_afectacion_igv_activo_tributo: index("idx_tipo_afectacion_igv_activo_tributo").using("btree", table.codigo_tributo, table.activo),
		idx_tipo_afectacion_igv_descripcion: index("idx_tipo_afectacion_igv_descripcion").using("btree", table.descripcion),
		idx_tipo_afectacion_igv_tributo: index("idx_tipo_afectacion_igv_tributo").using("btree", table.codigo_tributo),
	}
});

export const tipo_unidades_medida = pgTable("tipo_unidades_medida", {
	id: varchar("id", { length: 5 }).primaryKey().notNull(),
	codigo: varchar("codigo", { length: 5 }).notNull(),
	descripcion: varchar("descripcion", { length: 100 }).notNull(),
	estado: boolean("estado").default(true),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_tipo_unidades_medida_codigo: index("idx_tipo_unidades_medida_codigo").using("btree", table.codigo),
		idx_tipo_unidades_medida_descripcion: index("idx_tipo_unidades_medida_descripcion").using("btree", table.descripcion),
		idx_tipo_unidades_medida_estado_codigo: index("idx_tipo_unidades_medida_estado_codigo").using("btree", table.estado, table.codigo),
	}
});

export const clientes = pgTable("clientes", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	tipo_documento_id: varchar("tipo_documento_id", { length: 2 }),
	numero_documento: varchar("numero_documento", { length: 20 }).notNull(),
	nombre_razon_social: text("nombre_razon_social").notNull(),
	direccion_1: text("direccion_1"),
	direccion_2: text("direccion_2"),
	direccion_3: text("direccion_3"),
	email_1: text("email_1"),
	email_2: text("email_2"),
	email_3: text("email_3"),
	telefono_1: varchar("telefono_1", { length: 20 }),
	telefono_2: varchar("telefono_2", { length: 20 }),
	telefono_3: varchar("telefono_3", { length: 20 }),
	branch_id: uuid("branch_id"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	limite_credito_int: bigint("limite_credito_int", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	saldo_utilizado_int: bigint("saldo_utilizado_int", { mode: "number" }).default(0),
	dias_credito_pactado: integer("dias_credito_pactado").default(30),
	cantidad_cuotas: integer("cantidad_cuotas").default(1),
	estado_credito: varchar("estado_credito", { length: 20 }).default('NORMAL'),
},
(table) => {
	return {
		idx_clientes_branch: index("idx_clientes_branch").using("btree", table.branch_id),
		idx_clientes_email1: index("idx_clientes_email1").using("btree", table.email_1),
		idx_clientes_email2: index("idx_clientes_email2").using("btree", table.email_2),
		idx_clientes_email3: index("idx_clientes_email3").using("btree", table.email_3),
		idx_clientes_estado_credito: index("idx_clientes_estado_credito").using("btree", table.estado_credito),
		idx_clientes_limite_saldo: index("idx_clientes_limite_saldo").using("btree", table.limite_credito_int, table.saldo_utilizado_int),
		idx_clientes_tel1: index("idx_clientes_tel1").using("btree", table.telefono_1),
		idx_clientes_tel2: index("idx_clientes_tel2").using("btree", table.telefono_2),
		idx_clientes_tel3: index("idx_clientes_tel3").using("btree", table.telefono_3),
		idx_clientes_tipo_dni_num: uniqueIndex("idx_clientes_tipo_dni_num").using("btree", table.tipo_documento_id, table.numero_documento),
		clientes_tipo_documento_id_numero_documento_key: unique("clientes_tipo_documento_id_numero_documento_key").on(table.numero_documento, table.tipo_documento_id),
	}
});

export const tipo_documento = pgTable("tipo_documento", {
	id: varchar("id", { length: 2 }).primaryKey().notNull(),
	descripcion: varchar("descripcion", { length: 255 }).notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	abreviatura: varchar("abreviatura", { length: 10 }),
});

export const tokens_autorizacion = pgTable("tokens_autorizacion", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	token: varchar("token", { length: 10 }).notNull(),
	tipo_uso: varchar("tipo_uso", { length: 30 }).notNull(),
	usuario_autorizador_id: uuid("usuario_autorizador_id"),
	usuario_solicitante_id: uuid("usuario_solicitante_id").notNull(),
	estado: varchar("estado", { length: 20 }).default('SOLICITADO').notNull(),
	fecha_expiracion: timestamp("fecha_expiracion", { mode: 'string' }),
	metadata: jsonb("metadata"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	used_at: timestamp("used_at", { mode: 'string' }),
	sincronizado: boolean("sincronizado").default(false),
});

export const notificaciones = pgTable("notificaciones", {
	id: uuid("id").primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	usuario_id: uuid("usuario_id"),
	titulo: varchar("titulo", { length: 255 }).notNull(),
	mensaje: text("mensaje").notNull(),
	tipo: varchar("tipo", { length: 50 }).default('info'),
	leido: boolean("leido").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_notificaciones_branch: index("idx_notificaciones_branch").using("btree", table.branch_id),
		idx_notificaciones_leido: index("idx_notificaciones_leido").using("btree", table.leido),
		idx_notificaciones_usuario: index("idx_notificaciones_usuario").using("btree", table.usuario_id),
	}
});

export const tipo_operacion = pgTable("tipo_operacion", {
	id: varchar("id", { length: 5 }).primaryKey().notNull(),
	codigo: varchar("codigo", { length: 5 }).notNull(),
	descripcion: varchar("descripcion", { length: 255 }).notNull(),
	estado: boolean("estado").default(true),
});

export const tipo_existencia = pgTable("tipo_existencia", {
	id: varchar("id", { length: 10 }).primaryKey().notNull(),
	codigo: varchar("codigo", { length: 10 }).notNull(),
	descripcion: varchar("descripcion", { length: 255 }).notNull(),
	estado: boolean("estado").default(true),
});

export const tipo_metodo_pago = pgTable("tipo_metodo_pago", {
	id: varchar("id", { length: 5 }).primaryKey().notNull(),
	nombre: varchar("nombre", { length: 50 }).notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const tipo_impuesto = pgTable("tipo_impuesto", {
	id: varchar("id", { length: 10 }).primaryKey().notNull(),
	nombre: varchar("nombre", { length: 100 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	valor: bigint("valor", { mode: "number" }).notNull(),
	descripcion: varchar("descripcion", { length: 255 }),
});

export const tipo_cambio = pgTable("tipo_cambio", {
	id: serial("id").primaryKey().notNull(),
	fecha: date("fecha").notNull(),
	compra: numeric("compra", { precision: 10, scale:  3 }).notNull(),
	venta: numeric("venta", { precision: 10, scale:  3 }).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_tipo_cambio_compra: index("idx_tipo_cambio_compra").using("btree", table.compra),
		idx_tipo_cambio_fecha_compra: index("idx_tipo_cambio_fecha_compra").using("btree", table.fecha, table.compra),
		idx_tipo_cambio_venta: index("idx_tipo_cambio_venta").using("btree", table.venta),
		tipo_cambio_fecha_key: unique("tipo_cambio_fecha_key").on(table.fecha),
	}
});

export const caja_serie_correlativo = pgTable("caja_serie_correlativo", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	identificador_caja: varchar("identificador_caja", { length: 50 }),
	nombre: varchar("nombre", { length: 50 }).notNull(),
	serie: varchar("serie", { length: 10 }).notNull(),
	correlativo: integer("correlativo").default(0),
	branch_id: uuid("branch_id"),
	tipo_comprobante_id: varchar("tipo_comprobante_id", { length: 10 }).references(() => tipo_comprobante.id),
	sincronizado: boolean("sincronizado").default(false),
	activo: boolean("activo").default(true),
	tipo_caja: varchar("tipo_caja", { length: 20 }).default('ADMINISTRATIVA'),
	usuario_id: uuid("usuario_id"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_caja_serie_correlativo_activas: index("idx_caja_serie_correlativo_activas").using("btree", table.branch_id, table.tipo_caja).where(sql`(activo = true)`),
		idx_caja_serie_correlativo_activo: index("idx_caja_serie_correlativo_activo").using("btree", table.activo),
		idx_caja_serie_correlativo_branch: index("idx_caja_serie_correlativo_branch").using("btree", table.branch_id),
		idx_caja_serie_correlativo_identificador: index("idx_caja_serie_correlativo_identificador").using("btree", table.identificador_caja),
		idx_caja_serie_correlativo_tipo_caja: index("idx_caja_serie_correlativo_tipo_caja").using("btree", table.tipo_caja),
		idx_caja_serie_correlativo_tipo_comprobante: index("idx_caja_serie_correlativo_tipo_comprobante").using("btree", table.tipo_comprobante_id),
		idx_caja_serie_correlativo_tipo_serie_corr: index("idx_caja_serie_correlativo_tipo_serie_corr").using("btree", table.tipo_comprobante_id, table.serie, table.correlativo),
		idx_caja_serie_correlativo_usuario: index("idx_caja_serie_correlativo_usuario").using("btree", table.usuario_id),
		uq_cajas_comprobante_serie: unique("uq_cajas_comprobante_serie").on(table.serie, table.tipo_comprobante_id),
	}
});

export const tipo_comprobante = pgTable("tipo_comprobante", {
	id: varchar("id", { length: 2 }).primaryKey().notNull(),
	descripcion: varchar("descripcion", { length: 100 }).notNull(),
	abreviatura: varchar("abreviatura", { length: 10 }),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const tipo_stock = pgTable("tipo_stock", {
	id: varchar("id", { length: 50 }).primaryKey().notNull(),
	descripcion: varchar("descripcion", { length: 150 }).notNull(),
});

export const tipo_tributos = pgTable("tipo_tributos", {
	id: varchar("id", { length: 10 }).primaryKey().notNull(),
	codigo: varchar("codigo", { length: 10 }).notNull(),
	descripcion: varchar("descripcion", { length: 255 }).notNull(),
	codigo_internacional: varchar("codigo_internacional", { length: 10 }),
	nombre: varchar("nombre", { length: 20 }),
},
(table) => {
	return {
		idx_tipo_tributos_ci: index("idx_tipo_tributos_ci").using("btree", table.codigo_internacional),
		idx_tipo_tributos_codigo: index("idx_tipo_tributos_codigo").using("btree", table.codigo),
		idx_tipo_tributos_codigo_nombre: index("idx_tipo_tributos_codigo_nombre").using("btree", table.codigo, table.nombre),
		idx_tipo_tributos_id_codigo: index("idx_tipo_tributos_id_codigo").using("btree", table.id, table.codigo),
		idx_tipo_tributos_nombre: index("idx_tipo_tributos_nombre").using("btree", table.nombre),
	}
});

export const tipo_bancos = pgTable("tipo_bancos", {
	id: uuid("id").primaryKey().notNull(),
	banco: varchar("banco", { length: 100 }).notNull(),
	numero_cuenta: varchar("numero_cuenta", { length: 100 }).notNull(),
	cci: varchar("cci", { length: 100 }),
	tipo_moneda: varchar("tipo_moneda", { length: 10 }).default('PEN').notNull(),
	branch_id: uuid("branch_id"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	es_detraccion: boolean("es_detraccion").default(false),
});

export const tipo_moneda = pgTable("tipo_moneda", {
	id: varchar("id", { length: 3 }).primaryKey().notNull(),
	iso: varchar("iso", { length: 3 }).notNull(),
	descripcion: varchar("descripcion", { length: 50 }).notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		uq_tipomoneda_iso: unique("uq_tipomoneda_iso").on(table.iso),
	}
});

export const tipo_pago = pgTable("tipo_pago", {
	id: varchar("id", { length: 2 }).primaryKey().notNull(),
	nombre: varchar("nombre", { length: 50 }).notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const tipo_codigos_detraccion = pgTable("tipo_codigos_detraccion", {
	codigo: varchar("codigo", { length: 10 }).primaryKey().notNull(),
	codigo_sunat: varchar("codigo_sunat", { length: 10 }).notNull(),
	descripcion: varchar("descripcion", { length: 255 }).notNull(),
	porcentaje: numeric("porcentaje", { precision: 5, scale:  2 }).notNull(),
	activo: boolean("activo").default(true),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_codigos_detraccion_activo: index("idx_codigos_detraccion_activo").using("btree", table.activo),
		idx_codigos_detraccion_desc: index("idx_codigos_detraccion_desc").using("btree", table.descripcion),
		idx_codigos_detraccion_porcentaje: index("idx_codigos_detraccion_porcentaje").using("btree", table.porcentaje),
		idx_codigos_detraccion_sunat: index("idx_codigos_detraccion_sunat").using("btree", table.codigo_sunat),
		idx_codigos_detraccion_sunat_activo: index("idx_codigos_detraccion_sunat_activo").using("btree", table.codigo_sunat, table.activo),
	}
});

export const tipo_factores = pgTable("tipo_factores", {
	id: serial("id").primaryKey().notNull(),
	codigo: varchar("codigo", { length: 50 }).notNull(),
	valor: integer("valor").notNull(),
	descripcion: text("descripcion"),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		factores_codigo_key: unique("factores_codigo_key").on(table.codigo),
	}
});

export const empresas = pgTable("empresas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	ruc: varchar("ruc", { length: 11 }).notNull(),
	razon_social: varchar("razon_social", { length: 150 }).notNull(),
	nombre_comercial: varchar("nombre_comercial", { length: 200 }),
	ubigeo: varchar("ubigeo", { length: 6 }),
	direccion: varchar("direccion", { length: 255 }),
	telefono1: varchar("telefono1", { length: 20 }),
	telefono2: varchar("telefono2", { length: 20 }),
	email1: varchar("email1", { length: 20 }),
	email2: varchar("email2", { length: 20 }),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_empresas_ruc: index("idx_empresas_ruc").using("btree", table.ruc),
	}
});

export const sucursales = pgTable("sucursales", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	empresa_id: uuid("empresa_id"),
	ruc: varchar("ruc", { length: 11 }).notNull(),
	razon_social: varchar("razon_social", { length: 150 }).notNull(),
	nombre_comercial: varchar("nombre_comercial", { length: 150 }),
	sucursal_nombre: varchar("sucursal_nombre", { length: 150 }),
	direccion: varchar("direccion", { length: 255 }),
	ubigeo: varchar("ubigeo", { length: 6 }),
	codigo_anexo: varchar("codigo_anexo", { length: 4 }),
	telefono1: varchar("telefono1", { length: 20 }),
	telefono2: varchar("telefono2", { length: 20 }),
	email1: varchar("email1", { length: 20 }),
	email2: varchar("email2", { length: 20 }),
	sire_ruc: varchar("sire_ruc", { length: 11 }),
	sire_usuario_sol: varchar("sire_usuario_sol", { length: 50 }),
	sire_clave_sol: varchar("sire_clave_sol", { length: 100 }),
	sire_client_id: varchar("sire_client_id", { length: 250 }),
	sire_client_secret: varchar("sire_client_secret", { length: 250 }),
	sire_ultimo_sync: timestamp("sire_ultimo_sync", { withTimezone: true, mode: 'string' }).defaultNow(),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idx_sucursales_empresa_id: index("idx_sucursales_empresa_id").using("btree", table.empresa_id),
		idx_sucursales_ruc: index("idx_sucursales_ruc").using("btree", table.ruc),
	}
});

export const permisos = pgTable("permisos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	modulo_id: uuid("modulo_id").notNull(),
	codigo: varchar("codigo", { length: 100 }).notNull(),
	nombre: varchar("nombre", { length: 150 }).notNull(),
	descripcion: text("descripcion"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		permisos_codigo_key: unique("permisos_codigo_key").on(table.codigo),
	}
});

export const tipo_motivo_traslado = pgTable("tipo_motivo_traslado", {
	id: varchar("id", { length: 5 }).primaryKey().notNull(),
	codigo_sunat: varchar("codigo_sunat", { length: 5 }).notNull(),
	descripcion: varchar("descripcion", { length: 250 }).notNull(),
	mueve_stock: boolean("mueve_stock").default(true),
	activo: boolean("activo").default(true),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const usuario_accesos = pgTable("usuario_accesos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	empresa_id: uuid("empresa_id").notNull(),
	rol_id: uuid("rol_id").notNull(),
	branch_id: uuid("branch_id").notNull(),
	es_predeterminado: boolean("es_predeterminado").default(false),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const modulos = pgTable("modulos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	codigo: varchar("codigo", { length: 50 }).notNull(),
	nombre: varchar("nombre", { length: 100 }).notNull(),
	descripcion: text("descripcion"),
	activo: boolean("activo").default(true),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		modulos_codigo_key: unique("modulos_codigo_key").on(table.codigo),
	}
});

export const empresa_modulos = pgTable("empresa_modulos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	empresa_id: uuid("empresa_id").notNull(),
	modulo_id: uuid("modulo_id").notNull(),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const roles = pgTable("roles", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	empresa_id: uuid("empresa_id").notNull(),
	nombre: varchar("nombre", { length: 100 }).notNull(),
	descripcion: text("descripcion"),
	nivel: integer("nivel").default(100).notNull(),
	es_sistema: boolean("es_sistema").default(false),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const rol_permisos = pgTable("rol_permisos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	rol_id: uuid("rol_id").notNull(),
	permiso_id: uuid("permiso_id").notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const usuario_permisos = pgTable("usuario_permisos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	acceso_id: uuid("acceso_id").notNull(),
	permiso_id: uuid("permiso_id").notNull(),
	permitido: boolean("permitido").default(true).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const almacenes = pgTable("almacenes", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	nombre: varchar("nombre", { length: 200 }).notNull(),
	direccion: varchar("direccion", { length: 260 }),
	codigo: varchar("codigo", { length: 50 }),
	es_principal: boolean("es_principal").default(false),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const productos = pgTable("productos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	nombre: varchar("nombre", { length: 150 }).notNull(),
	descripcion: text("descripcion"),
	palabra_clave: varchar("palabra_clave", { length: 255 }),
	codigo_barra: varchar("codigo_barra", { length: 100 }),
	es_facturable: boolean("es_facturable").default(true),
	es_vendible: boolean("es_vendible").default(true),
	es_insumo: boolean("es_insumo").default(false),
	es_producido: boolean("es_producido").default(false),
	es_combo: boolean("es_combo").default(false),
	unidad_medida_id: varchar("unidad_medida_id", { length: 5 }),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	codigo_sunat: varchar("codigo_sunat", { length: 50 }),
	stock_minimo: integer("stock_minimo").default(0),
	categoria: uuid("categoria"),
	sub_categoria: uuid("sub_categoria"),
	tipo_existencia: uuid("tipo_existencia"),
	tipo_tributo: uuid("tipo_tributo"),
});

export const presentaciones = pgTable("presentaciones", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	producto_uuid: uuid("producto_uuid"),
	nombre: varchar("nombre", { length: 250 }).notNull(),
	cod_barra: varchar("cod_barra", { length: 200 }),
	palabra_clave: varchar("palabra_clave", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	unidad_medida_id: bigint("unidad_medida_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	multiplica_por: bigint("multiplica_por", { mode: "number" }).default(1),
	ubicacion: varchar("ubicacion", { length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_costo: bigint("precio_costo", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_venta: bigint("precio_venta", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_mayor: bigint("precio_mayor", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_especial: bigint("precio_especial", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_otros: bigint("precio_otros", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	descuento_predefinido: bigint("descuento_predefinido", { mode: "number" }).default(0),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const stock = pgTable("stock", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	producto_id: uuid("producto_id"),
	presentacion_id: uuid("presentacion_id"),
	lotes_id: uuid("lotes_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	multiplica_por: integer("multiplica_por").default(1),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad_base: bigint("cantidad_base", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	saldo: bigint("saldo", { mode: "number" }).default(0),
	documento_id: uuid("documento_id"),
	documento: varchar("documento", { length: 100 }),
	tipo_mov: integer("tipo_mov"),
	concepto: varchar("concepto", { length: 255 }),
	usuario_id: uuid("usuario_id"),
	branch_id: uuid("branch_id"),
	almacen_id: uuid("almacen_id"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const stock_actual = pgTable("stock_actual", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	almacen_id: uuid("almacen_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id").notNull(),
	lotes_id: uuid("lotes_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	saldo_actual: bigint("saldo_actual", { mode: "number" }).default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const proveedores = pgTable("proveedores", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	ruc: varchar("ruc", { length: 11 }).notNull(),
	razon_social: varchar("razon_social", { length: 200 }).notNull(),
	nombre_comercial: varchar("nombre_comercial", { length: 200 }),
	direccion: varchar("direccion", { length: 255 }),
	ubigeo: varchar("ubigeo", { length: 6 }),
	email: varchar("email", { length: 150 }),
	telefono: varchar("telefono", { length: 50 }),
	persona_contacto: varchar("persona_contacto", { length: 150 }),
	es_mercaderia: boolean("es_mercaderia").default(false),
	es_servicio: boolean("es_servicio").default(false),
	es_activo: boolean("es_activo").default(false),
	es_comisiones: boolean("es_comisiones").default(false),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(true),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		proveedores_ruc_key: unique("proveedores_ruc_key").on(table.ruc),
	}
});

export const productos_proveedores = pgTable("productos_proveedores", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	IdProducto: uuid("IdProducto").notNull(),
	IdProveedor: uuid("IdProveedor").notNull(),
	sincronizado: boolean("sincronizado").default(true),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const categorias = pgTable("categorias", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	nombre: varchar("nombre", { length: 50 }).notNull(),
	activo: boolean("activo").default(true).notNull(),
	sincronizado: boolean("sincronizado").default(true),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const subcategoria = pgTable("subcategoria", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	idcategoria: uuid("idcategoria").notNull(),
	Nombre: varchar("Nombre", { length: 50 }).notNull(),
	activo: boolean("activo").default(true).notNull(),
	sincronizado: boolean("sincronizado").default(true),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const mensajeticket = pgTable("mensajeticket", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	mensaje: varchar("mensaje", { length: 250 }).notNull(),
});

export const caja_turnos = pgTable("caja_turnos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	caja_serie_correlativo_id: uuid("caja_serie_correlativo_id").notNull(),
	identificador_caja: varchar("identificador_caja", { length: 10 }).notNull(),
	branch_id: uuid("branch_id").notNull(),
	fecha_apertura: timestamp("fecha_apertura", { mode: 'string' }).defaultNow(),
	fecha_cierre_f: timestamp("fecha_cierre_f", { mode: 'string' }),
	estado: varchar("estado", { length: 20 }).default('ABIERTA'),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const caja_totales = pgTable("caja_totales", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	caja_turno_id: uuid("caja_turno_id").notNull(),
	metodo_pago_id: varchar("metodo_pago_id", { length: 5 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_apertura: bigint("monto_apertura", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_sistema: bigint("monto_sistema", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_declarado: bigint("monto_declarado", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	diferencia: bigint("diferencia", { mode: "number" }).default(0),
	observacion: text("observacion"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const caja_movimientos = pgTable("caja_movimientos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	caja_turno_id: uuid("caja_turno_id").notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	tipo_movimiento: varchar("tipo_movimiento", { length: 20 }).notNull(),
	concepto: varchar("concepto", { length: 150 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_total: bigint("monto_total", { mode: "number" }).default(0).notNull(),
	observacion: text("observacion"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const caja_arqueos = pgTable("caja_arqueos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	caja_turno_id: uuid("caja_turno_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	denominacion: bigint("denominacion", { mode: "number" }).notNull(),
	cantidad: integer("cantidad").default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const bancos = pgTable("bancos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	banco: varchar("banco", { length: 100 }).notNull(),
	numero_cuenta: varchar("numero_cuenta", { length: 100 }).notNull(),
	cci: varchar("cci", { length: 100 }),
	tipo_moneda: varchar("tipo_moneda", { length: 10 }).default('PEN').notNull(),
	es_detraccion: boolean("es_detraccion").default(false),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compra_requerimiento = pgTable("compra_requerimiento", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	serie: varchar("serie", { length: 20 }).notNull(),
	correlativo: varchar("correlativo", { length: 20 }).notNull(),
	id_usuario: uuid("id_usuario").notNull(),
	fecha_emision: timestamp("fecha_emision", { mode: 'string' }).defaultNow().notNull(),
	estado: varchar("estado", { length: 30 }).notNull(),
	observaciones: text("observaciones"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compra_requerimiento_detalle = pgTable("compra_requerimiento_detalle", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	id_requerimiento: uuid("id_requerimiento").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad_aprobada: bigint("cantidad_aprobada", { mode: "number" }).default(0),
	observacion: varchar("observacion", { length: 255 }),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compra_cotizacion = pgTable("compra_cotizacion", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	id_requerimiento: uuid("id_requerimiento"),
	id_proveedor: uuid("id_proveedor").notNull(),
	codigo_cotizacion: varchar("codigo_cotizacion", { length: 50 }).notNull(),
	fecha_cotizacion: date("fecha_cotizacion").notNull(),
	id_moneda: varchar("id_moneda", { length: 3 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tipo_cambio: bigint("tipo_cambio", { mode: "number" }).default(1),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	impuesto: bigint("impuesto", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	estado: varchar("estado", { length: 30 }).notNull(),
	observaciones: text("observaciones"),
	archivo_xml: text("archivo_xml"),
	archivo_cdr: text("archivo_cdr"),
	archivo_pdf: text("archivo_pdf"),
	texto_extraido: text("texto_extraido"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compra_cotizacion_detalle = pgTable("compra_cotizacion_detalle", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	id_cotizacion: uuid("id_cotizacion").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_unitario: bigint("precio_unitario", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	codigo_sku_proveedor: varchar("codigo_sku_proveedor", { length: 100 }),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compra_orden = pgTable("compra_orden", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	id_cotizacion: uuid("id_cotizacion"),
	id_proveedor: uuid("id_proveedor").notNull(),
	id_usuario: uuid("id_usuario").notNull(),
	contacto: varchar("contacto", { length: 50 }),
	serie: varchar("serie", { length: 20 }).notNull(),
	correlativo: varchar("correlativo", { length: 20 }).notNull(),
	fecha_emision: date("fecha_emision").notNull(),
	fecha_entrega_esperada: date("fecha_entrega_esperada"),
	condicion_pago: varchar("condicion_pago", { length: 50 }).notNull(),
	id_moneda: varchar("id_moneda", { length: 3 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tipo_cambio: bigint("tipo_cambio", { mode: "number" }).default(1),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	impuesto: bigint("impuesto", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	estado: varchar("estado", { length: 30 }).notNull(),
	observaciones: text("observaciones"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compra_orden_detalle = pgTable("compra_orden_detalle", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	id_orden_compra: uuid("id_orden_compra").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad_recibida: bigint("cantidad_recibida", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_unitario: bigint("precio_unitario", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compra = pgTable("compra", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	id_orden_compra: uuid("id_orden_compra"),
	id_proveedor: uuid("id_proveedor").notNull(),
	id_usuario: uuid("id_usuario").notNull(),
	tipo_comprobante_id: varchar("tipo_comprobante_id", { length: 2 }).notNull(),
	serie: varchar("serie", { length: 10 }).notNull(),
	id_moneda: varchar("id_moneda", { length: 3 }),
	correlativo: varchar("correlativo", { length: 20 }).notNull(),
	fecha_emision: date("fecha_emision").notNull(),
	fecha_vencimiento: date("fecha_vencimiento").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tipo_cambio: bigint("tipo_cambio", { mode: "number" }).default(1),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	tipo_pago: varchar("tipo_pago", { length: 2 }).default('1').notNull(),
	estado: varchar("estado", { length: 30 }).default('ACEPTADO').notNull(),
	estado_pago: varchar("estado_pago", { length: 30 }).default('PENDIENTE').notNull(),
	estado_sunat: varchar("estado_sunat", { length: 30 }).default('REGISTRADO').notNull(),
	archivo_xml: text("archivo_xml"),
	archivo_cdr: text("archivo_cdr"),
	archivo_pdf: text("archivo_pdf"),
	sire_id: uuid("sire_id"),
	periodo: varchar("periodo", { length: 6 }),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compra_detalle = pgTable("compra_detalle", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	id_compra: uuid("id_compra").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_unitario: bigint("precio_unitario", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	descripcion_proveedor: varchar("descripcion_proveedor", { length: 255 }),
	codigo_sku_proveedor: varchar("codigo_sku_proveedor", { length: 100 }),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compras_pagos = pgTable("compras_pagos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	id_usuario: uuid("id_usuario").notNull(),
	compra_id: uuid("compra_id").notNull(),
	numero_cuota: integer("numero_cuota").default(1).notNull(),
	metodo_pago_id: varchar("metodo_pago_id", { length: 5 }).notNull(),
	banco_id: uuid("banco_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto: bigint("monto", { mode: "number" }).default(0).notNull(),
	fecha_programada: date("fecha_programada"),
	fecha_pago: timestamp("fecha_pago", { mode: 'string' }),
	numero_operacion: varchar("numero_operacion", { length: 100 }),
	observacion: text("observacion"),
	estado: varchar("estado", { length: 30 }).default('PAGADO').notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const compras_sire = pgTable("compras_sire", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	proveedor_ruc: varchar("proveedor_ruc", { length: 20 }).notNull(),
	proveedor_nombre: varchar("proveedor_nombre", { length: 250 }).notNull(),
	tipo_comprobante: varchar("tipo_comprobante", { length: 5 }).notNull(),
	serie: varchar("serie", { length: 20 }).notNull(),
	correlativo: varchar("correlativo", { length: 20 }).notNull(),
	fecha_emision: date("fecha_emision").notNull(),
	fecha_vencimiento: date("fecha_vencimiento"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_neto: bigint("monto_neto", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_igv: bigint("monto_igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_total: bigint("monto_total", { mode: "number" }).default(0).notNull(),
	moneda: varchar("moneda", { length: 5 }).default('PEN'),
	estado_reconciliacion: varchar("estado_reconciliacion", { length: 20 }).default('PENDIENTE'),
	orden_compra_id: uuid("orden_compra_id"),
	periodo: varchar("periodo", { length: 6 }).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tipo_adquisicion: varchar("tipo_adquisicion", { length: 30 }).default('MERCADERIA'),
	aplica_detraccion: boolean("aplica_detraccion").default(false),
	tasa_detraccion: numeric("tasa_detraccion", { precision: 5, scale:  2 }).default('0.00'),
	monto_detraccion: numeric("monto_detraccion", { precision: 12, scale:  4 }).default('0.0000'),
	comisiones: numeric("comisiones", { precision: 10, scale:  2 }).default('0'),
	archivo_xml: text("archivo_xml"),
	archivo_pdf: text("archivo_pdf"),
	estado_descarga_archivos: varchar("estado_descarga_archivos", { length: 20 }).default('PENDIENTE'),
});

export const movimiento_almacen = pgTable("movimiento_almacen", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	id_almacen_destino: uuid("id_almacen_destino").notNull(),
	id_almacen_origen: uuid("id_almacen_origen"),
	id_usuario: uuid("id_usuario").notNull(),
	id_usuario_aprobador: uuid("id_usuario_aprobador"),
	id_proveedor: uuid("id_proveedor"),
	id_tipo_transaccion: varchar("id_tipo_transaccion", { length: 10 }).notNull(),
	id_compra: uuid("id_compra"),
	id_nota_egreso: uuid("id_nota_egreso"),
	id_guia_remision: uuid("id_guia_remision"),
	fecha_movimiento: timestamp("fecha_movimiento", { mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tipo_movimiento: bigint("tipo_movimiento", { mode: "number" }),
	observacion: text("observacion"),
	estado: varchar("estado", { length: 30 }).default('REGISTRADO').notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const movimiento_almacen_detalle = pgTable("movimiento_almacen_detalle", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	movimiento_almacen_id: uuid("movimiento_almacen_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	lote_id: uuid("lote_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_unitario: bigint("precio_unitario", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	observacion: varchar("observacion", { length: 255 }),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const recetas = pgTable("recetas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	nombre: varchar("nombre", { length: 150 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad_producida: bigint("cantidad_producida", { mode: "number" }).default(1).notNull(),
	observacion: text("observacion"),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const recetas_detalles = pgTable("recetas_detalles", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	receta_id: uuid("receta_id").notNull(),
	producto_insumo_id: uuid("producto_insumo_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const lotes = pgTable("lotes", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	id_usuario: uuid("id_usuario").notNull(),
	codigo_lote: varchar("codigo_lote", { length: 100 }).notNull(),
	fecha_fabricacion: date("fecha_fabricacion"),
	fecha_vencimiento: date("fecha_vencimiento"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	costo_unitario: bigint("costo_unitario", { mode: "number" }).default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const ventas_sire = pgTable("ventas_sire", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	cliente_tipo_documento: varchar("cliente_tipo_documento", { length: 5 }),
	cliente_ruc: varchar("cliente_ruc", { length: 20 }),
	cliente_nombre: varchar("cliente_nombre", { length: 250 }),
	tipo_comprobante: varchar("tipo_comprobante", { length: 2 }).notNull(),
	serie: varchar("serie", { length: 10 }).notNull(),
	correlativo: varchar("correlativo", { length: 20 }).notNull(),
	fecha_emision: date("fecha_emision").notNull(),
	fecha_vencimiento: date("fecha_vencimiento"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_neto: bigint("monto_neto", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_igv: bigint("monto_igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_total: bigint("monto_total", { mode: "number" }).default(0).notNull(),
	moneda: varchar("moneda", { length: 5 }).default('PEN'),
	estado_reconciliacion: varchar("estado_reconciliacion", { length: 20 }).default('PENDIENTE'),
	periodo: varchar("periodo", { length: 6 }).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	venta_id: uuid("venta_id"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const pre_ventas = pgTable("pre_ventas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	estado: varchar("estado", { length: 20 }),
	caja_id: uuid("caja_id"),
	caja_turno_id: uuid("caja_turno_id"),
	usuario_id: uuid("usuario_id"),
	cliente_id: uuid("cliente_id"),
	correo_cliente: varchar("correo_cliente", { length: 120 }),
	alias: varchar("alias", { length: 15 }),
	tipo_comprobante_id: varchar("tipo_comprobante_id", { length: 2 }),
	tipo_pago_id: varchar("tipo_pago_id", { length: 2 }).default('1'),
	moneda: varchar("moneda", { length: 3 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tipo_cambio: bigint("tipo_cambio", { mode: "number" }).default(1),
	fecha_emision: timestamp("fecha_emision", { mode: 'string' }).defaultNow(),
	fecha_vencimiento: timestamp("fecha_vencimiento", { mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gravadas: bigint("gravadas", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	exoneradas: bigint("exoneradas", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	inafectas: bigint("inafectas", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total_venta: bigint("total_venta", { mode: "number" }),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const detalle_pre_ventas = pgTable("detalle_pre_ventas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	preventa_id: uuid("preventa_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id").notNull(),
	lote_id: uuid("lote_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_unitario: bigint("precio_unitario", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const ventas = pgTable("ventas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	preventa_id: uuid("preventa_id"),
	caja_id: uuid("caja_id"),
	caja_turno_id: uuid("caja_turno_id"),
	usuario_id: uuid("usuario_id"),
	cliente_id: uuid("cliente_id"),
	correo_cliente: varchar("correo_cliente", { length: 120 }),
	alias: varchar("alias", { length: 15 }),
	tipo_comprobante_id: varchar("tipo_comprobante_id", { length: 2 }),
	serie: varchar("serie", { length: 10 }),
	correlativo: integer("correlativo"),
	fecha_emision: timestamp("fecha_emision", { mode: 'string' }).defaultNow(),
	fecha_vencimiento: timestamp("fecha_vencimiento", { mode: 'string' }).defaultNow(),
	moneda: varchar("moneda", { length: 3 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tipo_cambio: bigint("tipo_cambio", { mode: "number" }).default(1),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gravadas: bigint("gravadas", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	exoneradas: bigint("exoneradas", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	inafectas: bigint("inafectas", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total_venta: bigint("total_venta", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	descuento: bigint("descuento", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gratuitas: bigint("gratuitas", { mode: "number" }).default(0),
	observacion_venta: text("observacion_venta"),
	estado: varchar("estado", { length: 20 }).default('EMITIDO'),
	tipo_pago_id: varchar("tipo_pago_id", { length: 2 }).default('1'),
	impuesto_id: varchar("impuesto_id", { length: 10 }),
	tipo_operacion_id: varchar("tipo_operacion_id", { length: 5 }).default('1'),
	estado_pago: varchar("estado_pago", { length: 20 }).default('PAGADO'),
	facturado: boolean("facturado").default(false),
	ventas_facturacion_id: uuid("ventas_facturacion_id"),
	xml_url: varchar("xml_url", { length: 500 }),
	cdr_url: varchar("cdr_url", { length: 500 }),
	pdf_url: varchar("pdf_url", { length: 500 }),
	intentos_envio: integer("intentos_envio").default(0),
	observacion_sunat: text("observacion_sunat"),
	payment_info: jsonb("payment_info"),
	detraccion_info: jsonb("detraccion_info"),
	baja_ticket: varchar("baja_ticket", { length: 250 }),
	baja_cdr_url: varchar("baja_cdr_url", { length: 500 }),
	baja_xml_url: varchar("baja_xml_url", { length: 500 }),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		ventas_preventa_id_key: unique("ventas_preventa_id_key").on(table.preventa_id),
	}
});

export const detalle_ventas = pgTable("detalle_ventas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	venta_id: uuid("venta_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	lote_id: uuid("lote_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_unitario: bigint("precio_unitario", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	descuento: bigint("descuento", { mode: "number" }).default(0),
	tipo_afectacion_igv: smallint("tipo_afectacion_igv").default(10),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const ventas_pagos = pgTable("ventas_pagos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	venta_id: uuid("venta_id").notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	numero_cuota: integer("numero_cuota").default(1).notNull(),
	metodo_pago_id: varchar("metodo_pago_id", { length: 5 }).notNull(),
	banco_id: uuid("banco_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto: bigint("monto", { mode: "number" }).default(0).notNull(),
	fecha_programada: date("fecha_programada"),
	fecha_pago: timestamp("fecha_pago", { mode: 'string' }).defaultNow(),
	numero_operacion: varchar("numero_operacion", { length: 100 }),
	observacion: text("observacion"),
	estado: varchar("estado", { length: 30 }).default('PAGADO').notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const vehiculos = pgTable("vehiculos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	empresa_id: uuid("empresa_id"),
	placa: varchar("placa", { length: 50 }).notNull(),
	descripcion: varchar("descripcion", { length: 150 }),
	es_propio: boolean("es_propio").default(true),
	tipo_vehiculo: varchar("tipo_vehiculo", { length: 50 }).default('CAMION'),
	sincronizado: boolean("sincronizado").default(true),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		vehiculos_placa_key: unique("vehiculos_placa_key").on(table.placa),
	}
});

export const conductores = pgTable("conductores", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	numero_documento: varchar("numero_documento", { length: 20 }).notNull(),
	nombres: varchar("nombres", { length: 200 }).notNull(),
	licencia_conducir: varchar("licencia_conducir", { length: 50 }),
	tipo_licencia: varchar("tipo_licencia", { length: 50 }),
	fecha_vencimiento_licencia: date("fecha_vencimiento_licencia"),
	estado: varchar("estado", { length: 20 }),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const transportistas = pgTable("transportistas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id"),
	ruc: varchar("ruc", { length: 11 }).notNull(),
	razon_social: varchar("razon_social", { length: 250 }).notNull(),
	nombre_comercial: varchar("nombre_comercial", { length: 200 }),
	registro_mtc: varchar("registro_mtc", { length: 50 }),
	direccion: varchar("direccion", { length: 255 }),
	telefono: varchar("telefono", { length: 50 }),
	email: varchar("email", { length: 150 }),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		transportistas_ruc_key: unique("transportistas_ruc_key").on(table.ruc),
	}
});

export const guias_remision = pgTable("guias_remision", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	venta_id: uuid("venta_id"),
	cliente_id: uuid("cliente_id").notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	almacen_origen_id: uuid("almacen_origen_id").notNull(),
	caja_turno_id: uuid("caja_turno_id").notNull(),
	vehiculo_id: uuid("vehiculo_id"),
	conductor_id: uuid("conductor_id"),
	transportista_id: uuid("transportista_id"),
	tipo_comprobante_id: varchar("tipo_comprobante_id", { length: 2 }).default('09'),
	serie: varchar("serie", { length: 10 }).notNull(),
	correlativo: integer("correlativo").notNull(),
	fecha_emision: timestamp("fecha_emision", { mode: 'string' }).defaultNow().notNull(),
	fecha_traslado: date("fecha_traslado").notNull(),
	peso: varchar("peso", { length: 10 }),
	num_bultos: integer("num_bultos"),
	motivo_traslado_id: varchar("motivo_traslado_id", { length: 5 }),
	descripcion_traslado: varchar("descripcion_traslado", { length: 255 }),
	modalidad_transporte: varchar("modalidad_transporte", { length: 5 }).notNull(),
	ubigeo_partida: varchar("ubigeo_partida", { length: 6 }).notNull(),
	direccion_partida: varchar("direccion_partida", { length: 255 }).notNull(),
	ubigeo_llegada: varchar("ubigeo_llegada", { length: 6 }).notNull(),
	direccion_llegada: varchar("direccion_llegada", { length: 255 }).notNull(),
	transportista_mtc: varchar("transportista_mtc", { length: 50 }),
	estado: varchar("estado", { length: 20 }).default('EMITIDO'),
	estado_sunat: varchar("estado_sunat", { length: 30 }).default('REGISTRADO'),
	xml_url: varchar("xml_url", { length: 500 }),
	cdr_url: varchar("cdr_url", { length: 500 }),
	pdf_url: varchar("pdf_url", { length: 500 }),
	observacion: text("observacion"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const detalle_guias_remision = pgTable("detalle_guias_remision", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	guia_remision_id: uuid("guia_remision_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	lote_id: uuid("lote_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	peso_total: bigint("peso_total", { mode: "number" }).default(0),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notas_credito = pgTable("notas_credito", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	venta_id: uuid("venta_id").notNull(),
	caja_id: uuid("caja_id"),
	caja_turno_id: uuid("caja_turno_id"),
	usuario_id: uuid("usuario_id").notNull(),
	cliente_id: uuid("cliente_id").notNull(),
	tipo_comprobante_id: varchar("tipo_comprobante_id", { length: 2 }).default('07'),
	serie: varchar("serie", { length: 10 }).notNull(),
	correlativo: integer("correlativo").notNull(),
	fecha_emision: timestamp("fecha_emision", { mode: 'string' }).defaultNow().notNull(),
	tipo_nota_credito_id: varchar("tipo_nota_credito_id", { length: 2 }).notNull(),
	sustento: text("sustento").notNull(),
	moneda: varchar("moneda", { length: 3 }).default('PEN'),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tipo_cambio: bigint("tipo_cambio", { mode: "number" }).default(1),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gravadas: bigint("gravadas", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	exoneradas: bigint("exoneradas", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	inafectas: bigint("inafectas", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	descuento: bigint("descuento", { mode: "number" }).default(0),
	estado: varchar("estado", { length: 20 }).default('EMITIDO'),
	estado_sunat: varchar("estado_sunat", { length: 30 }).default('REGISTRADO'),
	xml_url: varchar("xml_url", { length: 500 }),
	cdr_url: varchar("cdr_url", { length: 500 }),
	pdf_url: varchar("pdf_url", { length: 500 }),
	intentos_envio: integer("intentos_envio").default(0),
	observacion_sunat: text("observacion_sunat"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const detalle_notas_credito = pgTable("detalle_notas_credito", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	nota_credito_id: uuid("nota_credito_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	lote_id: uuid("lote_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_unitario: bigint("precio_unitario", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	descuento: bigint("descuento", { mode: "number" }).default(0),
	tipo_afectacion_igv: smallint("tipo_afectacion_igv").default(10),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const cotizaciones = pgTable("cotizaciones", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	cliente_id: uuid("cliente_id").notNull(),
	almacen_id: uuid("almacen_id"),
	serie: varchar("serie", { length: 10 }).default('COT1'),
	correlativo: integer("correlativo").notNull(),
	fecha_emision: timestamp("fecha_emision", { mode: 'string' }).defaultNow().notNull(),
	fecha_vencimiento: date("fecha_vencimiento").notNull(),
	moneda: varchar("moneda", { length: 3 }).default('PEN'),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tipo_cambio: bigint("tipo_cambio", { mode: "number" }).default(1),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gravadas: bigint("gravadas", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	exoneradas: bigint("exoneradas", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	inafectas: bigint("inafectas", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	descuento: bigint("descuento", { mode: "number" }).default(0),
	estado: varchar("estado", { length: 30 }).default('PENDIENTE'),
	observacion: text("observacion"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const detalle_cotizaciones = pgTable("detalle_cotizaciones", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	cotizacion_id: uuid("cotizacion_id").notNull(),
	producto_id: uuid("producto_id").notNull(),
	presentacion_id: uuid("presentacion_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_unitario: bigint("precio_unitario", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	descuento: bigint("descuento", { mode: "number" }).default(0),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const caja_chica = pgTable("caja_chica", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	nombre: varchar("nombre", { length: 150 }).notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_fondo_fijo: bigint("monto_fondo_fijo", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_actual: bigint("monto_actual", { mode: "number" }).default(0).notNull(),
	activo: boolean("activo").default(true),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const caja_chica_sesiones = pgTable("caja_chica_sesiones", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	caja_chica_id: uuid("caja_chica_id").notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	fecha_apertura: timestamp("fecha_apertura", { mode: 'string' }).defaultNow().notNull(),
	fecha_cierre: timestamp("fecha_cierre", { mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_inicial: bigint("monto_inicial", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_gastado: bigint("monto_gastado", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_reembolsado: bigint("monto_reembolsado", { mode: "number" }).default(0).notNull(),
	estado: varchar("estado", { length: 20 }).default('ABIERTA').notNull(),
	observacion: text("observacion"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const caja_chica_totales = pgTable("caja_chica_totales", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	caja_chica_sesion_id: uuid("caja_chica_sesion_id").notNull(),
	metodo_pago_id: varchar("metodo_pago_id", { length: 5 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_sistema: bigint("monto_sistema", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	monto_declarado: bigint("monto_declarado", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	diferencia: bigint("diferencia", { mode: "number" }).default(0).notNull(),
	observacion: text("observacion"),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const caja_chica_movimientos = pgTable("caja_chica_movimientos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	caja_chica_sesion_id: uuid("caja_chica_sesion_id").notNull(),
	usuario_id: uuid("usuario_id").notNull(),
	tipo_movimiento: varchar("tipo_movimiento", { length: 20 }).notNull(),
	comprobante_id: uuid("comprobante_id"),
	tipo_comprobante_id: varchar("tipo_comprobante_id", { length: 2 }),
	serie: varchar("serie", { length: 10 }),
	correlativo: varchar("correlativo", { length: 20 }),
	metodo_pago_id: varchar("metodo_pago_id", { length: 5 }).default('01').notNull(),
	banco_id: uuid("banco_id"),
	numero_operacion: varchar("numero_operacion", { length: 100 }),
	proveedor_id: uuid("proveedor_id"),
	proveedor_nombre: varchar("proveedor_nombre", { length: 200 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	igv: bigint("igv", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint("total", { mode: "number" }).default(0).notNull(),
	concepto: varchar("concepto", { length: 200 }).notNull(),
	foto_comprobante: text("foto_comprobante"),
	archivo_pdf: text("archivo_pdf"),
	observacion: text("observacion"),
	estado: varchar("estado", { length: 30 }).default('APROBADO').notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const caja_chica_arqueos = pgTable("caja_chica_arqueos", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	caja_chica_sesion_id: uuid("caja_chica_sesion_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	denominacion: bigint("denominacion", { mode: "number" }).notNull(),
	cantidad: integer("cantidad").default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint("subtotal", { mode: "number" }).default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const combo_detalles = pgTable("combo_detalles", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	presentacion_combo_id: uuid("presentacion_combo_id").notNull(),
	presentacion_componente_id: uuid("presentacion_componente_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad: bigint("cantidad", { mode: "number" }).default(1).notNull(),
	activo: boolean("activo").default(true).notNull(),
	sincronizado: boolean("sincronizado").default(false).notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const combo_detalle_pre_ventas = pgTable("combo_detalle_pre_ventas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	detalle_pre_venta_id: uuid("detalle_pre_venta_id").notNull(),
	producto_componente_id: uuid("producto_componente_id").notNull(),
	presentacion_componente_id: uuid("presentacion_componente_id"),
	producto_nombre_snapshot: varchar("producto_nombre_snapshot", { length: 150 }).notNull(),
	presentacion_nombre_snapshot: varchar("presentacion_nombre_snapshot", { length: 150 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad_base_prevista: bigint("cantidad_base_prevista", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	multiplica_por_snapshot: bigint("multiplica_por_snapshot", { mode: "number" }).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const combo_detalle_ventas = pgTable("combo_detalle_ventas", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	detalle_venta_id: uuid("detalle_venta_id").notNull(),
	producto_componente_id: uuid("producto_componente_id").notNull(),
	presentacion_componente_id: uuid("presentacion_componente_id"),
	producto_nombre_snapshot: varchar("producto_nombre_snapshot", { length: 150 }).notNull(),
	presentacion_nombre_snapshot: varchar("presentacion_nombre_snapshot", { length: 150 }).notNull(),
	lote_id: uuid("lote_id"),
	stock_movimiento_id: uuid("stock_movimiento_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cantidad_base: bigint("cantidad_base", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	multiplica_por_snapshot: bigint("multiplica_por_snapshot", { mode: "number" }).notNull(),
	costo_unitario_base_snapshot: numeric("costo_unitario_base_snapshot", { precision: 20, scale:  6 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	costo_total_snapshot: bigint("costo_total_snapshot", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	precio_proporcional_historico: bigint("precio_proporcional_historico", { mode: "number" }).default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		combo_detalle_ventas_stock_movimiento_id_key: unique("combo_detalle_ventas_stock_movimiento_id_key").on(table.stock_movimiento_id),
	}
});

export const compra_flujo = pgTable("compra_flujo", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	id_requerimiento: uuid("id_requerimiento"),
	id_cotizacion: uuid("id_cotizacion"),
	id_orden_compra: uuid("id_orden_compra"),
	id_compra: uuid("id_compra"),
	id_movimiento_almacen: uuid("id_movimiento_almacen"),
	tipo_flujo_id: smallint("tipo_flujo_id").notNull(),
	indicador_pasos: smallint("indicador_pasos").default(0).notNull(),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const conf_envio_whatsapp = pgTable("conf_envio_whatsapp", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	branch_id: uuid("branch_id").notNull(),
	instancia: varchar("instancia", { length: 100 }).default('admin'),
	url: varchar("url", { length: 255 }).notNull(),
	apikey: varchar("apikey", { length: 255 }).notNull(),
	activo: boolean("activo").default(true).notNull(),
	fecharegistro: timestamp("fecharegistro", { mode: 'string' }).defaultNow(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const usuarios = pgTable("usuarios", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	nombre: varchar("nombre", { length: 100 }).notNull(),
	usuario: varchar("usuario", { length: 100 }).notNull(),
	password: varchar("password", { length: 255 }).notNull(),
	activo: boolean("activo").default(true),
	es_super_admin: boolean("es_super_admin").default(false),
	telefono: varchar("telefono", { length: 20 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id_telegram: bigint("id_telegram", { mode: "number" }),
	current_session_id: varchar("current_session_id", { length: 255 }).notNull(),
	last_activity_at: timestamp("last_activity_at", { mode: 'string' }),
	intentos_fallidos: integer("intentos_fallidos").default(0),
	bloqueado: boolean("bloqueado").default(false),
	sincronizado: boolean("sincronizado").default(false),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		usuarios_current_session_id_key: unique("usuarios_current_session_id_key").on(table.current_session_id),
		usuarios_usuario_key: unique("usuarios_usuario_key").on(table.usuario),
	}
});