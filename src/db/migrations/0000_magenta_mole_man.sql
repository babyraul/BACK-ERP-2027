-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
CREATE TABLE IF NOT EXISTS "ubigeo" (
	"codigo" varchar(6) PRIMARY KEY NOT NULL,
	"departamento" varchar(100) NOT NULL,
	"provincia" varchar(100) NOT NULL,
	"distrito" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_afectacion_igv" (
	"codigo" smallint PRIMARY KEY NOT NULL,
	"descripcion" varchar(120) NOT NULL,
	"codigo_tributo" varchar(10) NOT NULL,
	"activo" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_unidades_medida" (
	"id" varchar(5) PRIMARY KEY NOT NULL,
	"codigo" varchar(5) NOT NULL,
	"descripcion" varchar(100) NOT NULL,
	"estado" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_documento_id" varchar(2),
	"numero_documento" varchar(20) NOT NULL,
	"nombre_razon_social" text NOT NULL,
	"direccion_1" text,
	"direccion_2" text,
	"direccion_3" text,
	"email_1" text,
	"email_2" text,
	"email_3" text,
	"telefono_1" varchar(20),
	"telefono_2" varchar(20),
	"telefono_3" varchar(20),
	"branch_id" uuid,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"limite_credito_int" bigint DEFAULT 0,
	"saldo_utilizado_int" bigint DEFAULT 0,
	"dias_credito_pactado" integer DEFAULT 30,
	"cantidad_cuotas" integer DEFAULT 1,
	"estado_credito" varchar(20) DEFAULT 'NORMAL'::character varying,
	CONSTRAINT "clientes_tipo_documento_id_numero_documento_key" UNIQUE("numero_documento","tipo_documento_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_documento" (
	"id" varchar(2) PRIMARY KEY NOT NULL,
	"descripcion" varchar(255) NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"abreviatura" varchar(10)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tokens_autorizacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"token" varchar(10) NOT NULL,
	"tipo_uso" varchar(30) NOT NULL,
	"usuario_autorizador_id" uuid,
	"usuario_solicitante_id" uuid NOT NULL,
	"estado" varchar(20) DEFAULT 'SOLICITADO'::character varying NOT NULL,
	"fecha_expiracion" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"used_at" timestamp,
	"sincronizado" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notificaciones" (
	"id" uuid PRIMARY KEY NOT NULL,
	"branch_id" uuid,
	"usuario_id" uuid,
	"titulo" varchar(255) NOT NULL,
	"mensaje" text NOT NULL,
	"tipo" varchar(50) DEFAULT 'info'::character varying,
	"leido" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_operacion" (
	"id" varchar(5) PRIMARY KEY NOT NULL,
	"codigo" varchar(5) NOT NULL,
	"descripcion" varchar(255) NOT NULL,
	"estado" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_existencia" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"codigo" varchar(10) NOT NULL,
	"descripcion" varchar(255) NOT NULL,
	"estado" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_metodo_pago" (
	"id" varchar(5) PRIMARY KEY NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_impuesto" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"valor" bigint NOT NULL,
	"descripcion" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_cambio" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha" date NOT NULL,
	"compra" numeric(10, 3) NOT NULL,
	"venta" numeric(10, 3) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "tipo_cambio_fecha_key" UNIQUE("fecha")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_serie_correlativo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificador_caja" varchar(50),
	"nombre" varchar(50) NOT NULL,
	"serie" varchar(10) NOT NULL,
	"correlativo" integer DEFAULT 0,
	"branch_id" uuid,
	"tipo_comprobante_id" varchar(10),
	"sincronizado" boolean DEFAULT false,
	"activo" boolean DEFAULT true,
	"tipo_caja" varchar(20) DEFAULT 'ADMINISTRATIVA'::character varying,
	"usuario_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "uq_cajas_comprobante_serie" UNIQUE("serie","tipo_comprobante_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_comprobante" (
	"id" varchar(2) PRIMARY KEY NOT NULL,
	"descripcion" varchar(100) NOT NULL,
	"abreviatura" varchar(10),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_stock" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"descripcion" varchar(150) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_tributos" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"codigo" varchar(10) NOT NULL,
	"descripcion" varchar(255) NOT NULL,
	"codigo_internacional" varchar(10),
	"nombre" varchar(20)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_bancos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"banco" varchar(100) NOT NULL,
	"numero_cuenta" varchar(100) NOT NULL,
	"cci" varchar(100),
	"tipo_moneda" varchar(10) DEFAULT 'PEN'::character varying NOT NULL,
	"branch_id" uuid,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"es_detraccion" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_moneda" (
	"id" varchar(3) PRIMARY KEY NOT NULL,
	"iso" varchar(3) NOT NULL,
	"descripcion" varchar(50) NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "uq_tipomoneda_iso" UNIQUE("iso")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_pago" (
	"id" varchar(2) PRIMARY KEY NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_codigos_detraccion" (
	"codigo" varchar(10) PRIMARY KEY NOT NULL,
	"codigo_sunat" varchar(10) NOT NULL,
	"descripcion" varchar(255) NOT NULL,
	"porcentaje" numeric(5, 2) NOT NULL,
	"activo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_factores" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"valor" integer NOT NULL,
	"descripcion" text,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "factores_codigo_key" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruc" varchar(11) NOT NULL,
	"razon_social" varchar(150) NOT NULL,
	"nombre_comercial" varchar(200),
	"ubigeo" varchar(6),
	"direccion" varchar(255),
	"telefono1" varchar(20),
	"telefono2" varchar(20),
	"email1" varchar(20),
	"email2" varchar(20),
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sucursales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid,
	"ruc" varchar(11) NOT NULL,
	"razon_social" varchar(150) NOT NULL,
	"nombre_comercial" varchar(150),
	"sucursal_nombre" varchar(150),
	"direccion" varchar(255),
	"ubigeo" varchar(6),
	"codigo_anexo" varchar(4),
	"telefono1" varchar(20),
	"telefono2" varchar(20),
	"email1" varchar(20),
	"email2" varchar(20),
	"sire_ruc" varchar(11),
	"sire_usuario_sol" varchar(50),
	"sire_clave_sol" varchar(100),
	"sire_client_id" varchar(250),
	"sire_client_secret" varchar(250),
	"sire_ultimo_sync" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permisos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modulo_id" uuid NOT NULL,
	"codigo" varchar(100) NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permisos_codigo_key" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tipo_motivo_traslado" (
	"id" varchar(5) PRIMARY KEY NOT NULL,
	"codigo_sunat" varchar(5) NOT NULL,
	"descripcion" varchar(250) NOT NULL,
	"mueve_stock" boolean DEFAULT true,
	"activo" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuario_accesos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"empresa_id" uuid NOT NULL,
	"rol_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"es_predeterminado" boolean DEFAULT false,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "modulos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"padre_id" uuid REFERENCES modulos(id) ON DELETE CASCADE,
	"codigo" varchar(50) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"ruta" varchar(255),
	"tipo" varchar(50) DEFAULT 'MODULO' NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modulos_codigo_key" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "empresa_modulos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"modulo_id" uuid NOT NULL,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"empresa_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"nivel" integer DEFAULT 100 NOT NULL,
	"es_sistema" boolean DEFAULT false,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rol_permisos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rol_id" uuid NOT NULL,
	"permiso_id" uuid NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuario_permisos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acceso_id" uuid NOT NULL,
	"permiso_id" uuid NOT NULL,
	"permitido" boolean DEFAULT true NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "almacenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"direccion" varchar(260),
	"codigo" varchar(50),
	"es_principal" boolean DEFAULT false,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text,
	"palabra_clave" varchar(255),
	"codigo_barra" varchar(100),
	"es_facturable" boolean DEFAULT true,
	"es_vendible" boolean DEFAULT true,
	"es_insumo" boolean DEFAULT false,
	"es_producido" boolean DEFAULT false,
	"es_combo" boolean DEFAULT false,
	"unidad_medida_id" varchar(5),
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"codigo_sunat" varchar(50),
	"stock_minimo" integer DEFAULT 0,
	"categoria" uuid,
	"sub_categoria" uuid,
	"tipo_existencia" uuid,
	"tipo_tributo" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "presentaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producto_uuid" uuid,
	"nombre" varchar(250) NOT NULL,
	"cod_barra" varchar(200),
	"palabra_clave" varchar(255),
	"unidad_medida_id" bigint,
	"multiplica_por" bigint DEFAULT 1,
	"ubicacion" varchar(100),
	"precio_costo" bigint DEFAULT 0,
	"precio_venta" bigint DEFAULT 0,
	"precio_mayor" bigint DEFAULT 0,
	"precio_especial" bigint DEFAULT 0,
	"precio_otros" bigint DEFAULT 0,
	"descuento_predefinido" bigint DEFAULT 0,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producto_id" uuid,
	"presentacion_id" uuid,
	"lotes_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"multiplica_por" integer DEFAULT 1,
	"cantidad_base" bigint DEFAULT 0,
	"saldo" bigint DEFAULT 0,
	"documento_id" uuid,
	"documento" varchar(100),
	"tipo_mov" integer,
	"concepto" varchar(255),
	"usuario_id" uuid,
	"branch_id" uuid,
	"almacen_id" uuid,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_actual" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"almacen_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid NOT NULL,
	"lotes_id" uuid,
	"saldo_actual" bigint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proveedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"ruc" varchar(11) NOT NULL,
	"razon_social" varchar(200) NOT NULL,
	"nombre_comercial" varchar(200),
	"direccion" varchar(255),
	"ubigeo" varchar(6),
	"email" varchar(150),
	"telefono" varchar(50),
	"persona_contacto" varchar(150),
	"es_mercaderia" boolean DEFAULT false,
	"es_servicio" boolean DEFAULT false,
	"es_activo" boolean DEFAULT false,
	"es_comisiones" boolean DEFAULT false,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "proveedores_ruc_key" UNIQUE("ruc")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "productos_proveedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"IdProducto" uuid NOT NULL,
	"IdProveedor" uuid NOT NULL,
	"sincronizado" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"nombre" varchar(50) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"sincronizado" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subcategoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idcategoria" uuid NOT NULL,
	"Nombre" varchar(50) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"sincronizado" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mensajeticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"mensaje" varchar(250) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_turnos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"caja_serie_correlativo_id" uuid NOT NULL,
	"identificador_caja" varchar(10) NOT NULL,
	"branch_id" uuid NOT NULL,
	"fecha_apertura" timestamp DEFAULT CURRENT_TIMESTAMP,
	"fecha_cierre_f" timestamp,
	"estado" varchar(20) DEFAULT 'ABIERTA'::character varying,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_totales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caja_turno_id" uuid NOT NULL,
	"metodo_pago_id" varchar(5) NOT NULL,
	"monto_apertura" bigint DEFAULT 0,
	"monto_sistema" bigint DEFAULT 0,
	"monto_declarado" bigint DEFAULT 0,
	"diferencia" bigint DEFAULT 0,
	"observacion" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_movimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"caja_turno_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo_movimiento" varchar(20) NOT NULL,
	"concepto" varchar(150) NOT NULL,
	"monto_total" bigint DEFAULT 0 NOT NULL,
	"observacion" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_arqueos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caja_turno_id" uuid NOT NULL,
	"denominacion" bigint NOT NULL,
	"cantidad" integer DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bancos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"banco" varchar(100) NOT NULL,
	"numero_cuenta" varchar(100) NOT NULL,
	"cci" varchar(100),
	"tipo_moneda" varchar(10) DEFAULT 'PEN'::character varying NOT NULL,
	"es_detraccion" boolean DEFAULT false,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra_requerimiento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"serie" varchar(20) NOT NULL,
	"correlativo" varchar(20) NOT NULL,
	"id_usuario" uuid NOT NULL,
	"fecha_emision" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"estado" varchar(30) NOT NULL,
	"observaciones" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra_requerimiento_detalle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_requerimiento" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"cantidad_aprobada" bigint DEFAULT 0,
	"observacion" varchar(255),
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra_cotizacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"id_requerimiento" uuid,
	"id_proveedor" uuid NOT NULL,
	"codigo_cotizacion" varchar(50) NOT NULL,
	"fecha_cotizacion" date NOT NULL,
	"id_moneda" varchar(3),
	"tipo_cambio" bigint DEFAULT 1,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"impuesto" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"estado" varchar(30) NOT NULL,
	"observaciones" text,
	"archivo_xml" text,
	"archivo_cdr" text,
	"archivo_pdf" text,
	"texto_extraido" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra_cotizacion_detalle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_cotizacion" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"precio_unitario" bigint DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"codigo_sku_proveedor" varchar(100),
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra_orden" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"id_cotizacion" uuid,
	"id_proveedor" uuid NOT NULL,
	"id_usuario" uuid NOT NULL,
	"contacto" varchar(50),
	"serie" varchar(20) NOT NULL,
	"correlativo" varchar(20) NOT NULL,
	"fecha_emision" date NOT NULL,
	"fecha_entrega_esperada" date,
	"condicion_pago" varchar(50) NOT NULL,
	"id_moneda" varchar(3),
	"tipo_cambio" bigint DEFAULT 1,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"impuesto" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"estado" varchar(30) NOT NULL,
	"observaciones" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra_orden_detalle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_orden_compra" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"cantidad_recibida" bigint DEFAULT 0 NOT NULL,
	"precio_unitario" bigint DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"id_orden_compra" uuid,
	"id_proveedor" uuid NOT NULL,
	"id_usuario" uuid NOT NULL,
	"tipo_comprobante_id" varchar(2) NOT NULL,
	"serie" varchar(10) NOT NULL,
	"id_moneda" varchar(3),
	"correlativo" varchar(20) NOT NULL,
	"fecha_emision" date NOT NULL,
	"fecha_vencimiento" date NOT NULL,
	"tipo_cambio" bigint DEFAULT 1,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"tipo_pago" varchar(2) DEFAULT '1'::character varying NOT NULL,
	"estado" varchar(30) DEFAULT 'ACEPTADO'::character varying NOT NULL,
	"estado_pago" varchar(30) DEFAULT 'PENDIENTE'::character varying NOT NULL,
	"estado_sunat" varchar(30) DEFAULT 'REGISTRADO'::character varying NOT NULL,
	"archivo_xml" text,
	"archivo_cdr" text,
	"archivo_pdf" text,
	"sire_id" uuid,
	"periodo" varchar(6),
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra_detalle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_compra" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"precio_unitario" bigint DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"descripcion_proveedor" varchar(255),
	"codigo_sku_proveedor" varchar(100),
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compras_pagos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"id_usuario" uuid NOT NULL,
	"compra_id" uuid NOT NULL,
	"numero_cuota" integer DEFAULT 1 NOT NULL,
	"metodo_pago_id" varchar(5) NOT NULL,
	"banco_id" uuid,
	"monto" bigint DEFAULT 0 NOT NULL,
	"fecha_programada" date,
	"fecha_pago" timestamp,
	"numero_operacion" varchar(100),
	"observacion" text,
	"estado" varchar(30) DEFAULT 'PAGADO'::character varying NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compras_sire" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"proveedor_ruc" varchar(20) NOT NULL,
	"proveedor_nombre" varchar(250) NOT NULL,
	"tipo_comprobante" varchar(5) NOT NULL,
	"serie" varchar(20) NOT NULL,
	"correlativo" varchar(20) NOT NULL,
	"fecha_emision" date NOT NULL,
	"fecha_vencimiento" date,
	"monto_neto" bigint DEFAULT 0 NOT NULL,
	"monto_igv" bigint DEFAULT 0 NOT NULL,
	"monto_total" bigint DEFAULT 0 NOT NULL,
	"moneda" varchar(5) DEFAULT 'PEN'::character varying,
	"estado_reconciliacion" varchar(20) DEFAULT 'PENDIENTE'::character varying,
	"orden_compra_id" uuid,
	"periodo" varchar(6) NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"tipo_adquisicion" varchar(30) DEFAULT 'MERCADERIA'::character varying,
	"aplica_detraccion" boolean DEFAULT false,
	"tasa_detraccion" numeric(5, 2) DEFAULT 0.00,
	"monto_detraccion" numeric(12, 4) DEFAULT 0.0000,
	"comisiones" numeric(10, 2) DEFAULT 0,
	"archivo_xml" text,
	"archivo_pdf" text,
	"estado_descarga_archivos" varchar(20) DEFAULT 'PENDIENTE'::character varying
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movimiento_almacen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"id_almacen_destino" uuid NOT NULL,
	"id_almacen_origen" uuid,
	"id_usuario" uuid NOT NULL,
	"id_usuario_aprobador" uuid,
	"id_proveedor" uuid,
	"id_tipo_transaccion" varchar(10) NOT NULL,
	"id_compra" uuid,
	"id_nota_egreso" uuid,
	"id_guia_remision" uuid,
	"fecha_movimiento" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"tipo_movimiento" bigint,
	"observacion" text,
	"estado" varchar(30) DEFAULT 'REGISTRADO'::character varying NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movimiento_almacen_detalle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movimiento_almacen_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"lote_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"precio_unitario" bigint DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"observacion" varchar(255),
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recetas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"cantidad_producida" bigint DEFAULT 1 NOT NULL,
	"observacion" text,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recetas_detalles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receta_id" uuid NOT NULL,
	"producto_insumo_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"id_usuario" uuid NOT NULL,
	"codigo_lote" varchar(100) NOT NULL,
	"fecha_fabricacion" date,
	"fecha_vencimiento" date,
	"costo_unitario" bigint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ventas_sire" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"cliente_tipo_documento" varchar(5),
	"cliente_ruc" varchar(20),
	"cliente_nombre" varchar(250),
	"tipo_comprobante" varchar(2) NOT NULL,
	"serie" varchar(10) NOT NULL,
	"correlativo" varchar(20) NOT NULL,
	"fecha_emision" date NOT NULL,
	"fecha_vencimiento" date,
	"monto_neto" bigint DEFAULT 0 NOT NULL,
	"monto_igv" bigint DEFAULT 0 NOT NULL,
	"monto_total" bigint DEFAULT 0 NOT NULL,
	"moneda" varchar(5) DEFAULT 'PEN'::character varying,
	"estado_reconciliacion" varchar(20) DEFAULT 'PENDIENTE'::character varying,
	"periodo" varchar(6) NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"venta_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pre_ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"estado" varchar(20),
	"caja_id" uuid,
	"caja_turno_id" uuid,
	"usuario_id" uuid,
	"cliente_id" uuid,
	"correo_cliente" varchar(120),
	"alias" varchar(15),
	"tipo_comprobante_id" varchar(2),
	"tipo_pago_id" varchar(2) DEFAULT '1'::character varying,
	"moneda" varchar(3),
	"tipo_cambio" bigint DEFAULT 1,
	"fecha_emision" timestamp DEFAULT now(),
	"fecha_vencimiento" timestamp DEFAULT now(),
	"gravadas" bigint,
	"exoneradas" bigint,
	"inafectas" bigint,
	"igv" bigint,
	"total_venta" bigint,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "detalle_pre_ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"preventa_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid NOT NULL,
	"lote_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"precio_unitario" bigint DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"preventa_id" uuid,
	"caja_id" uuid,
	"caja_turno_id" uuid,
	"usuario_id" uuid,
	"cliente_id" uuid,
	"correo_cliente" varchar(120),
	"alias" varchar(15),
	"tipo_comprobante_id" varchar(2),
	"serie" varchar(10),
	"correlativo" integer,
	"fecha_emision" timestamp DEFAULT now(),
	"fecha_vencimiento" timestamp DEFAULT now(),
	"moneda" varchar(3),
	"tipo_cambio" bigint DEFAULT 1,
	"gravadas" bigint,
	"exoneradas" bigint,
	"inafectas" bigint,
	"igv" bigint,
	"total_venta" bigint,
	"descuento" bigint DEFAULT 0,
	"gratuitas" bigint DEFAULT 0,
	"observacion_venta" text,
	"estado" varchar(20) DEFAULT 'EMITIDO'::character varying,
	"tipo_pago_id" varchar(2) DEFAULT '1'::character varying,
	"impuesto_id" varchar(10),
	"tipo_operacion_id" varchar(5) DEFAULT '1'::character varying,
	"estado_pago" varchar(20) DEFAULT 'PAGADO'::character varying,
	"facturado" boolean DEFAULT false,
	"ventas_facturacion_id" uuid,
	"xml_url" varchar(500),
	"cdr_url" varchar(500),
	"pdf_url" varchar(500),
	"intentos_envio" integer DEFAULT 0,
	"observacion_sunat" text,
	"payment_info" jsonb,
	"detraccion_info" jsonb,
	"baja_ticket" varchar(250),
	"baja_cdr_url" varchar(500),
	"baja_xml_url" varchar(500),
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ventas_preventa_id_key" UNIQUE("preventa_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "detalle_ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venta_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"lote_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"precio_unitario" bigint DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"descuento" bigint DEFAULT 0,
	"tipo_afectacion_igv" smallint DEFAULT 10,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ventas_pagos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"venta_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"numero_cuota" integer DEFAULT 1 NOT NULL,
	"metodo_pago_id" varchar(5) NOT NULL,
	"banco_id" uuid,
	"monto" bigint DEFAULT 0 NOT NULL,
	"fecha_programada" date,
	"fecha_pago" timestamp DEFAULT now(),
	"numero_operacion" varchar(100),
	"observacion" text,
	"estado" varchar(30) DEFAULT 'PAGADO'::character varying NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehiculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid,
	"placa" varchar(50) NOT NULL,
	"descripcion" varchar(150),
	"es_propio" boolean DEFAULT true,
	"tipo_vehiculo" varchar(50) DEFAULT 'CAMION'::character varying,
	"sincronizado" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "vehiculos_placa_key" UNIQUE("placa")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conductores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"numero_documento" varchar(20) NOT NULL,
	"nombres" varchar(200) NOT NULL,
	"licencia_conducir" varchar(50),
	"tipo_licencia" varchar(50),
	"fecha_vencimiento_licencia" date,
	"estado" varchar(20),
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transportistas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"ruc" varchar(11) NOT NULL,
	"razon_social" varchar(250) NOT NULL,
	"nombre_comercial" varchar(200),
	"registro_mtc" varchar(50),
	"direccion" varchar(255),
	"telefono" varchar(50),
	"email" varchar(150),
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "transportistas_ruc_key" UNIQUE("ruc")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guias_remision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"venta_id" uuid,
	"cliente_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"almacen_origen_id" uuid NOT NULL,
	"caja_turno_id" uuid NOT NULL,
	"vehiculo_id" uuid,
	"conductor_id" uuid,
	"transportista_id" uuid,
	"tipo_comprobante_id" varchar(2) DEFAULT '09'::character varying,
	"serie" varchar(10) NOT NULL,
	"correlativo" integer NOT NULL,
	"fecha_emision" timestamp DEFAULT now() NOT NULL,
	"fecha_traslado" date NOT NULL,
	"peso" varchar(10),
	"num_bultos" integer,
	"motivo_traslado_id" varchar(5),
	"descripcion_traslado" varchar(255),
	"modalidad_transporte" varchar(5) NOT NULL,
	"ubigeo_partida" varchar(6) NOT NULL,
	"direccion_partida" varchar(255) NOT NULL,
	"ubigeo_llegada" varchar(6) NOT NULL,
	"direccion_llegada" varchar(255) NOT NULL,
	"transportista_mtc" varchar(50),
	"estado" varchar(20) DEFAULT 'EMITIDO'::character varying,
	"estado_sunat" varchar(30) DEFAULT 'REGISTRADO'::character varying,
	"xml_url" varchar(500),
	"cdr_url" varchar(500),
	"pdf_url" varchar(500),
	"observacion" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "detalle_guias_remision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guia_remision_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"lote_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"peso_total" bigint DEFAULT 0,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notas_credito" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"venta_id" uuid NOT NULL,
	"caja_id" uuid,
	"caja_turno_id" uuid,
	"usuario_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tipo_comprobante_id" varchar(2) DEFAULT '07'::character varying,
	"serie" varchar(10) NOT NULL,
	"correlativo" integer NOT NULL,
	"fecha_emision" timestamp DEFAULT now() NOT NULL,
	"tipo_nota_credito_id" varchar(2) NOT NULL,
	"sustento" text NOT NULL,
	"moneda" varchar(3) DEFAULT 'PEN'::character varying,
	"tipo_cambio" bigint DEFAULT 1,
	"gravadas" bigint DEFAULT 0 NOT NULL,
	"exoneradas" bigint DEFAULT 0 NOT NULL,
	"inafectas" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"descuento" bigint DEFAULT 0,
	"estado" varchar(20) DEFAULT 'EMITIDO'::character varying,
	"estado_sunat" varchar(30) DEFAULT 'REGISTRADO'::character varying,
	"xml_url" varchar(500),
	"cdr_url" varchar(500),
	"pdf_url" varchar(500),
	"intentos_envio" integer DEFAULT 0,
	"observacion_sunat" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "detalle_notas_credito" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nota_credito_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"lote_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"precio_unitario" bigint DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"descuento" bigint DEFAULT 0,
	"tipo_afectacion_igv" smallint DEFAULT 10,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cotizaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"almacen_id" uuid,
	"serie" varchar(10) DEFAULT 'COT1'::character varying,
	"correlativo" integer NOT NULL,
	"fecha_emision" timestamp DEFAULT now() NOT NULL,
	"fecha_vencimiento" date NOT NULL,
	"moneda" varchar(3) DEFAULT 'PEN'::character varying,
	"tipo_cambio" bigint DEFAULT 1,
	"gravadas" bigint DEFAULT 0 NOT NULL,
	"exoneradas" bigint DEFAULT 0 NOT NULL,
	"inafectas" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"descuento" bigint DEFAULT 0,
	"estado" varchar(30) DEFAULT 'PENDIENTE'::character varying,
	"observacion" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "detalle_cotizaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cotizacion_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"presentacion_id" uuid,
	"cantidad" bigint DEFAULT 0 NOT NULL,
	"precio_unitario" bigint DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"descuento" bigint DEFAULT 0,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_chica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"usuario_id" uuid NOT NULL,
	"monto_fondo_fijo" bigint DEFAULT 0 NOT NULL,
	"monto_actual" bigint DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_chica_sesiones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"caja_chica_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"fecha_apertura" timestamp DEFAULT now() NOT NULL,
	"fecha_cierre" timestamp,
	"monto_inicial" bigint DEFAULT 0 NOT NULL,
	"monto_gastado" bigint DEFAULT 0 NOT NULL,
	"monto_reembolsado" bigint DEFAULT 0 NOT NULL,
	"estado" varchar(20) DEFAULT 'ABIERTA'::character varying NOT NULL,
	"observacion" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_chica_totales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caja_chica_sesion_id" uuid NOT NULL,
	"metodo_pago_id" varchar(5) NOT NULL,
	"monto_sistema" bigint DEFAULT 0 NOT NULL,
	"monto_declarado" bigint DEFAULT 0 NOT NULL,
	"diferencia" bigint DEFAULT 0 NOT NULL,
	"observacion" text,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_chica_movimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"caja_chica_sesion_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo_movimiento" varchar(20) NOT NULL,
	"comprobante_id" uuid,
	"tipo_comprobante_id" varchar(2),
	"serie" varchar(10),
	"correlativo" varchar(20),
	"metodo_pago_id" varchar(5) DEFAULT '01'::character varying NOT NULL,
	"banco_id" uuid,
	"numero_operacion" varchar(100),
	"proveedor_id" uuid,
	"proveedor_nombre" varchar(200),
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"igv" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"concepto" varchar(200) NOT NULL,
	"foto_comprobante" text,
	"archivo_pdf" text,
	"observacion" text,
	"estado" varchar(30) DEFAULT 'APROBADO'::character varying NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_chica_arqueos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caja_chica_sesion_id" uuid NOT NULL,
	"denominacion" bigint NOT NULL,
	"cantidad" integer DEFAULT 0 NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "combo_detalles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"presentacion_combo_id" uuid NOT NULL,
	"presentacion_componente_id" uuid NOT NULL,
	"cantidad" bigint DEFAULT 1 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"sincronizado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "combo_detalle_pre_ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"detalle_pre_venta_id" uuid NOT NULL,
	"producto_componente_id" uuid NOT NULL,
	"presentacion_componente_id" uuid,
	"producto_nombre_snapshot" varchar(150) NOT NULL,
	"presentacion_nombre_snapshot" varchar(150) NOT NULL,
	"cantidad_base_prevista" bigint NOT NULL,
	"multiplica_por_snapshot" bigint NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "combo_detalle_ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"detalle_venta_id" uuid NOT NULL,
	"producto_componente_id" uuid NOT NULL,
	"presentacion_componente_id" uuid,
	"producto_nombre_snapshot" varchar(150) NOT NULL,
	"presentacion_nombre_snapshot" varchar(150) NOT NULL,
	"lote_id" uuid,
	"stock_movimiento_id" uuid NOT NULL,
	"cantidad_base" bigint NOT NULL,
	"multiplica_por_snapshot" bigint NOT NULL,
	"costo_unitario_base_snapshot" numeric(20, 6) NOT NULL,
	"costo_total_snapshot" bigint NOT NULL,
	"precio_proporcional_historico" bigint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "combo_detalle_ventas_stock_movimiento_id_key" UNIQUE("stock_movimiento_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compra_flujo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_requerimiento" uuid,
	"id_cotizacion" uuid,
	"id_orden_compra" uuid,
	"id_compra" uuid,
	"id_movimiento_almacen" uuid,
	"tipo_flujo_id" smallint NOT NULL,
	"indicador_pasos" smallint DEFAULT 0 NOT NULL,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conf_envio_whatsapp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"instancia" varchar(100) DEFAULT 'admin'::character varying,
	"url" varchar(255) NOT NULL,
	"apikey" varchar(255) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"fecharegistro" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"usuario" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"activo" boolean DEFAULT true,
	"es_super_admin" boolean DEFAULT false,
	"telefono" varchar(20),
	"id_telegram" bigint,
	"current_session_id" varchar(255) NOT NULL,
	"last_activity_at" timestamp,
	"intentos_fallidos" integer DEFAULT 0,
	"bloqueado" boolean DEFAULT false,
	"sincronizado" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "usuarios_current_session_id_key" UNIQUE("current_session_id"),
	CONSTRAINT "usuarios_usuario_key" UNIQUE("usuario")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caja_serie_correlativo" ADD CONSTRAINT "cajas_tipo_comprobante_id_fkey" FOREIGN KEY ("tipo_comprobante_id") REFERENCES "public"."tipo_comprobante"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ubigeo_departamento" ON "ubigeo" USING btree ("departamento" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ubigeo_distrito" ON "ubigeo" USING btree ("distrito" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ubigeo_full" ON "ubigeo" USING btree ("departamento" text_ops,"provincia" text_ops,"distrito" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ubigeo_provincia" ON "ubigeo" USING btree ("provincia" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_afectacion_igv_activo" ON "tipo_afectacion_igv" USING btree ("activo" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_afectacion_igv_activo_tributo" ON "tipo_afectacion_igv" USING btree ("codigo_tributo" bool_ops,"activo" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_afectacion_igv_descripcion" ON "tipo_afectacion_igv" USING btree ("descripcion" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_afectacion_igv_tributo" ON "tipo_afectacion_igv" USING btree ("codigo_tributo" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_unidades_medida_codigo" ON "tipo_unidades_medida" USING btree ("codigo" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_unidades_medida_descripcion" ON "tipo_unidades_medida" USING btree ("descripcion" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_unidades_medida_estado_codigo" ON "tipo_unidades_medida" USING btree ("estado" text_ops,"codigo" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_branch" ON "clientes" USING btree ("branch_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_email1" ON "clientes" USING btree ("email_1" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_email2" ON "clientes" USING btree ("email_2" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_email3" ON "clientes" USING btree ("email_3" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_estado_credito" ON "clientes" USING btree ("estado_credito" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_limite_saldo" ON "clientes" USING btree ("limite_credito_int" int8_ops,"saldo_utilizado_int" int8_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tel1" ON "clientes" USING btree ("telefono_1" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tel2" ON "clientes" USING btree ("telefono_2" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tel3" ON "clientes" USING btree ("telefono_3" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_clientes_tipo_dni_num" ON "clientes" USING btree ("tipo_documento_id" text_ops,"numero_documento" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_branch" ON "notificaciones" USING btree ("branch_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_leido" ON "notificaciones" USING btree ("leido" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_usuario" ON "notificaciones" USING btree ("usuario_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_cambio_compra" ON "tipo_cambio" USING btree ("compra" numeric_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_cambio_fecha_compra" ON "tipo_cambio" USING btree ("fecha" date_ops,"compra" numeric_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_cambio_venta" ON "tipo_cambio" USING btree ("venta" numeric_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_activas" ON "caja_serie_correlativo" USING btree ("branch_id" text_ops,"tipo_caja" uuid_ops) WHERE (activo = true);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_activo" ON "caja_serie_correlativo" USING btree ("activo" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_branch" ON "caja_serie_correlativo" USING btree ("branch_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_identificador" ON "caja_serie_correlativo" USING btree ("identificador_caja" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_tipo_caja" ON "caja_serie_correlativo" USING btree ("tipo_caja" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_tipo_comprobante" ON "caja_serie_correlativo" USING btree ("tipo_comprobante_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_tipo_serie_corr" ON "caja_serie_correlativo" USING btree ("tipo_comprobante_id" int4_ops,"serie" int4_ops,"correlativo" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_usuario" ON "caja_serie_correlativo" USING btree ("usuario_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_ci" ON "tipo_tributos" USING btree ("codigo_internacional" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_codigo" ON "tipo_tributos" USING btree ("codigo" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_codigo_nombre" ON "tipo_tributos" USING btree ("codigo" text_ops,"nombre" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_id_codigo" ON "tipo_tributos" USING btree ("id" text_ops,"codigo" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_nombre" ON "tipo_tributos" USING btree ("nombre" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_activo" ON "tipo_codigos_detraccion" USING btree ("activo" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_desc" ON "tipo_codigos_detraccion" USING btree ("descripcion" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_porcentaje" ON "tipo_codigos_detraccion" USING btree ("porcentaje" numeric_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_sunat" ON "tipo_codigos_detraccion" USING btree ("codigo_sunat" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_sunat_activo" ON "tipo_codigos_detraccion" USING btree ("codigo_sunat" text_ops,"activo" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_empresas_ruc" ON "empresas" USING btree ("ruc" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sucursales_empresa_id" ON "sucursales" USING btree ("empresa_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sucursales_ruc" ON "sucursales" USING btree ("ruc" text_ops);
