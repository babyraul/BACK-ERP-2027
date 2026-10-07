'use strict'

const apiPeruService = require('../services/api_peru_service')

async function utilsRoutes(fastify) {
  fastify.get('/consulta-documento/:tipo/:numero', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { tipo, numero } = request.params
    try {
      const data = await apiPeruService.consultarDocumento(tipo, numero)
      if (data.error) {
        return reply.code(404).send(data)
      }
      return reply.code(200).send(data)
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: 'Error al consultar documento' })
    }
  })
}

module.exports = utilsRoutes
