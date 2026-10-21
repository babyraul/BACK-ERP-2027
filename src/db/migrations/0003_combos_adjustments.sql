ALTER TABLE "combo_detalles" ADD COLUMN IF NOT EXISTS "tipo_ajuste" varchar(20) DEFAULT 'MARGEN' NOT NULL;
ALTER TABLE "combo_detalles" ADD COLUMN IF NOT EXISTS "valor_ajuste" numeric(12, 4) DEFAULT '0.0000' NOT NULL;
ALTER TABLE "combo_detalles" ADD COLUMN IF NOT EXISTS "precio_final" bigint DEFAULT 0 NOT NULL;
