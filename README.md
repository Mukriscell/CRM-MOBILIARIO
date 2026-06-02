# CLIENTRA

> **Plataforma de Conversión y Recuperación de Leads Inmobiliarios**
> *Nunca pierdas un comprador por falta de seguimiento.*

CLIENTRA **no** es un CRM inmobiliario tradicional: es una plataforma especializada en **convertir y recuperar** leads inmobiliarios. El centro del sistema es el **Lead**, no la propiedad.

## Documentación de diseño

El diseño completo (mercado, arquitectura, modelo de datos, API, UI/UX, roadmap, MVP) vive en [`docs/`](./docs) — 12 fases de diseño + la generación de código (FASE 13). Empieza por [`docs/README.md`](./docs/README.md).

## Stack

- **Frontend:** Next.js 15 · TypeScript · TailwindCSS · React Query · Zustand
- **Backend:** NestJS · Prisma · PostgreSQL · BullMQ/Redis
- **Arquitectura:** Modular Monolith · Clean Architecture · multi-tenant (shared schema + `tenantId`)

## Estructura del monorepo

```
apps/
  api/   → backend NestJS (Modular Monolith, Clean Architecture)
  web/   → frontend Next.js 15
packages/
  shared-types/  → enums de dominio + contratos Zod (front ↔ back)
  shared-utils/  → utilidades CL (fono, RUT, UF/CLP)
infrastructure/  → Docker, CI
docs/            → diseño por fases
```

## Cómo correr (desarrollo)

Requisitos: Node 22+, pnpm 9+, Docker.

```bash
# 1. Dependencias
pnpm install

# 2. Servicios (Postgres + Redis)
docker compose -f infrastructure/docker-compose.yml up -d

# 3. Variables de entorno
cp .env.example .env   # ajusta DATABASE_URL si es necesario

# 4. Base de datos
pnpm --filter @clientra/api db:generate
pnpm --filter @clientra/api db:migrate    # crea el schema
pnpm --filter @clientra/api db:seed       # tenant demo + usuarios

# 5. Levantar API y Web
pnpm dev
```

- API: http://localhost:4000/api/v1 (health: `/api/v1/health`)
- Web: http://localhost:3000
- Login demo: `admin@demo.cl` / `clientra123`

### Probar el flujo H1 (lead → asignación → bandeja)

```bash
# Autenticarse y capturar un lead (tenant del JWT)
TOKEN=$(curl -s localhost:4000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.cl","password":"clientra123"}' | jq -r .data.accessToken)

curl -s localhost:4000/api/v1/lead-intake -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"source":"LANDING","contact":{"firstName":"Juan","phone":"+56991234567"}}'

# El lead queda asignado automáticamente y aparece en la bandeja:
curl -s localhost:4000/api/v1/leads -H "Authorization: Bearer $TOKEN"
```

## Estado

**Diseño (FASES 1–12): completo.** Generación de código (FASE 13): **H1 implementado y validado** (typecheck + build + tests verdes). Ver [`docs/fase-13-h1.md`](./docs/fase-13-h1.md).
