import { relations } from "drizzle-orm/relations";
import { tipo_comprobante, caja_serie_correlativo } from "./schema";

export const caja_serie_correlativoRelations = relations(caja_serie_correlativo, ({one}) => ({
	tipo_comprobante: one(tipo_comprobante, {
		fields: [caja_serie_correlativo.tipo_comprobante_id],
		references: [tipo_comprobante.id]
	}),
}));

export const tipo_comprobanteRelations = relations(tipo_comprobante, ({many}) => ({
	caja_serie_correlativos: many(caja_serie_correlativo),
}));