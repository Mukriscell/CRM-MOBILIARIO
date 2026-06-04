#!/bin/sh
set -e

echo "Esperando PostgreSQL..."
until node -e "
const net = require('net');
const url = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/railway');
const s = new net.Socket();
s.setTimeout(3000);
s.on('connect', () => { s.destroy(); process.exit(0); });
s.on('error', () => process.exit(1));
s.on('timeout', () => process.exit(1));
s.connect(parseInt(url.port) || 5432, url.hostname);
" 2>/dev/null; do
  sleep 2
done
echo "PostgreSQL disponible."

cd /app/apps/api

echo "Aplicando migraciones Prisma..."
npx prisma migrate deploy --schema src/infrastructure/database/prisma/schema.prisma

echo "Sembrando datos de demo..."
node dist/infrastructure/database/prisma/seed.js \
  || echo "Seed omitido (datos ya existen o error no critico)."

echo "Iniciando API en :4000..."
exec node /app/apps/api/dist/main.js
