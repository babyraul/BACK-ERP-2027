'use strict'

const fp        = require('fastify-plugin')
const sensible  = require('@fastify/sensible')

async function sensiblePlugin(fastify) {
  fastify.register(sensible)
}

module.exports = fp(sensiblePlugin, { name: 'sensible' })
