const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const schema = require('./schema');
const relations = require('./relations');

// Configuración de la conexión a PostgreSQL
const queryClient = postgres(process.env.DATABASE_URL, {
  max: 10, // Max number of connections
});

// Instanciamos Drizzle ORM con nuestro esquema
const db = drizzle(queryClient, { schema: { ...schema, ...relations } });

module.exports = {
  db,
  queryClient
};
