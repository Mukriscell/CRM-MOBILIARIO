# FASE 13 — Generación del Sistema · Hito H1

> Parte 13 de 13. Generación de código módulo por módulo, **por hitos del roadmap (FASE 11)**.
> Este documento cubre el **Hito H1: "Un lead entra, se asigna y aparece en la bandeja"**.

---

## Capacidad entregada

> Una corredora puede recibir un lead de un canal externo, verlo asignado automáticamente a un corredor y trabajarlo desde la bandeja — sin perder ninguno.

Vertical slice end-to-end: **Captura (Intake) → Asignación (Router) → Bandeja (Web)**.

---

## Qué se construyó

### Monorepo (FASE 5)
- pnpm workspaces · `tsconfig.base` · Docker Compose (Postgres + Redis) · CI (GitHub Actions).
- `packages/shared-types`: enums de dominio + contratos Zod (`LeadIntakeSchema`, `LoginSchema`).
- `packages/shared-utils`: normalización de fono CL (dedup), RUT, formato UF/CLP (+ tests).

### Backend (`apps/api`, NestJS — Clean Architecture)
| Módulo | Contenido |
|--------|-----------|
| **bootstrap** | `main.ts` (prefijo `/api/v1`, ValidationPipe, filtro global, CORS), `PrismaService`, `TenantContextService` (CLS), `DomainEventBus` (in-process), shared kernel (errores, pipe Zod, decoradores) |
| **auth** | `TokenService` (JWT), `JwtAuthGuard` (tenant del token), `RolesGuard`, `LoginUseCase`, `POST /auth/login` |
| **tenant / users** | repositorios (`findBySlug`, `findByEmail`, `findActiveBrokers`) |
| **leads** | `ILeadRepository` + `PrismaLeadRepository` (dedup por phone/email, paginación cursor keyset, assign transaccional), use cases (create+dedup+evento, assign+evento, list bandeja, get), `GET /leads`, `GET /leads/:id` |
| **lead-intake** | `IngestLeadUseCase`, `POST /lead-intake` (202), `POST /lead-intake/webhook/forms` |
| **lead-router** | `RoutingRulesService`, `LeadCreatedListener` (auto-asignación al `lead.created`), `POST /lead-router/assign` (RBAC) |

### Frontend (`apps/web`, Next.js 15)
- Login → guarda token · navegación lead-céntrica (Propiedades casi al final).
- **Bandeja de Leads**: score, tiempo sin respuesta (rojo > 5 min), acción WhatsApp, filtro "sin respuesta", empty state accionable.
- **Dashboard de Conversión** (H1): tarjeta accionable "sin respuesta".

---

## Decisiones de arquitectura respetadas
- **Lead como aggregate root**; Property no participa en H1.
- **Comunicación entre módulos** por use cases expuestos (`CreateLeadUseCase`, `AssignLeadUseCase`) + domain events — **sin importar repositorios ajenos** (regla FASE 5).
- **Multi-tenant**: `tenantId` del JWT → `TenantContextService`; repos filtran por tenant; assign verifica tenant en la transacción.
- **Speed-to-lead**: el intake responde `202` y la asignación ocurre por evento, sin bloquear.

---

## Validación ejecutada (en este entorno)

| Check | Resultado |
|-------|-----------|
| `pnpm install` | ✅ |
| `prisma generate` (valida `schema.prisma` de FASE 8) | ✅ Prisma Client v5 generado |
| `@clientra/shared-types` typecheck | ✅ |
| `@clientra/api` typecheck | ✅ |
| `@clientra/web` typecheck | ✅ |
| `@clientra/shared-utils` tests | ✅ 5/5 |
| `@clientra/api` build (`nest build`) | ✅ |

> Falta por validar contra una base real: migración (`prisma migrate`) y prueba e2e del flujo intake→bandeja con Postgres levantado. Es el siguiente paso de aceptación del H1.

---

## Criterio de salida del H1 (FASE 11) — estado

| Criterio | Estado |
|----------|--------|
| Un lead entra por webhook/intake, se deduplica y se asigna | ✅ implementado |
| Aparece en la bandeja del corredor, ordenado por urgencia | ✅ implementado |
| Aislamiento por tenant | ✅ por contexto + repos (RLS pendiente, migración SQL) |
| Latencia intake→bandeja < 5 s | ⏳ medir con DB real |
| CI verde | ✅ workflow añadido; checks locales en verde |

---

## Pendientes antes de cerrar H1 formalmente
1. Ejecutar `prisma migrate` contra Postgres y correr el flujo e2e real.
2. Habilitar RLS por migración SQL (4ª barrera multi-tenant).
3. Tests de integración del repositorio de leads + test de aislamiento por tenant (DoD FASE 5).

---

### Próximo hito
**H2 — "El corredor responde por WhatsApp y se mide el tiempo de respuesta"**: WhatsApp Cloud API + `MessagingProvider`, Inbox, autorespuesta 24/7, captura de `firstResponseAt` y TTFR en el dashboard. Habilita el **piloto cerrado**.
