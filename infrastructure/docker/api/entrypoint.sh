#!/bin/sh

cd /app/apps/api

echo "Aplicando migraciones Prisma..."
npx prisma migrate deploy --schema src/infrastructure/database/prisma/schema.prisma \
  || echo "Migraciones fallaron, continuando..."

echo "Sembrando datos de demo..."
node dist/infrastructure/database/prisma/seed.js \
  || echo "Seed omitido (datos ya existen o error no critico)."

echo "Iniciando API..."
exec node /app/apps/api/dist/main.js
