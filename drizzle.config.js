const { defineConfig } = require('drizzle-kit');
require('dotenv').config();

module.exports = defineConfig({
  schema:    './src/db/schema.js',
  out:       './src/db/migrations',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose:   true,
  strict:    true,
});
