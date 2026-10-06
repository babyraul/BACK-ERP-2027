CREATE TABLE IF NOT EXISTS "caja_serie_correlativo" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "usuario_id" uuid,
    "identificador_caja" varying(50),
    "nombre" varying(50) NOT NULL,
    "serie" varying(10) NOT NULL,
    "correlativo" integer DEFAULT 0,
    "tipo_comprobante_id" varying(2) NOT NULL,
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "tipo_caja" varying(20) DEFAULT 'ADMINISTRATIVA'::charactervarying,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "clientes" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "tipo_documento_id" character varying(2),
    "numero_documento" character varying(20) NOT NULL,
    "nombre_razon_social" text NOT NULL,
    "direccion_1" text,
    "direccion_2" text,
    "direccion_3" text,
    "email_1" text,
    "email_2" text,
    "email_3" text,
    "telefono_1" character varying(20),
    "telefono_2" character varying(20),
    "telefono_3" character varying(20),
    "branch_id" uuid,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "limite_credito_int" bigint DEFAULT 0,
    "saldo_utilizado_int" bigint DEFAULT 0,
    "dias_credito_pactado" integer DEFAULT 30,
    "cantidad_cuotas" integer DEFAULT 1,
    "estado_credito" character varying(20) DEFAULT 'NORMAL'::charactervarying
);

CREATE TABLE IF NOT EXISTS "tipo_factores" (
    "id" integer PRIMARY KEY NOT NULL,
    "codigo" character varying(50) NOT NULL UNIQUE,
    "valor" integer NOT NULL,
    "descripcion" text,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "notificaciones" (
    "id" uuid PRIMARY KEY NOT NULL,
    "branch_id" uuid,
    "usuario_id" uuid,
    "titulo" character varying(255) NOT NULL,
    "mensaje" text NOT NULL,
    "tipo" character varying(50) DEFAULT 'info'::charactervarying,
    "leido" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tipo_afectacion_igv" (
    "codigo" smallint PRIMARY KEY NOT NULL,
    "descripcion" character varying(120) NOT NULL,
    "codigo_tributo" character varying(10) NOT NULL,
    "activo" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "tipo_bancos" (
    "id" uuid PRIMARY KEY NOT NULL,
    "banco" character varying(100) NOT NULL,
    "numero_cuenta" character varying(100) NOT NULL,
    "cci" character varying(100),
    "tipo_moneda" character varying(10) NOT NULL DEFAULT 'PEN'::charactervarying,
    "branch_id" uuid,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "es_detraccion" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "tipo_cambio" (
    "id" integer PRIMARY KEY NOT NULL,
    "fecha" date NOT NULL UNIQUE,
    "compra" numeric(10,3) NOT NULL,
    "venta" numeric(10,3) NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tipo_codigos_detraccion" (
    "codigo" character varying(10) PRIMARY KEY NOT NULL,
    "codigo_sunat" character varying(10) NOT NULL,
    "descripcion" character varying(255) NOT NULL,
    "porcentaje" numeric(5,2) NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tipo_comprobante" (
    "id" varying(2) PRIMARY KEY NOT NULL,
    "descripcion" varying(100) NOT NULL,
    "abreviatura" varying(10),
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tipo_documento" (
    "id" character varying(2) PRIMARY KEY NOT NULL,
    "descripcion" character varying(255) NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "abreviatura" character varying(10)
);

CREATE TABLE IF NOT EXISTS "tipo_existencia" (
    "id" character varying(10) PRIMARY KEY NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descripcion" character varying(255) NOT NULL,
    "estado" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "tipo_impuesto" (
    "id" character varying(10) PRIMARY KEY NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "valor" bigint NOT NULL,
    "descripcion" character varying(255)
);

CREATE TABLE IF NOT EXISTS "tipo_metodo_pago" (
    "id" character varying(5) PRIMARY KEY NOT NULL,
    "nombre" character varying(50) NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tipo_moneda" (
    "id" character varying(3) PRIMARY KEY NOT NULL,
    "iso" character varying(3) NOT NULL UNIQUE,
    "descripcion" character varying(50) NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tipo_operacion" (
    "id" character varying(5) PRIMARY KEY NOT NULL,
    "codigo" character varying(5) NOT NULL,
    "descripcion" character varying(255) NOT NULL,
    "estado" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "tipo_pago" (
    "id" character varying(2) PRIMARY KEY NOT NULL,
    "nombre" character varying(50) NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tipo_stock" (
    "id" character varying(50) PRIMARY KEY NOT NULL,
    "descripcion" character varying(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS "tipo_tributos" (
    "id" character varying(10) PRIMARY KEY NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descripcion" character varying(255) NOT NULL,
    "codigo_internacional" character varying(10),
    "nombre" character varying(20)
);

CREATE TABLE IF NOT EXISTS "tipo_unidades_medida" (
    "id" varying(5) PRIMARY KEY NOT NULL,
    "codigo" character varying(5) NOT NULL,
    "descripcion" character varying(100) NOT NULL,
    "estado" boolean DEFAULT true,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tokens_autorizacion" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "token" character varying(10) NOT NULL,
    "tipo_uso" character varying(30) NOT NULL,
    "usuario_autorizador_id" uuid,
    "usuario_solicitante_id" uuid NOT NULL,
    "estado" character varying(20) NOT NULL DEFAULT 'SOLICITADO'::charactervarying,
    "fecha_expiracion" timestamp,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "used_at" timestamp,
    "sincronizado" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "ubigeo" (
    "codigo" character varying(6) PRIMARY KEY NOT NULL,
    "departamento" character varying(100) NOT NULL,
    "provincia" character varying(100) NOT NULL,
    "distrito" character varying(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS "empresas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "sucursales" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    "sire_ultimo_sync" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "usuarios" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "nombre" varchar(100) NOT NULL,
    "usuario" varchar(100) NOT NULL UNIQUE,
    "password" varchar(255) NOT NULL,
    "activo" boolean DEFAULT true,
    "es_super_admin" boolean DEFAULT false,
    "telefono" varchar(20),
    "id_telegram" bigint,
    "current_session_id" varchar(255) NOT NULL UNIQUE,
    "last_activity_at" timestamp,
    "intentos_fallidos" integer DEFAULT 0,
    "bloqueado" boolean DEFAULT false,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "usuario_accesos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" uuid NOT NULL,
    "empresa_id" uuid NOT NULL,
    "rol_id" uuid NOT NULL,
    "branch_id" uuid NOT NULL,
    "es_predeterminado" boolean DEFAULT false,
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "modulos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "codigo" varchar(50) NOT NULL UNIQUE,
    "nombre" varchar(100) NOT NULL,
    "descripcion" text,
    "activo" boolean DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "empresa_modulos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" uuid NOT NULL,
    "modulo_id" uuid NOT NULL,
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "roles" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "empresa_id" uuid NOT NULL,
    "nombre" varchar(100) NOT NULL,
    "descripcion" text,
    "nivel" integer NOT NULL DEFAULT 100,
    "es_sistema" boolean DEFAULT false,
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "permisos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "modulo_id" uuid NOT NULL,
    "codigo" varchar(100) NOT NULL UNIQUE,
    "nombre" varchar(150) NOT NULL,
    "descripcion" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "rol_permisos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "rol_id" uuid NOT NULL,
    "permiso_id" uuid NOT NULL,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "usuario_permisos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "acceso_id" uuid NOT NULL,
    "permiso_id" uuid NOT NULL,
    "permitido" boolean NOT NULL DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "almacenes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "nombre" varchar(200) NOT NULL,
    "direccion" varchar(260),
    "codigo" varchar(50),
    "es_principal" boolean DEFAULT false,
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "productos" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "codigo_sunat" varchar(50),
    "stock_minimo" int DEFAULT 0,
    "categoria" uuid,
    "sub_categoria" uuid,
    "tipo_existencia" uuid,
    "tipo_tributo" uuid
);

CREATE TABLE IF NOT EXISTS "presentaciones" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "stock" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "producto_id" uuid,
    "presentacion_id" uuid,
    "lotes_id" uuid,
    "cantidad" bigint NOT NULL DEFAULT 0,
    "multiplica_por" int DEFAULT 1,
    "cantidad_base" bigint DEFAULT 0,
    "saldo" bigint DEFAULT 0,
    "documento_id" uuid,
    "documento" varchar(100),
    "tipo_mov" int,
    "concepto" varchar(255),
    "usuario_id" uuid,
    "branch_id" uuid,
    "almacen_id" uuid,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "stock_actual" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "almacen_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid NOT NULL,
    "lotes_id" uuid,
    "saldo_actual" bigint NOT NULL DEFAULT 0,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "proveedores" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "ruc" varchar(11) NOT NULL UNIQUE,
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
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "productos_proveedores" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "IdProducto" uuid NOT NULL,
    "IdProveedor" uuid NOT NULL,
    "sincronizado" boolean DEFAULT true,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "categorias" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "nombre" varchar(50) NOT NULL,
    "activo" boolean NOT NULL DEFAULT true,
    "sincronizado" boolean DEFAULT true,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "subcategoria" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "idcategoria" uuid NOT NULL,
    "Nombre" varchar(50) NOT NULL,
    "activo" boolean NOT NULL DEFAULT true,
    "sincronizado" boolean DEFAULT true,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "mensajeticket" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "mensaje" varchar(250) NOT NULL
);

CREATE TABLE IF NOT EXISTS "caja_turnos" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" uuid NOT NULL,
    "caja_serie_correlativo_id" uuid NOT NULL,
    "identificador_caja" varchar(10) NOT NULL,
    "branch_id" uuid NOT NULL,
    "fecha_apertura" timestamp DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre_f" timestamp,
    "estado" varchar(20) DEFAULT 'ABIERTA',
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "caja_totales" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "caja_turno_id" uuid NOT NULL,
    "metodo_pago_id" varchar(5) NOT NULL,
    "monto_apertura" int8 DEFAULT 0,
    "monto_sistema" int8 DEFAULT 0,
    "monto_declarado" int8 DEFAULT 0,
    "diferencia" int8 DEFAULT 0,
    "observacion" text,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "caja_movimientos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "caja_turno_id" uuid NOT NULL,
    "usuario_id" uuid NOT NULL,
    "tipo_movimiento" varchar(20) NOT NULL,
    "concepto" varchar(150) NOT NULL,
    "monto_total" int8 NOT NULL DEFAULT 0,
    "observacion" text,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "caja_arqueos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "caja_turno_id" uuid NOT NULL,
    "denominacion" int8 NOT NULL,
    "cantidad" int NOT NULL DEFAULT 0,
    "subtotal" int8 NOT NULL DEFAULT 0,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "bancos" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "banco" varchar(100) NOT NULL,
    "numero_cuenta" varchar(100) NOT NULL,
    "cci" varchar(100),
    "tipo_moneda" varchar(10) NOT NULL DEFAULT 'PEN',
    "es_detraccion" bool DEFAULT false,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra_flujo" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_requerimiento" uuid,
    "id_cotizacion" uuid,
    "id_orden_compra" uuid,
    "id_compra" uuid,
    "id_movimiento_almacen" uuid,
    "tipo_flujo_id" SMALLINT NOT NULL,
    "indicador_pasos" SMALLINT NOT NULL DEFAULT 0,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra_requerimiento" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "serie" varchar(20) NOT NULL,
    "correlativo" varchar(20) NOT NULL,
    "id_usuario" uuid NOT NULL,
    "fecha_emision" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" VARCHAR(30) NOT NULL,
    "observaciones" TEXT,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra_requerimiento_detalle" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_requerimiento" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "cantidad" bigint NOT NULL DEFAULT 0,
    "cantidad_aprobada" bigint DEFAULT 0,
    "observacion" varchar(255),
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra_cotizacion" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "id_requerimiento" uuid,
    "id_proveedor" uuid NOT NULL,
    "codigo_cotizacion" VARCHAR(50) NOT NULL,
    "fecha_cotizacion" DATE NOT NULL,
    "id_moneda" varchar(3),
    "tipo_cambio" bigint DEFAULT 1,
    "subtotal" bigint NOT NULL DEFAULT 0,
    "impuesto" bigint NOT NULL DEFAULT 0,
    "total" bigint NOT NULL DEFAULT 0,
    "estado" VARCHAR(30) NOT NULL,
    "observaciones" TEXT,
    "archivo_xml" TEXT,
    "archivo_cdr" TEXT,
    "archivo_pdf" TEXT,
    "texto_extraido" TEXT,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra_cotizacion_detalle" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_cotizacion" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "cantidad" bigint NOT NULL DEFAULT 0,
    "precio_unitario" bigint NOT NULL DEFAULT 0,
    "subtotal" bigint NOT NULL DEFAULT 0,
    "codigo_sku_proveedor" VARCHAR(100),
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra_orden" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "id_cotizacion" uuid,
    "id_proveedor" uuid NOT NULL,
    "id_usuario" uuid NOT NULL,
    "contacto" varchar(50),
    "serie" varchar(20) NOT NULL,
    "correlativo" varchar(20) NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "fecha_entrega_esperada" DATE,
    "condicion_pago" VARCHAR(50) NOT NULL,
    "id_moneda" varchar(3),
    "tipo_cambio" bigint DEFAULT 1,
    "subtotal" bigint NOT NULL DEFAULT 0,
    "impuesto" bigint NOT NULL DEFAULT 0,
    "total" bigint NOT NULL DEFAULT 0,
    "estado" VARCHAR(30) NOT NULL,
    "observaciones" TEXT,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra_orden_detalle" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_orden_compra" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "cantidad" bigint NOT NULL DEFAULT 0,
    "cantidad_recibida" bigint NOT NULL DEFAULT 0,
    "precio_unitario" bigint NOT NULL DEFAULT 0,
    "subtotal" bigint NOT NULL DEFAULT 0,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "id_orden_compra" uuid,
    "id_proveedor" uuid NOT NULL,
    "id_usuario" uuid NOT NULL,
    "tipo_comprobante_id" VARCHAR(2) NOT NULL,
    "serie" VARCHAR(10) NOT NULL,
    "id_moneda" varchar(3),
    "correlativo" VARCHAR(20) NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "tipo_cambio" bigint DEFAULT 1,
    "subtotal" bigint NOT NULL DEFAULT 0,
    "igv" bigint NOT NULL DEFAULT 0,
    "total" bigint NOT NULL DEFAULT 0,
    "tipo_pago" character varying(2) NOT NULL DEFAULT '1',
    "estado" VARCHAR(30) NOT NULL DEFAULT 'ACEPTADO',
    "estado_pago" VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    "estado_sunat" VARCHAR(30) NOT NULL DEFAULT 'REGISTRADO',
    "archivo_xml" TEXT,
    "archivo_cdr" TEXT,
    "archivo_pdf" TEXT,
    "sire_id" uuid,
    "periodo" varchar(6),
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compra_detalle" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "id_compra" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "cantidad" bigint NOT NULL DEFAULT 0,
    "precio_unitario" bigint NOT NULL DEFAULT 0,
    "subtotal" bigint NOT NULL DEFAULT 0,
    "igv" bigint NOT NULL DEFAULT 0,
    "total" bigint NOT NULL DEFAULT 0,
    "descripcion_proveedor" VARCHAR(255),
    "codigo_sku_proveedor" VARCHAR(100),
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compras_pagos" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "id_usuario" uuid NOT NULL,
    "compra_id" uuid NOT NULL,
    "numero_cuota" int NOT NULL DEFAULT 1,
    "metodo_pago_id" varchar(5) NOT NULL,
    "banco_id" uuid,
    "monto" bigint NOT NULL DEFAULT 0,
    "fecha_programada" date,
    "fecha_pago" timestamp,
    "numero_operacion" varchar(100),
    "observacion" text,
    "estado" varchar(30) NOT NULL DEFAULT 'PAGADO',
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "compras_sire" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "proveedor_ruc" varchar(20) NOT NULL,
    "proveedor_nombre" varchar(250) NOT NULL,
    "tipo_comprobante" varchar(5) NOT NULL,
    "serie" varchar(20) NOT NULL,
    "correlativo" varchar(20) NOT NULL,
    "fecha_emision" date NOT NULL,
    "fecha_vencimiento" date,
    "monto_neto" bigint NOT NULL DEFAULT 0,
    "monto_igv" bigint NOT NULL DEFAULT 0,
    "monto_total" bigint NOT NULL DEFAULT 0,
    "moneda" varchar(5) DEFAULT 'PEN',
    "estado_reconciliacion" varchar(20) DEFAULT 'PENDIENTE',
    "orden_compra_id" uuid,
    "periodo" varchar(6) NOT NULL,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "tipo_adquisicion" varchar(30) DEFAULT 'MERCADERIA',
    "aplica_detraccion" bool DEFAULT false,
    "tasa_detraccion" numeric(5,2) DEFAULT 0.00,
    "monto_detraccion" numeric(12,4) DEFAULT 0.0000,
    "comisiones" numeric(10,2) DEFAULT 0,
    "archivo_xml" text,
    "archivo_pdf" text,
    "estado_descarga_archivos" varchar(20) DEFAULT 'PENDIENTE'
);

CREATE TABLE IF NOT EXISTS "movimiento_almacen" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "id_almacen_destino" uuid NOT NULL,
    "id_almacen_origen" uuid,
    "id_usuario" uuid NOT NULL,
    "id_usuario_aprobador" uuid,
    "id_proveedor" uuid,
    "id_tipo_transaccion" VARCHAR(10) NOT NULL,
    "id_compra" uuid,
    "id_nota_egreso" uuid,
    "id_guia_remision" uuid,
    "fecha_movimiento" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_movimiento" bigint,
    "observacion" TEXT,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'REGISTRADO',
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "movimiento_almacen_detalle" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "movimiento_almacen_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "lote_id" uuid,
    "cantidad" bigint NOT NULL DEFAULT 0,
    "precio_unitario" bigint NOT NULL DEFAULT 0,
    "subtotal" bigint NOT NULL DEFAULT 0,
    "igv" bigint NOT NULL DEFAULT 0,
    "total" bigint NOT NULL DEFAULT 0,
    "observacion" VARCHAR(255),
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "recetas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "nombre" varchar(150) NOT NULL,
    "cantidad_producida" bigint NOT NULL DEFAULT 1,
    "observacion" text,
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "recetas_detalles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "receta_id" uuid NOT NULL,
    "producto_insumo_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "cantidad" bigint NOT NULL DEFAULT 0,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "lotes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "id_usuario" uuid NOT NULL,
    "codigo_lote" varchar(100) NOT NULL,
    "fecha_fabricacion" date,
    "fecha_vencimiento" date,
    "costo_unitario" bigint NOT NULL DEFAULT 0,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ventas_sire" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "cliente_tipo_documento" varchar(5),
    "cliente_ruc" varchar(20),
    "cliente_nombre" varchar(250),
    "tipo_comprobante" varchar(2) NOT NULL,
    "serie" varchar(10) NOT NULL,
    "correlativo" varchar(20) NOT NULL,
    "fecha_emision" date NOT NULL,
    "fecha_vencimiento" date,
    "monto_neto" bigint NOT NULL DEFAULT 0,
    "monto_igv" bigint NOT NULL DEFAULT 0,
    "monto_total" bigint NOT NULL DEFAULT 0,
    "moneda" varchar(5) DEFAULT 'PEN',
    "estado_reconciliacion" varchar(20) DEFAULT 'PENDIENTE',
    "periodo" varchar(6) NOT NULL,
    "sincronizado" bool DEFAULT false,
    "venta_id" uuid,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "pre_ventas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "estado" varchar(20),
    "caja_id" uuid,
    "caja_turno_id" uuid,
    "usuario_id" uuid,
    "cliente_id" uuid,
    "correo_cliente" varchar(120),
    "alias" varchar(15),
    "tipo_comprobante_id" varchar(2),
    "tipo_pago_id" varchar(2) DEFAULT '1',
    "moneda" varchar(3),
    "tipo_cambio" bigint DEFAULT 1,
    "fecha_emision" timestamp DEFAULT now(),
    "fecha_vencimiento" timestamp DEFAULT now(),
    "gravadas" int8,
    "exoneradas" int8,
    "inafectas" int8,
    "igv" int8,
    "total_venta" int8,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "detalle_pre_ventas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "preventa_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid NOT NULL,
    "lote_id" uuid,
    "cantidad" int8 NOT NULL DEFAULT 0,
    "precio_unitario" int8 NOT NULL DEFAULT 0,
    "subtotal" int8 NOT NULL DEFAULT 0,
    "igv" int8 NOT NULL DEFAULT 0,
    "total" int8 NOT NULL DEFAULT 0,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ventas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "preventa_id" uuid UNIQUE,
    "caja_id" uuid,
    "caja_turno_id" uuid,
    "usuario_id" uuid,
    "cliente_id" uuid,
    "correo_cliente" varchar(120),
    "alias" varchar(15),
    "tipo_comprobante_id" varchar(2),
    "serie" varchar(10),
    "correlativo" int4,
    "fecha_emision" timestamp DEFAULT now(),
    "fecha_vencimiento" timestamp DEFAULT now(),
    "moneda" varchar(3),
    "tipo_cambio" bigint DEFAULT 1,
    "gravadas" int8,
    "exoneradas" int8,
    "inafectas" int8,
    "igv" int8,
    "total_venta" int8,
    "descuento" int8 DEFAULT 0,
    "gratuitas" int8 DEFAULT 0,
    "observacion_venta" text,
    "estado" varchar(20) DEFAULT 'EMITIDO',
    "tipo_pago_id" varchar(2) DEFAULT '1',
    "impuesto_id" varchar(10),
    "tipo_operacion_id" varchar(5) DEFAULT '1',
    "estado_pago" varchar(20) DEFAULT 'PAGADO',
    "facturado" bool DEFAULT false,
    "ventas_facturacion_id" uuid,
    "xml_url" varchar(500),
    "cdr_url" varchar(500),
    "pdf_url" varchar(500),
    "intentos_envio" int4 DEFAULT 0,
    "observacion_sunat" text,
    "payment_info" jsonb,
    "detraccion_info" jsonb,
    "baja_ticket" varchar(250),
    "baja_cdr_url" varchar(500),
    "baja_xml_url" varchar(500),
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "detalle_ventas" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "venta_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "lote_id" uuid,
    "cantidad" int8 NOT NULL DEFAULT 0,
    "precio_unitario" int8 NOT NULL DEFAULT 0,
    "subtotal" int8 NOT NULL DEFAULT 0,
    "igv" int8 NOT NULL DEFAULT 0,
    "total" int8 NOT NULL DEFAULT 0,
    "descuento" int8 DEFAULT 0,
    "tipo_afectacion_igv" smallint DEFAULT 10,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ventas_pagos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "venta_id" uuid NOT NULL,
    "usuario_id" uuid NOT NULL,
    "numero_cuota" int NOT NULL DEFAULT 1,
    "metodo_pago_id" varchar(5) NOT NULL,
    "banco_id" uuid,
    "monto" int8 NOT NULL DEFAULT 0,
    "fecha_programada" date,
    "fecha_pago" timestamp DEFAULT now(),
    "numero_operacion" varchar(100),
    "observacion" text,
    "estado" varchar(30) NOT NULL DEFAULT 'PAGADO',
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tipo_motivo_traslado" (
    "id" varchar(5) PRIMARY KEY NOT NULL,
    "codigo_sunat" varchar(5) NOT NULL,
    "descripcion" varchar(250) NOT NULL,
    "mueve_stock" boolean DEFAULT true,
    "activo" boolean DEFAULT true,
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "vehiculos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" uuid,
    "placa" varchar(50) NOT NULL UNIQUE,
    "descripcion" varchar(150),
    "es_propio" boolean DEFAULT true,
    "tipo_vehiculo" varchar(50) DEFAULT 'CAMION'::character varying,
    "sincronizado" boolean DEFAULT true,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "conductores" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS "transportistas" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid,
    "ruc" varchar(11) NOT NULL UNIQUE,
    "razon_social" varchar(250) NOT NULL,
    "nombre_comercial" varchar(200),
    "registro_mtc" varchar(50),
    "direccion" varchar(255),
    "telefono" varchar(50),
    "email" varchar(150),
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "guias_remision" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "venta_id" uuid,
    "cliente_id" uuid NOT NULL,
    "usuario_id" uuid NOT NULL,
    "almacen_origen_id" uuid NOT NULL,
    "caja_turno_id" uuid NOT NULL,
    "vehiculo_id" uuid,
    "conductor_id" uuid,
    "transportista_id" uuid,
    "tipo_comprobante_id" varchar(2) DEFAULT '09',
    "serie" varchar(10) NOT NULL,
    "correlativo" int4 NOT NULL,
    "fecha_emision" timestamp NOT NULL DEFAULT now(),
    "fecha_traslado" date NOT NULL,
    "peso" varchar(10),
    "num_bultos" int,
    "motivo_traslado_id" varchar(5),
    "descripcion_traslado" varchar(255),
    "modalidad_transporte" varchar(5) NOT NULL,
    "ubigeo_partida" varchar(6) NOT NULL,
    "direccion_partida" varchar(255) NOT NULL,
    "ubigeo_llegada" varchar(6) NOT NULL,
    "direccion_llegada" varchar(255) NOT NULL,
    "transportista_mtc" varchar(50),
    "estado" varchar(20) DEFAULT 'EMITIDO',
    "estado_sunat" varchar(30) DEFAULT 'REGISTRADO',
    "xml_url" varchar(500),
    "cdr_url" varchar(500),
    "pdf_url" varchar(500),
    "observacion" text,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "detalle_guias_remision" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "guia_remision_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "lote_id" uuid,
    "cantidad" int8 NOT NULL DEFAULT 0,
    "peso_total" int8 DEFAULT 0,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notas_credito" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "venta_id" uuid NOT NULL,
    "caja_id" uuid,
    "caja_turno_id" uuid,
    "usuario_id" uuid NOT NULL,
    "cliente_id" uuid NOT NULL,
    "tipo_comprobante_id" varchar(2) DEFAULT '07',
    "serie" varchar(10) NOT NULL,
    "correlativo" int4 NOT NULL,
    "fecha_emision" timestamp NOT NULL DEFAULT now(),
    "tipo_nota_credito_id" varchar(2) NOT NULL,
    "sustento" text NOT NULL,
    "moneda" varchar(3) DEFAULT 'PEN',
    "tipo_cambio" bigint DEFAULT 1,
    "gravadas" int8 NOT NULL DEFAULT 0,
    "exoneradas" int8 NOT NULL DEFAULT 0,
    "inafectas" int8 NOT NULL DEFAULT 0,
    "igv" int8 NOT NULL DEFAULT 0,
    "total" int8 NOT NULL DEFAULT 0,
    "descuento" int8 DEFAULT 0,
    "estado" varchar(20) DEFAULT 'EMITIDO',
    "estado_sunat" varchar(30) DEFAULT 'REGISTRADO',
    "xml_url" varchar(500),
    "cdr_url" varchar(500),
    "pdf_url" varchar(500),
    "intentos_envio" int4 DEFAULT 0,
    "observacion_sunat" text,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "detalle_notas_credito" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "nota_credito_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "lote_id" uuid,
    "cantidad" int8 NOT NULL DEFAULT 0,
    "precio_unitario" int8 NOT NULL DEFAULT 0,
    "subtotal" int8 NOT NULL DEFAULT 0,
    "igv" int8 NOT NULL DEFAULT 0,
    "total" int8 NOT NULL DEFAULT 0,
    "descuento" int8 DEFAULT 0,
    "tipo_afectacion_igv" smallint DEFAULT 10,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "cotizaciones" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "usuario_id" uuid NOT NULL,
    "cliente_id" uuid NOT NULL,
    "almacen_id" uuid,
    "serie" varchar(10) DEFAULT 'COT1',
    "correlativo" int4 NOT NULL,
    "fecha_emision" timestamp NOT NULL DEFAULT now(),
    "fecha_vencimiento" date NOT NULL,
    "moneda" varchar(3) DEFAULT 'PEN',
    "tipo_cambio" bigint DEFAULT 1,
    "gravadas" int8 NOT NULL DEFAULT 0,
    "exoneradas" int8 NOT NULL DEFAULT 0,
    "inafectas" int8 NOT NULL DEFAULT 0,
    "igv" int8 NOT NULL DEFAULT 0,
    "total" int8 NOT NULL DEFAULT 0,
    "descuento" int8 DEFAULT 0,
    "estado" varchar(30) DEFAULT 'PENDIENTE',
    "observacion" text,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "detalle_cotizaciones" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "cotizacion_id" uuid NOT NULL,
    "producto_id" uuid NOT NULL,
    "presentacion_id" uuid,
    "cantidad" int8 NOT NULL DEFAULT 0,
    "precio_unitario" int8 NOT NULL DEFAULT 0,
    "subtotal" int8 NOT NULL DEFAULT 0,
    "igv" int8 NOT NULL DEFAULT 0,
    "total" int8 NOT NULL DEFAULT 0,
    "descuento" int8 DEFAULT 0,
    "sincronizado" bool DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "caja_chica" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "nombre" varchar(150) NOT NULL,
    "usuario_id" uuid NOT NULL,
    "monto_fondo_fijo" int8 NOT NULL DEFAULT 0,
    "monto_actual" int8 NOT NULL DEFAULT 0,
    "activo" boolean DEFAULT true,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "caja_chica_sesiones" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "caja_chica_id" uuid NOT NULL,
    "usuario_id" uuid NOT NULL,
    "fecha_apertura" timestamp NOT NULL DEFAULT now(),
    "fecha_cierre" timestamp,
    "monto_inicial" int8 NOT NULL DEFAULT 0,
    "monto_gastado" int8 NOT NULL DEFAULT 0,
    "monto_reembolsado" int8 NOT NULL DEFAULT 0,
    "estado" varchar(20) NOT NULL DEFAULT 'ABIERTA',
    "observacion" text,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "caja_chica_totales" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "caja_chica_sesion_id" uuid NOT NULL,
    "metodo_pago_id" varchar(5) NOT NULL,
    "monto_sistema" int8 NOT NULL DEFAULT 0,
    "monto_declarado" int8 NOT NULL DEFAULT 0,
    "diferencia" int8 NOT NULL DEFAULT 0,
    "observacion" text,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "caja_chica_movimientos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "caja_chica_sesion_id" uuid NOT NULL,
    "usuario_id" uuid NOT NULL,
    "tipo_movimiento" varchar(20) NOT NULL,
    "comprobante_id" uuid,
    "tipo_comprobante_id" varchar(2),
    "serie" varchar(10),
    "correlativo" varchar(20),
    "metodo_pago_id" varchar(5) NOT NULL DEFAULT '01',
    "banco_id" uuid,
    "numero_operacion" varchar(100),
    "proveedor_id" uuid,
    "proveedor_nombre" varchar(200),
    "subtotal" int8 NOT NULL DEFAULT 0,
    "igv" int8 NOT NULL DEFAULT 0,
    "total" int8 NOT NULL DEFAULT 0,
    "concepto" varchar(200) NOT NULL,
    "foto_comprobante" text,
    "archivo_pdf" text,
    "observacion" text,
    "estado" varchar(30) NOT NULL DEFAULT 'APROBADO',
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "caja_chica_arqueos" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "caja_chica_sesion_id" uuid NOT NULL,
    "denominacion" int8 NOT NULL,
    "cantidad" int NOT NULL DEFAULT 0,
    "subtotal" int8 NOT NULL DEFAULT 0,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "conf_envio_whatsapp" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "instancia" varchar(100) DEFAULT 'admin',
    "url" varchar(255) NOT NULL,
    "apikey" varchar(255) NOT NULL,
    "activo" boolean NOT NULL DEFAULT true,
    "fecharegistro" timestamp DEFAULT CURRENT_TIMESTAMP,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "combo_detalles" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "presentacion_combo_id" uuid NOT NULL,
    "presentacion_componente_id" uuid NOT NULL,
    "cantidad" bigint NOT NULL DEFAULT 1,
    "activo" boolean NOT NULL DEFAULT true,
    "sincronizado" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "combo_detalle_pre_ventas" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "detalle_pre_venta_id" uuid NOT NULL,
    "producto_componente_id" uuid NOT NULL,
    "presentacion_componente_id" uuid,
    "producto_nombre_snapshot" varchar(150) NOT NULL,
    "presentacion_nombre_snapshot" varchar(150) NOT NULL,
    "cantidad_base_prevista" bigint NOT NULL,
    "multiplica_por_snapshot" bigint NOT NULL,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "combo_detalle_ventas" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" uuid NOT NULL,
    "detalle_venta_id" uuid NOT NULL,
    "producto_componente_id" uuid NOT NULL,
    "presentacion_componente_id" uuid,
    "producto_nombre_snapshot" varchar(150) NOT NULL,
    "presentacion_nombre_snapshot" varchar(150) NOT NULL,
    "lote_id" uuid,
    "stock_movimiento_id" uuid NOT NULL UNIQUE,
    "cantidad_base" bigint NOT NULL,
    "multiplica_por_snapshot" bigint NOT NULL,
    "costo_unitario_base_snapshot" numeric(20,6) NOT NULL,
    "costo_total_snapshot" bigint NOT NULL,
    "precio_proporcional_historico" bigint NOT NULL DEFAULT 0,
    "sincronizado" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);
