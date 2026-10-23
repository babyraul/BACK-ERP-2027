'use strict'

const cajasService = require('../services/cajas.service')

/**
 * Controlador HTTP para el Módulo de Cajas y Turnos
 */
const cajasController = {
  // GET /api/cajas
  async listar(request, reply) {
    try {
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await cajasService.listarSeriesCaja({ branchId, esSuperAdmin })
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/cajas/configuradas
  async listarConfiguradas(request, reply) {
    try {
      const branchId = request.user?.branch_id
      const userId = request.user?.id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await cajasService.listarCajasConfiguradas({ branchId, userId, esSuperAdmin })
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // POST /api/cajas
  async crear(request, reply) {
    try {
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await cajasService.crearSerieCaja(request.body, { branchId, esSuperAdmin })
      return reply.code(201).send({ success: true, message: 'Serie de caja registrada', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // PUT /api/cajas/:id
  async actualizar(request, reply) {
    try {
      const data = await cajasService.actualizarSerieCaja(request.params.id, request.body)
      return reply.code(200).send({ success: true, message: 'Serie de caja actualizada', data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // DELETE /api/cajas/:id (Soft delete / Inactivación)
  async eliminar(request, reply) {
    try {
      await cajasService.eliminarSerieCaja(request.params.id)
      return reply.code(200).send({ success: true, message: 'Serie de caja inactivada' })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/cajas/turnos
  async listarTurnos(request, reply) {
    try {
      const { estado, fecha, usuario_id, identificador_caja, limit, offset } = request.query
      const branchId = request.user?.branch_id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      // Límite defensivo de seguridad: default 200, máx 1000 turnos
      const safeLimit = limit !== undefined ? Math.min(Math.max(1, Number(limit) || 200), 1000) : 200
      const safeOffset = offset !== undefined ? Math.max(0, Number(offset) || 0) : 0

      const data = await cajasService.listarTurnos({
        estado,
        fecha,
        usuarioId: usuario_id,
        identificadorCaja: identificador_caja,
        branchId,
        esSuperAdmin,
        limit: safeLimit,
        offset: safeOffset
      })
      return reply.code(200).send({
        success: true,
        data,
        total: data.length,
        limit: safeLimit,
        offset: safeOffset
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/cajas/turnos/activo
  async obtenerTurnoActivo(request, reply) {
    try {
      const branchId = request.user?.branch_id
      const userId = request.user?.id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const data = await cajasService.obtenerTurnoActivo({ branchId, userId, esSuperAdmin })
      if (!data) {
        return reply.code(200).send({ success: true, data: null, message: 'No hay turno abierto' })
      }
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/cajas/turnos/:id
  async obtenerTurnoDetalle(request, reply) {
    try {
      const data = await cajasService.obtenerTurnoDetalle(request.params.id)
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // POST /api/cajas/turnos/apertura
  async aperturarTurno(request, reply) {
    try {
      const { identificador_caja, monto_apertura, observacion } = request.body || {}
      const branchId = request.user?.branch_id
      const userId = request.user?.id
      const esSuperAdmin = Boolean(request.user?.es_super_admin)

      const result = await cajasService.aperturarTurno({
        identificadorCaja: identificador_caja,
        montoApertura: monto_apertura,
        observacion,
        branchId,
        userId,
        esSuperAdmin
      })

      return reply.code(201).send({
        success: true,
        message: `Caja "${identificador_caja}" aperturada exitosamente`,
        data: result
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/cajas/turnos/:id/movimientos
  async listarMovimientos(request, reply) {
    try {
      const data = await cajasService.listarMovimientos(request.params.id)
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // POST /api/cajas/turnos/:id/movimientos
  async registrarMovimiento(request, reply) {
    try {
      const userId = request.user?.id
      const branchId = request.user?.branch_id

      const result = await cajasService.registrarMovimiento(request.params.id, request.body, { userId, branchId })
      return reply.code(201).send({
        success: true,
        message: `Movimiento de ${request.body.tipo_movimiento?.toUpperCase()} registrado correctamente`,
        data: result
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/cajas/movimientos/:movimientoId/arqueo
  async obtenerArqueoMovimiento(request, reply) {
    try {
      const data = await cajasService.obtenerArqueoMovimiento(request.params.movimientoId)
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // GET /api/cajas/turnos/:id/arqueos
  async listarArqueosTurno(request, reply) {
    try {
      const data = await cajasService.listarArqueosTurno(request.params.id)
      return reply.code(200).send({ success: true, data })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  },

  // POST /api/cajas/turnos/:id/cierre
  async cerrarTurno(request, reply) {
    try {
      const result = await cajasService.cerrarTurno(request.params.id, request.body)
      return reply.code(200).send({
        success: true,
        message: 'Turno de caja cerrado exitosamente',
        data: result
      })
    } catch (error) {
      request.log.error(error)
      const statusCode = error.statusCode || 500
      return reply.code(statusCode).send({ success: false, message: error.message })
    }
  }
}

module.exports = cajasController
