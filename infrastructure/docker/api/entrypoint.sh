#!/bin/sh
set -e

echo "Esperando PostgreSQL..."
until pg_isready -h "${POSTGRES_HOST:-localhost}" -U "${POSTGRES_USER:-clientra}" -d "${POSTGRES_DB:-clientra}" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL listo."

cd /app/apps/api

echo "Aplicando migraciones Prisma..."
npx prisma migrate deploy --schema src/infrastructure/database/prisma/schema.prisma

echo "Sembrando datos de demo..."
node dist/infrastructure/database/prisma/seed.js \
  || echo "Seed omitido (datos ya existen o error no critico)."

echo "Iniciando API en :4000..."
exec node /app/apps/api/dist/main.js
