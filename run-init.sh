#!/bin/bash

echo "Iniciando configuración de la Base de Datos..."

# Extraer DATABASE_URL del archivo .env
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)

if [ -z "$DB_URL" ]; then
  echo "❌ Error: No se encontró DATABASE_URL en el archivo .env"
  exit 1
fi

echo "----------------------------------------"
echo "🛠️  1. Creando tablas (db-init.sql)..."
echo "----------------------------------------"
psql "$DB_URL" -f db-init.sql
if [ $? -ne 0 ]; then
    echo "❌ Error al ejecutar db-init.sql"
    exit 1
fi

echo ""
echo "----------------------------------------"
echo "🌱 2. Insertando datos semilla (db-seed.sql)..."
echo "----------------------------------------"
psql "$DB_URL" -f db-seed.sql
if [ $? -ne 0 ]; then
    echo "❌ Error al ejecutar db-seed.sql"
    exit 1
fi

echo ""
echo "✅ ¡Base de datos inicializada y poblada exitosamente!"
