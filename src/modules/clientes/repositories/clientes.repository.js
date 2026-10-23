'use strict'

const { db } = require('../../../db')
const schema = require('../../../db/schema')
const { eq, and, or, ilike, desc, sql } = require('drizzle-orm')

/**
 * Repositorio de Clientes (Persistencia Drizzle ORM)
 */
const clientesRepository = {
  // Obtener listado de clientes con filtros, búsqueda y RLS
  async getClientes({ q, tipoDocumentoId, estadoCredito, soloActivos = true, empresaId, esSuperAdmin = false }) {
    const conditions = []

    // RLS por empresa si el usuario no es superadmin
    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.clientes.empresa_id, empresaId), sql`${schema.clientes.empresa_id} IS NULL`))
    }

    // Inactivación visual: por defecto excluir los marcados como INACTIVO salvo que se indique expresamente
    if (soloActivos && (!estadoCredito || estadoCredito.trim() === '')) {
      conditions.push(sql`${schema.clientes.estado_credito} != 'INACTIVO'`)
    }

    if (tipoDocumentoId && tipoDocumentoId.trim() !== '') {
      conditions.push(eq(schema.clientes.tipo_documento_id, tipoDocumentoId.trim()))
    }

    if (estadoCredito && estadoCredito.trim() !== '') {
      conditions.push(eq(schema.clientes.estado_credito, estadoCredito.trim()))
    }

    if (q && q.trim() !== '') {
      const search = `%${q.trim()}%`
      conditions.push(
        or(
          ilike(schema.clientes.numero_documento, search),
          ilike(schema.clientes.nombre_razon_social, search),
          ilike(schema.clientes.email_1, search),
          ilike(schema.clientes.telefono_1, search),
          ilike(schema.clientes.direccion_1, search)
        )
      )
    }

    let query = db
      .select({
        id: schema.clientes.id,
        tipo_documento_id: schema.clientes.tipo_documento_id,
        tipo_documento_abreviatura: schema.tipo_documento.abreviatura,
        tipo_documento_descripcion: schema.tipo_documento.descripcion,
        numero_documento: schema.clientes.numero_documento,
        nombre_razon_social: schema.clientes.nombre_razon_social,
        direccion_1: schema.clientes.direccion_1,
        direccion_2: schema.clientes.direccion_2,
        direccion_3: schema.clientes.direccion_3,
        email_1: schema.clientes.email_1,
        email_2: schema.clientes.email_2,
        email_3: schema.clientes.email_3,
        telefono_1: schema.clientes.telefono_1,
        telefono_2: schema.clientes.telefono_2,
        telefono_3: schema.clientes.telefono_3,
        empresa_id: schema.clientes.empresa_id,
        limite_credito_int: schema.clientes.limite_credito_int,
        saldo_utilizado_int: schema.clientes.saldo_utilizado_int,
        dias_credito_pactado: schema.clientes.dias_credito_pactado,
        cantidad_cuotas: schema.clientes.cantidad_cuotas,
        estado_credito: schema.clientes.estado_credito,
        sincronizado: schema.clientes.sincronizado,
        created_at: schema.clientes.created_at,
        updated_at: schema.clientes.updated_at
      })
      .from(schema.clientes)
      .leftJoin(schema.tipo_documento, eq(schema.clientes.tipo_documento_id, schema.tipo_documento.id))
      .orderBy(desc(schema.clientes.created_at))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    return query
  },

  // Obtener cliente por ID con validación RLS
  async getClienteById(id, { empresaId, esSuperAdmin = false }) {
    const conditions = [eq(schema.clientes.id, id)]
    if (!esSuperAdmin && empresaId) {
      conditions.push(or(eq(schema.clientes.empresa_id, empresaId), sql`${schema.clientes.empresa_id} IS NULL`))
    }

    const [cliente] = await db
      .select({
        id: schema.clientes.id,
        tipo_documento_id: schema.clientes.tipo_documento_id,
        tipo_documento_abreviatura: schema.tipo_documento.abreviatura,
        tipo_documento_descripcion: schema.tipo_documento.descripcion,
        numero_documento: schema.clientes.numero_documento,
        nombre_razon_social: schema.clientes.nombre_razon_social,
        direccion_1: schema.clientes.direccion_1,
        direccion_2: schema.clientes.direccion_2,
        direccion_3: schema.clientes.direccion_3,
        email_1: schema.clientes.email_1,
        email_2: schema.clientes.email_2,
        email_3: schema.clientes.email_3,
        telefono_1: schema.clientes.telefono_1,
        telefono_2: schema.clientes.telefono_2,
        telefono_3: schema.clientes.telefono_3,
        empresa_id: schema.clientes.empresa_id,
        limite_credito_int: schema.clientes.limite_credito_int,
        saldo_utilizado_int: schema.clientes.saldo_utilizado_int,
        dias_credito_pactado: schema.clientes.dias_credito_pactado,
        cantidad_cuotas: schema.clientes.cantidad_cuotas,
        estado_credito: schema.clientes.estado_credito,
        sincronizado: schema.clientes.sincronizado,
        created_at: schema.clientes.created_at,
        updated_at: schema.clientes.updated_at
      })
      .from(schema.clientes)
      .leftJoin(schema.tipo_documento, eq(schema.clientes.tipo_documento_id, schema.tipo_documento.id))
      .where(and(...conditions))
      .limit(1)

    return cliente || null
  },

  // Buscar cliente por tipo y número de documento (para unicidad)
  async findByDocumento(tipoDoc, numDoc, excludeId = null) {
    const conditions = [
      eq(schema.clientes.tipo_documento_id, tipoDoc),
      eq(schema.clientes.numero_documento, numDoc)
    ]
    if (excludeId) {
      conditions.push(sql`${schema.clientes.id} != ${excludeId}`)
    }

    const [cliente] = await db
      .select({ id: schema.clientes.id, estado_credito: schema.clientes.estado_credito })
      .from(schema.clientes)
      .where(and(...conditions))
      .limit(1)

    return cliente || null
  },

  // Insertar nuevo cliente
  async insertCliente(payload) {
    const [nuevo] = await db.insert(schema.clientes).values(payload).returning()
    return nuevo
  },

  // Actualizar cliente
  async updateCliente(id, payload) {
    const [updated] = await db
      .update(schema.clientes)
      .set({
        ...payload,
        updated_at: sql`NOW()`
      })
      .where(eq(schema.clientes.id, id))
      .returning()

    return updated || null
  },

  // Inactivación visual (Soft Delete) - Regla de negocio del ERP: NO DELETE físico
  async inactivateCliente(id) {
    const [inactivado] = await db
      .update(schema.clientes)
      .set({
        estado_credito: 'INACTIVO',
        updated_at: sql`NOW()`
      })
      .where(eq(schema.clientes.id, id))
      .returning()

    return inactivado || null
  }
}

module.exports = clientesRepository
