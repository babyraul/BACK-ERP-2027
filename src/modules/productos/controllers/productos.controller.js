'use strict'

const productosService = require('../services/productos.service')

/**
 * Controlador HTTP para el Módulo de Productos
 */
const productosController = {
  // GET /api/productos
  async listar(request, reply) {
    try {
      const { q, categoria_id, activo, limit, offset } = request.query
      const empresaId = request.user?.empresa_id || request.user?.branch_id
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      // Límite defensivo de seguridad: default 200, máx 1000 productos
      const safeLimit = limit !== undefined ? Math.min(Math.max(1, Number(limit) || 200), 1000) : 200
      const safeOffset = offset !== undefined ? Math.max(0, Number(offset) || 0) : 0

      const data = await productosService.listarProductos({
        q,
        categoriaId: categoria_id,
        activo,
        empresaId,
        branchId,
        esSuperAdmin,
        limit: safeLimit,
        offset: safeOffset
      })

      return reply.code(200).send({
        data,
        total: data.length,
        limit: safeLimit,
        offset: safeOffset
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: 'Error al listar productos: ' + error.message
      })
    }
  },

  // GET /api/productos/:id
  async obtenerPorId(request, reply) {
    try {
      const { id } = request.params
      const branchId = request.user?.branch_id

      const data = await productosService.obtenerPorId(id, { branchId })
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: error.message
      })
    }
  },

  // GET /api/productos/:id/kardex
  async consultarKardex(request, reply) {
    try {
      const { id } = request.params
      const branchId = request.user?.branch_id

      const data = await productosService.consultarKardex(id, { branchId })
      return reply.code(200).send({ data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        success: false,
        message: 'Error al consultar kárdex del producto: ' + error.message
      })
    }
  },

  // POST /api/productos
  async crear(request, reply) {
    try {
      const payload = request.body || {}
      const empresaId =
        payload.empresa_id || request.user?.empresa_id || payload.branch_id || request.user?.branch_id

      const data = await productosService.crearProducto(payload, { empresaId })
      return reply.code(201).send({ message: 'Producto creado exitosamente', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        message: 'Error al crear el producto',
        error: error.message
      })
    }
  },

  // PUT /api/productos/:id
  async actualizar(request, reply) {
    try {
      const { id } = request.params
      const payload = request.body || {}
      const empresaId = request.user?.empresa_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await productosService.actualizarProducto(id, payload, { empresaId, esSuperAdmin })
      return reply.code(200).send({ message: 'Producto actualizado exitosamente', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        message: 'Error al actualizar el producto',
        error: error.message
      })
    }
  },

  // DELETE /api/productos/:id (Inactivación visual / Soft delete)
  async eliminar(request, reply) {
    try {
      const { id } = request.params
      const producto = await productosService.eliminarProducto(id)
      return reply.code(200).send({ message: 'Producto dado de baja exitosamente', data: producto })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({
        message: 'Error al eliminar el producto',
        error: error.message
      })
    }
  }
}

module.exports = productosController
