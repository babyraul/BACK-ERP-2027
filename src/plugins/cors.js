'use strict'

const fp   = require('fastify-plugin')
const cors = require('@fastify/cors')

async function corsPlugin(fastify) {
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5175')
    .split(',')
    .map((o) => o.trim())

  await fastify.register(cors, {
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  })
}

module.exports = fp(corsPlugin, { name: 'cors' })
