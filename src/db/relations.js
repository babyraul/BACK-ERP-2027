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
var relations_exports = {};
__export(relations_exports, {
  caja_serie_correlativoRelations: () => caja_serie_correlativoRelations,
  tipo_comprobanteRelations: () => tipo_comprobanteRelations
});
module.exports = __toCommonJS(relations_exports);
var import_relations = require("drizzle-orm/relations");
var import_schema = require("./schema");
const caja_serie_correlativoRelations = (0, import_relations.relations)(import_schema.caja_serie_correlativo, ({ one }) => ({
  tipo_comprobante: one(import_schema.tipo_comprobante, {
    fields: [import_schema.caja_serie_correlativo.tipo_comprobante_id],
    references: [import_schema.tipo_comprobante.id]
  })
}));
const tipo_comprobanteRelations = (0, import_relations.relations)(import_schema.tipo_comprobante, ({ many }) => ({
  caja_serie_correlativos: many(import_schema.caja_serie_correlativo)
}));
