# CLIENTRA — Documentación de Diseño

> **Clientra** — *Nunca pierdas un comprador por falta de seguimiento.*
> Plataforma SaaS multi-tenant de CRM inmobiliario para corredoras e inmobiliarias en Chile.

Este directorio contiene el proceso de diseño **previo a la generación de código**, ejecutado en 13 fases secuenciales. No se avanza a una fase sin completar y validar la anterior.

## Control de avance

| Fase | Entregable | Estado | Documento |
|------|-----------|--------|-----------|
| 1 | Análisis del mercado inmobiliario chileno | ✅ Completada | [`fase-01-mercado-chileno.md`](./fase-01-mercado-chileno.md) |
| 2 | Problemas actuales de las corredoras | ✅ Completada | [`fase-02-problemas-corredoras.md`](./fase-02-problemas-corredoras.md) |
| 3 | Análisis de competidores | ✅ Completada | [`fase-03-analisis-competidores.md`](./fase-03-analisis-competidores.md) |
| 4 | Arquitectura completa | ✅ Completada | [`fase-04-arquitectura.md`](./fase-04-arquitectura.md) |
| 5 | Estructura de carpetas | ✅ Completada | [`fase-05-estructura-carpetas.md`](./fase-05-estructura-carpetas.md) |
| 6 | Modelo de base de datos | ✅ Completada | [`fase-06-modelo-datos.md`](./fase-06-modelo-datos.md) |
| 7 | Diagrama entidad-relación | ✅ Completada | [`fase-07-diagrama-er.md`](./fase-07-diagrama-er.md) |
| 8 | Prisma Schema | ✅ Completada | [`fase-08-prisma-schema.md`](./fase-08-prisma-schema.md) · [`schema.prisma`](../apps/api/src/infrastructure/database/prisma/schema.prisma) |
| 9 | Diseño API REST | ✅ Completada | [`fase-09-api-rest.md`](./fase-09-api-rest.md) |
| 10 | Diseño UI/UX | ⏳ Pendiente | — |
| 11 | Roadmap de desarrollo | ⏳ Pendiente | — |
| 12 | Definición del MVP | ⏳ Pendiente | — |
| 13 | Generación del sistema módulo por módulo | ⏳ Pendiente | — |

## Stack objetivo

- **Frontend:** Next.js 15, React, TypeScript, TailwindCSS, Shadcn/UI, React Query, Zustand, React Hook Form, Zod
- **Backend:** NestJS, Prisma ORM, PostgreSQL, TypeScript
- **Infra:** Docker, Docker Compose
- **Servicios:** OpenAI API, WhatsApp Cloud API, Google Calendar, Stripe, Resend
- **Arquitectura:** Modular Monolith · Clean Architecture · SOLID · Repository Pattern · RBAC multi-tenant

## Convenciones

- Cada documento de fase es autocontenido y citado cuando se apoya en datos externos.
- Las cifras de mercado llevan fuente y fecha; los supuestos se marcan explícitamente como *a validar*.
