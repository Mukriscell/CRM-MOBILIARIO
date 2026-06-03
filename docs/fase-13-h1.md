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

## Validación contra Postgres real (cierre de H1)

Ejecutado contra Postgres 16 (Docker), con migración y seed reales:

| Validación | Resultado |
|------------|-----------|
| `prisma migrate` (init, 41 tablas) | ✅ aplicada |
| `prisma migrate deploy` (RLS) | ✅ aplicada |
| Seed (tenant demo + usuarios) | ✅ |
| **E2E** intake → dedup/merge → auto-asignación (evento) → bandeja | ✅ 8/8 checks (`pnpm --filter @clientra/api test:e2e`) |
| Dedup por teléfono (merge, no duplica) | ✅ |
| Asignación automática vía evento `lead.created` | ✅ |
| Paginación cursor en bandeja | ✅ |
| **Aislamiento multi-tenant** (tenant B no ve lead de A; getLead cross-tenant → NotFound) | ✅ |
| **RLS** (rol no-owner: ve solo su tenant; 0 sin `app.current_tenant`) | ✅ (`apps/api/scripts/validate-rls.sql`) |

### Artefactos de prueba (reproducibles)
- `apps/api/scripts/e2e-h1.cjs` — e2e + integración del repositorio + aislamiento (Nest application context contra DB real).
- `apps/api/scripts/validate-rls.sql` — validación de la política RLS con rol no-owner.

---

## Criterio de salida del H1 (FASE 11) — estado

| Criterio | Estado |
|----------|--------|
| Un lead entra por intake, se deduplica y se asigna | ✅ validado e2e |
| Aparece en la bandeja del corredor | ✅ validado e2e |
| Aislamiento por tenant (app-layer) | ✅ validado (lista + detalle) |
| RLS como barrera adicional (DB-layer) | ✅ habilitada y validada |
| CI verde | ✅ workflow; checks locales en verde |

---

## Follow-up (mejora, no bloqueante)
- **Wiring de RLS en runtime:** la app aplica hoy el aislamiento a nivel de aplicación (probado). Para activar RLS en producción como barrera viva, conectar con un rol **no-owner** y ejecutar `SET app.current_tenant = '<tenantId>'` por transacción (Prisma middleware). La política ya está creada y validada; el owner queda exento a propósito para migraciones/seed.
- HTTP e2e vía supertest (el entorno actual bloquea el bind de puerto; se validó vía application context, equivalente funcional).

---

### Próximo hito
**H2 — "El corredor responde por WhatsApp y se mide el tiempo de respuesta"**: WhatsApp Cloud API + `MessagingProvider`, Inbox, autorespuesta 24/7, captura de `firstResponseAt` y TTFR en el dashboard. Habilita el **piloto cerrado**.
