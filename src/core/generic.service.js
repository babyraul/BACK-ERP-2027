'use strict'

const { db } = require('../db')
const { eq, and } = require('drizzle-orm')

class GenericService {
  constructor(table) {
    this.table = table
  }

  async getAll(query = {}) {
    let q = db.select().from(this.table)
    
    // Filtro dinámico basado en querystrings que hagan match con columnas de la tabla
    const conditions = []
    for (const [key, value] of Object.entries(query)) {
      if (this.table[key] && value !== undefined) {
        conditions.push(eq(this.table[key], value))
      }
    }
    
    if (conditions.length > 0) {
      q = q.where(and(...conditions))
    }

    return q
  }

  async getById(id) {
    const [record] = await db.select().from(this.table).where(eq(this.table.id, id))
    return record
  }

  async create(data) {
    const [record] = await db.insert(this.table).values(data).returning()
    return record
  }

  async update(id, data) {
    const [record] = await db.update(this.table)
      .set({ ...data, updated_at: new Date().toISOString() })
      .where(eq(this.table.id, id))
      .returning()
    return record
  }

  async remove(id) {
    // Si la tabla tiene columna "activo", hacemos soft delete (baja lógica).
    // De lo contrario hacemos hard delete.
    if (this.table.activo) {
       const [record] = await db.update(this.table)
         .set({ activo: false, updated_at: new Date().toISOString() })
         .where(eq(this.table.id, id))
         .returning()
       return record
    } else {
       const [record] = await db.delete(this.table)
         .where(eq(this.table.id, id))
         .returning()
       return record
    }
  }
}

module.exports = GenericService
