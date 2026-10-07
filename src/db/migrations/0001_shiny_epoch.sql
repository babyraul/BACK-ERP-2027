ALTER TABLE "caja_serie_correlativo" DROP CONSTRAINT "cajas_tipo_comprobante_id_fkey";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ubigeo_departamento";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ubigeo_distrito";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ubigeo_full";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ubigeo_provincia";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_afectacion_igv_activo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_afectacion_igv_activo_tributo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_afectacion_igv_descripcion";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_afectacion_igv_tributo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_unidades_medida_codigo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_unidades_medida_descripcion";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_unidades_medida_estado_codigo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_branch";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_email1";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_email2";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_email3";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_estado_credito";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_limite_saldo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_tel1";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_tel2";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_tel3";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_tipo_dni_num";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_notificaciones_branch";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_notificaciones_leido";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_notificaciones_usuario";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_cambio_compra";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_cambio_fecha_compra";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_cambio_venta";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_serie_correlativo_activas";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_serie_correlativo_activo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_serie_correlativo_branch";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_serie_correlativo_identificador";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_serie_correlativo_tipo_caja";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_serie_correlativo_tipo_comprobante";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_serie_correlativo_tipo_serie_corr";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_serie_correlativo_usuario";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_tributos_ci";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_tributos_codigo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_tributos_codigo_nombre";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_tributos_id_codigo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tipo_tributos_nombre";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_codigos_detraccion_activo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_codigos_detraccion_desc";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_codigos_detraccion_porcentaje";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_codigos_detraccion_sunat";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_codigos_detraccion_sunat_activo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_empresas_ruc";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_sucursales_empresa_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_sucursales_ruc";--> statement-breakpoint
ALTER TABLE "tipo_unidades_medida" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "estado_credito" SET DEFAULT 'NORMAL';--> statement-breakpoint
ALTER TABLE "tipo_documento" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tokens_autorizacion" ALTER COLUMN "estado" SET DEFAULT 'SOLICITADO';--> statement-breakpoint
ALTER TABLE "tokens_autorizacion" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tokens_autorizacion" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notificaciones" ALTER COLUMN "tipo" SET DEFAULT 'info';--> statement-breakpoint
ALTER TABLE "notificaciones" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_metodo_pago" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_cambio" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "caja_serie_correlativo" ALTER COLUMN "tipo_caja" SET DEFAULT 'ADMINISTRATIVA';--> statement-breakpoint
ALTER TABLE "caja_serie_correlativo" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "caja_serie_correlativo" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_comprobante" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_bancos" ALTER COLUMN "tipo_moneda" SET DEFAULT 'PEN';--> statement-breakpoint
ALTER TABLE "tipo_bancos" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_bancos" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_moneda" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_pago" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_codigos_detraccion" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_codigos_detraccion" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tipo_factores" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "empresas" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "empresas" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sucursales" ALTER COLUMN "sire_ultimo_sync" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sucursales" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sucursales" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "almacenes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "almacenes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "productos" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "productos" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "presentaciones" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "presentaciones" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stock" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stock" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stock_actual" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "proveedores" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "proveedores" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "productos_proveedores" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "productos_proveedores" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "categorias" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "categorias" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "subcategoria" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "subcategoria" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "caja_turnos" ALTER COLUMN "fecha_apertura" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "caja_turnos" ALTER COLUMN "estado" SET DEFAULT 'ABIERTA';--> statement-breakpoint
ALTER TABLE "caja_turnos" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "caja_turnos" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bancos" ALTER COLUMN "tipo_moneda" SET DEFAULT 'PEN';--> statement-breakpoint
ALTER TABLE "bancos" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bancos" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_requerimiento" ALTER COLUMN "fecha_emision" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_requerimiento" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_requerimiento" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_requerimiento_detalle" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_requerimiento_detalle" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_cotizacion" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_cotizacion" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_cotizacion_detalle" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_cotizacion_detalle" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_orden" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_orden" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_orden_detalle" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_orden_detalle" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra" ALTER COLUMN "tipo_pago" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "compra" ALTER COLUMN "estado" SET DEFAULT 'ACEPTADO';--> statement-breakpoint
ALTER TABLE "compra" ALTER COLUMN "estado_pago" SET DEFAULT 'PENDIENTE';--> statement-breakpoint
ALTER TABLE "compra" ALTER COLUMN "estado_sunat" SET DEFAULT 'REGISTRADO';--> statement-breakpoint
ALTER TABLE "compra" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_detalle" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_detalle" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compras_pagos" ALTER COLUMN "estado" SET DEFAULT 'PAGADO';--> statement-breakpoint
ALTER TABLE "compras_pagos" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compras_pagos" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "moneda" SET DEFAULT 'PEN';--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "estado_reconciliacion" SET DEFAULT 'PENDIENTE';--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "tipo_adquisicion" SET DEFAULT 'MERCADERIA';--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "tasa_detraccion" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "monto_detraccion" SET DEFAULT '0.0000';--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "comisiones" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "compras_sire" ALTER COLUMN "estado_descarga_archivos" SET DEFAULT 'PENDIENTE';--> statement-breakpoint
ALTER TABLE "movimiento_almacen" ALTER COLUMN "fecha_movimiento" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "movimiento_almacen" ALTER COLUMN "estado" SET DEFAULT 'REGISTRADO';--> statement-breakpoint
ALTER TABLE "movimiento_almacen" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "movimiento_almacen" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "movimiento_almacen_detalle" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "movimiento_almacen_detalle" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recetas" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recetas" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recetas_detalles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recetas_detalles" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ventas_sire" ALTER COLUMN "moneda" SET DEFAULT 'PEN';--> statement-breakpoint
ALTER TABLE "ventas_sire" ALTER COLUMN "estado_reconciliacion" SET DEFAULT 'PENDIENTE';--> statement-breakpoint
ALTER TABLE "ventas_sire" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ventas_sire" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pre_ventas" ALTER COLUMN "tipo_pago_id" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "ventas" ALTER COLUMN "estado" SET DEFAULT 'EMITIDO';--> statement-breakpoint
ALTER TABLE "ventas" ALTER COLUMN "tipo_pago_id" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "ventas" ALTER COLUMN "tipo_operacion_id" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "ventas" ALTER COLUMN "estado_pago" SET DEFAULT 'PAGADO';--> statement-breakpoint
ALTER TABLE "ventas_pagos" ALTER COLUMN "estado" SET DEFAULT 'PAGADO';--> statement-breakpoint
ALTER TABLE "vehiculos" ALTER COLUMN "tipo_vehiculo" SET DEFAULT 'CAMION';--> statement-breakpoint
ALTER TABLE "vehiculos" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "vehiculos" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conductores" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conductores" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transportistas" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transportistas" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "guias_remision" ALTER COLUMN "tipo_comprobante_id" SET DEFAULT '09';--> statement-breakpoint
ALTER TABLE "guias_remision" ALTER COLUMN "estado" SET DEFAULT 'EMITIDO';--> statement-breakpoint
ALTER TABLE "guias_remision" ALTER COLUMN "estado_sunat" SET DEFAULT 'REGISTRADO';--> statement-breakpoint
ALTER TABLE "notas_credito" ALTER COLUMN "tipo_comprobante_id" SET DEFAULT '07';--> statement-breakpoint
ALTER TABLE "notas_credito" ALTER COLUMN "moneda" SET DEFAULT 'PEN';--> statement-breakpoint
ALTER TABLE "notas_credito" ALTER COLUMN "estado" SET DEFAULT 'EMITIDO';--> statement-breakpoint
ALTER TABLE "notas_credito" ALTER COLUMN "estado_sunat" SET DEFAULT 'REGISTRADO';--> statement-breakpoint
ALTER TABLE "cotizaciones" ALTER COLUMN "serie" SET DEFAULT 'COT1';--> statement-breakpoint
ALTER TABLE "cotizaciones" ALTER COLUMN "moneda" SET DEFAULT 'PEN';--> statement-breakpoint
ALTER TABLE "cotizaciones" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';--> statement-breakpoint
ALTER TABLE "caja_chica_sesiones" ALTER COLUMN "estado" SET DEFAULT 'ABIERTA';--> statement-breakpoint
ALTER TABLE "caja_chica_movimientos" ALTER COLUMN "metodo_pago_id" SET DEFAULT '01';--> statement-breakpoint
ALTER TABLE "caja_chica_movimientos" ALTER COLUMN "estado" SET DEFAULT 'APROBADO';--> statement-breakpoint
ALTER TABLE "combo_detalles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "combo_detalles" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_flujo" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "compra_flujo" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conf_envio_whatsapp" ALTER COLUMN "instancia" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "conf_envio_whatsapp" ALTER COLUMN "fecharegistro" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "modulos" ADD COLUMN "padre_id" uuid;--> statement-breakpoint
ALTER TABLE "modulos" ADD COLUMN "ruta" varchar(255);--> statement-breakpoint
ALTER TABLE "modulos" ADD COLUMN "tipo" varchar(50) DEFAULT 'MODULO' NOT NULL;--> statement-breakpoint
ALTER TABLE "modulos" ADD COLUMN "orden" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caja_serie_correlativo" ADD CONSTRAINT "caja_serie_correlativo_tipo_comprobante_id_tipo_comprobante_id_fk" FOREIGN KEY ("tipo_comprobante_id") REFERENCES "public"."tipo_comprobante"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ubigeo_departamento" ON "ubigeo" USING btree ("departamento");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ubigeo_distrito" ON "ubigeo" USING btree ("distrito");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ubigeo_full" ON "ubigeo" USING btree ("departamento","provincia","distrito");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ubigeo_provincia" ON "ubigeo" USING btree ("provincia");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_afectacion_igv_activo" ON "tipo_afectacion_igv" USING btree ("activo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_afectacion_igv_activo_tributo" ON "tipo_afectacion_igv" USING btree ("codigo_tributo","activo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_afectacion_igv_descripcion" ON "tipo_afectacion_igv" USING btree ("descripcion");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_afectacion_igv_tributo" ON "tipo_afectacion_igv" USING btree ("codigo_tributo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_unidades_medida_codigo" ON "tipo_unidades_medida" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_unidades_medida_descripcion" ON "tipo_unidades_medida" USING btree ("descripcion");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_unidades_medida_estado_codigo" ON "tipo_unidades_medida" USING btree ("estado","codigo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_branch" ON "clientes" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_email1" ON "clientes" USING btree ("email_1");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_email2" ON "clientes" USING btree ("email_2");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_email3" ON "clientes" USING btree ("email_3");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_estado_credito" ON "clientes" USING btree ("estado_credito");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_limite_saldo" ON "clientes" USING btree ("limite_credito_int","saldo_utilizado_int");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tel1" ON "clientes" USING btree ("telefono_1");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tel2" ON "clientes" USING btree ("telefono_2");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tel3" ON "clientes" USING btree ("telefono_3");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_clientes_tipo_dni_num" ON "clientes" USING btree ("tipo_documento_id","numero_documento");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_branch" ON "notificaciones" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_leido" ON "notificaciones" USING btree ("leido");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_usuario" ON "notificaciones" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_cambio_compra" ON "tipo_cambio" USING btree ("compra");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_cambio_fecha_compra" ON "tipo_cambio" USING btree ("fecha","compra");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_cambio_venta" ON "tipo_cambio" USING btree ("venta");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_activas" ON "caja_serie_correlativo" USING btree ("branch_id","tipo_caja") WHERE (activo = true);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_activo" ON "caja_serie_correlativo" USING btree ("activo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_branch" ON "caja_serie_correlativo" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_identificador" ON "caja_serie_correlativo" USING btree ("identificador_caja");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_tipo_caja" ON "caja_serie_correlativo" USING btree ("tipo_caja");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_tipo_comprobante" ON "caja_serie_correlativo" USING btree ("tipo_comprobante_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_tipo_serie_corr" ON "caja_serie_correlativo" USING btree ("tipo_comprobante_id","serie","correlativo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_serie_correlativo_usuario" ON "caja_serie_correlativo" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_ci" ON "tipo_tributos" USING btree ("codigo_internacional");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_codigo" ON "tipo_tributos" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_codigo_nombre" ON "tipo_tributos" USING btree ("codigo","nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_id_codigo" ON "tipo_tributos" USING btree ("id","codigo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tipo_tributos_nombre" ON "tipo_tributos" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_activo" ON "tipo_codigos_detraccion" USING btree ("activo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_desc" ON "tipo_codigos_detraccion" USING btree ("descripcion");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_porcentaje" ON "tipo_codigos_detraccion" USING btree ("porcentaje");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_sunat" ON "tipo_codigos_detraccion" USING btree ("codigo_sunat");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_codigos_detraccion_sunat_activo" ON "tipo_codigos_detraccion" USING btree ("codigo_sunat","activo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_empresas_ruc" ON "empresas" USING btree ("ruc");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sucursales_empresa_id" ON "sucursales" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sucursales_ruc" ON "sucursales" USING btree ("ruc");