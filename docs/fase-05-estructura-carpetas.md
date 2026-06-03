# FASE 5 — Estructura de Carpetas y Organización del Repositorio

> Documento de diseño físico para **CLIENTRA**. Parte 5 de 13.
> Sin código. Sin implementaciones. Sin Prisma Schema.
> Objetivo: estructura profesional lista para producción, sin deuda técnica, extensible a largo plazo.

---

## 1. Decisión de repositorio: Monorepo

**Opción elegida: Monorepo con estructura `apps/` + `packages/`**

### Justificación técnica

| Criterio | Monorepo | Repos separados |
|----------|----------|-----------------|
| Compartir tipos TS entre frontend y backend | ✅ Nativo | ❌ Requiere publicar paquetes o duplicar |
| Cambios atómicos cross-stack (DTO nuevo = contrato actualizado en ambos lados) | ✅ Un solo commit | ❌ PRs coordinados entre repos |
| CI/CD con pipelines por app | ✅ Filtros de path | ✅ Pipelines independientes |
| Onboarding de desarrolladores | ✅ Un `git clone` | ❌ N repos a clonar y configurar |
| Tooling compartido (ESLint, Prettier, tsconfig base) | ✅ Un `package.json` raíz | ❌ Duplicación y drift de versiones |
| Aislamiento de despliegue | ✅ (con filtros de path en CI) | ✅ Nativo |
| Costo de coordinación | ✅ Mínimo | ❌ Overhead de sincronización |

**Para un equipo small y un Modular Monolith** (que ya centraliza el backend), el Monorepo elimina la fricción de coordinación sin sacrificar el aislamiento de despliegue. Los tipos compartidos (DTOs, enums de dominio) son el mayor beneficio concreto: el frontend nunca quedará desincronizado con los contratos del backend.

**Tooling elegido: pnpm workspaces** (nativo, sin Nx ni Turborepo en fase inicial — se agrega Turborepo si el tiempo de CI empieza a doler).

---

## 2. Árbol completo del repositorio

```
clientra/                                      ← raíz del monorepo
│
├── apps/
│   ├── web/                                   ← Frontend (Next.js 15)
│   └── api/                                   ← Backend (NestJS)
│
├── packages/
│   ├── shared-types/                          ← Contratos TS compartidos
│   ├── shared-utils/                          ← Utilidades puras sin deps de framework
│   └── shared-config/                         ← Configuraciones reutilizables (ESLint, tsconfig)
│
├── infrastructure/
│   ├── docker/
│   ├── scripts/
│   └── environments/
│
├── docs/                                      ← (ya existente, fases 1-4)
│
├── .github/
│   └── workflows/
│
├── package.json                               ← workspace root
├── pnpm-workspace.yaml
├── turbo.json                                 ← (agregar cuando CI lo requiera)
├── .eslintrc.base.js
├── tsconfig.base.json
├── .env.example
└── .gitignore
```

---

### 2.1 `apps/web/` — Frontend (Next.js 15)

```
apps/web/
│
├── src/
│   │
│   ├── app/                                   ← Next.js App Router (rutas y layouts)
│   │   ├── (auth)/                            ← Route group: páginas sin sidebar
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                       ← Route group: páginas con sidebar
│   │   │   ├── layout.tsx                     ← Shell con nav, sidebar, tenant context
│   │   │   ├── page.tsx                       ← Dashboard ejecutivo (/)
│   │   │   │
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx                   ← Lista/Kanban de leads
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx               ← Detalle de lead + timeline
│   │   │   │
│   │   │   ├── pipeline/
│   │   │   │   └── page.tsx                   ← CRM Kanban
│   │   │   │
│   │   │   ├── whatsapp/
│   │   │   │   └── page.tsx                   ← Bandeja centralizada WhatsApp
│   │   │   │
│   │   │   ├── properties/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── visits/
│   │   │   │   └── page.tsx                   ← Agenda de visitas
│   │   │   │
│   │   │   ├── team/                          ← Admin: gestión de corredores
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── billing/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── integrations/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── admin/                         ← Super Admin (cross-tenant)
│   │   │       ├── tenants/
│   │   │       │   └── page.tsx
│   │   │       └── plans/
│   │   │           └── page.tsx
│   │   │
│   │   ├── api/                               ← Next.js Route Handlers (solo proxies/webhooks)
│   │   │   └── webhooks/
│   │   │       └── [...provider]/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                         ← Root layout (fuentes, providers)
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── features/                              ← Lógica de negocio por dominio del frontend
│   │   │
│   │   ├── leads/
│   │   │   ├── components/                    ← Componentes exclusivos de leads
│   │   │   │   ├── LeadCard.tsx
│   │   │   │   ├── LeadKanban.tsx
│   │   │   │   ├── LeadTimeline.tsx
│   │   │   │   ├── LeadScoreBadge.tsx
│   │   │   │   └── LeadRecoveryAlert.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useLeads.ts
│   │   │   │   ├── useLeadDetail.ts
│   │   │   │   └── useLeadPipeline.ts
│   │   │   ├── services/
│   │   │   │   └── leads.service.ts           ← Llamadas API (React Query wrappers)
│   │   │   ├── store/
│   │   │   │   └── leads.store.ts             ← Zustand slice local
│   │   │   └── types/
│   │   │       └── lead.types.ts              ← Re-exports de shared-types + tipos UI
│   │   │
│   │   ├── whatsapp/
│   │   │   ├── components/
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── MessageThread.tsx
│   │   │   │   └── QuickReplyBar.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useConversations.ts
│   │   │   └── services/
│   │   │       └── whatsapp.service.ts
│   │   │
│   │   ├── pipeline/
│   │   │   ├── components/
│   │   │   │   ├── PipelineBoard.tsx
│   │   │   │   └── PipelineColumn.tsx
│   │   │   └── hooks/
│   │   │       └── usePipeline.ts
│   │   │
│   │   ├── properties/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   │
│   │   ├── visits/
│   │   │   ├── components/
│   │   │   │   ├── VisitCalendar.tsx
│   │   │   │   └── VisitCard.tsx
│   │   │   └── hooks/
│   │   │       └── useVisits.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── TTFRWidget.tsx             ← Tiempo primera respuesta
│   │   │   │   ├── ConversionFunnel.tsx
│   │   │   │   ├── RecoveredLeadsWidget.tsx
│   │   │   │   └── BrokerPerformanceTable.tsx
│   │   │   └── hooks/
│   │   │       └── useDashboard.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   └── store/
│   │   │       └── auth.store.ts
│   │   │
│   │   ├── team/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   └── billing/
│   │       ├── components/
│   │       │   ├── PlanCard.tsx
│   │       │   └── SubscriptionStatus.tsx
│   │       └── hooks/
│   │           └── useBilling.ts
│   │
│   ├── shared/                                ← Compartido dentro del frontend
│   │   ├── components/                        ← Componentes UI reutilizables no de negocio
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   ├── feedback/
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   └── data-display/
│   │   │       ├── DataTable.tsx
│   │   │       ├── StatsCard.tsx
│   │   │       └── Badge.tsx
│   │   │
│   │   ├── hooks/                             ← Hooks transversales
│   │   │   ├── useTenant.ts
│   │   │   ├── usePermissions.ts
│   │   │   └── useDebounce.ts
│   │   │
│   │   ├── providers/                         ← Context providers raíz
│   │   │   ├── QueryProvider.tsx
│   │   │   ├── TenantProvider.tsx
│   │   │   └── ThemeProvider.tsx
│   │   │
│   │   └── lib/                               ← Utilidades internas del frontend
│   │       ├── api-client.ts                  ← Instancia axios/fetch configurada
│   │       ├── format.ts                      ← Formatters UF/CLP, fechas, etc.
│   │       └── cn.ts                          ← Helper classnames
│   │
│   └── config/                                ← Configuración del frontend
│       └── routes.ts                          ← Constantes de rutas tipadas
│
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json                              ← extiende tsconfig.base.json
└── package.json
```

---

### 2.2 `apps/api/` — Backend (NestJS Modular Monolith)

```
apps/api/
│
├── src/
│   │
│   ├── main.ts                                ← Bootstrap NestJS, Swagger, pipes globales
│   ├── app.module.ts                          ← Módulo raíz: importa todos los módulos
│   │
│   ├── modules/                               ← Un directorio = un módulo de negocio
│   │   │
│   │   ├── tenant/                            ← PLATFORM: aislamiento multi-tenant
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── tenant.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── tenant-plan.vo.ts
│   │   │   │   └── repositories/
│   │   │   │       └── tenant.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-tenant.use-case.ts
│   │   │   │   │   └── get-tenant.use-case.ts
│   │   │   │   └── dtos/
│   │   │   │       └── create-tenant.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── prisma-tenant.repository.ts
│   │   │   │   └── middleware/
│   │   │   │       └── tenant.middleware.ts   ← Resuelve tenantId desde JWT
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── tenant.controller.ts
│   │   │   └── tenant.module.ts
│   │   │
│   │   ├── auth/                              ← PLATFORM: autenticación
│   │   │   ├── domain/
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── password.vo.ts
│   │   │   │   └── services/
│   │   │   │       └── token.domain-service.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── login.use-case.ts
│   │   │   │   │   ├── refresh-token.use-case.ts
│   │   │   │   │   └── forgot-password.use-case.ts
│   │   │   │   └── dtos/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── auth-response.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── jwt/
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   └── guards/
│   │   │   │       └── jwt-auth.guard.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── auth.controller.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/                             ← PLATFORM: usuarios y RBAC
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── user-role.vo.ts        ← SUPER_ADMIN | ADMIN | CORREDOR
│   │   │   │   └── repositories/
│   │   │   │       └── user.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   └── dtos/
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   └── guards/
│   │   │   │       └── roles.guard.ts         ← RBAC guard (usa UserRole VO)
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   └── users.module.ts
│   │   │
│   │   │   ─── CONVERSION CORE ──────────────────────────────────────────────
│   │   │
│   │   ├── lead-intake/                       ← ENGINE 1: captura y normalización
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── raw-intake.entity.ts   ← Payload crudo antes de normalizar
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── lead-source.vo.ts      ← WHATSAPP|META_ADS|LANDING|FORM|PORTAL
│   │   │   │   └── services/
│   │   │   │       └── deduplication.domain-service.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   └── ingest-lead.use-case.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   └── intake-webhook.dto.ts
│   │   │   │   └── ports/
│   │   │   │       └── intake-normalizer.port.ts  ← Interface para adaptadores externos
│   │   │   ├── infrastructure/
│   │   │   │   └── adapters/
│   │   │   │       ├── whatsapp-intake.adapter.ts
│   │   │   │       ├── meta-ads-intake.adapter.ts
│   │   │   │       └── form-intake.adapter.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── intake-webhook.controller.ts
│   │   │   └── lead-intake.module.ts
│   │   │
│   │   ├── lead-router/                       ← ENGINE 2: asignación automática
│   │   │   ├── domain/
│   │   │   │   ├── services/
│   │   │   │   │   └── routing-rules.domain-service.ts
│   │   │   │   └── value-objects/
│   │   │   │       └── routing-criteria.vo.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   └── assign-lead.use-case.ts
│   │   │   │   └── ports/
│   │   │   │       └── availability.port.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── listeners/
│   │   │   │       └── lead-created.listener.ts   ← Escucha LeadCreated event
│   │   │   └── lead-router.module.ts
│   │   │
│   │   ├── lead-scoring/                      ← ENGINE 3: priorización inteligente
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── lead-score.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── score-tier.vo.ts       ← HOT | WARM | COLD
│   │   │   │   │   └── budget-range.vo.ts     ← presupuesto + pie + elegibilidad subsidio
│   │   │   │   └── services/
│   │   │   │       └── heuristic-scoring.domain-service.ts  ← Fallback sin IA
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   └── score-lead.use-case.ts
│   │   │   │   └── ports/
│   │   │   │       └── ai-scoring.port.ts     ← Interface hacia AI Layer
│   │   │   ├── infrastructure/
│   │   │   │   └── listeners/
│   │   │   │       └── lead-assigned.listener.ts
│   │   │   └── lead-scoring.module.ts
│   │   │
│   │   ├── follow-up/                         ← ENGINE 4: cadencias automáticas
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── follow-up-sequence.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── cadence-step.vo.ts     ← día, canal, tipo de mensaje
│   │   │   │   └── services/
│   │   │   │       └── cadence-resolver.domain-service.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── schedule-follow-up.use-case.ts
│   │   │   │   │   ├── execute-follow-up-step.use-case.ts
│   │   │   │   │   └── cancel-follow-up.use-case.ts
│   │   │   │   └── ports/
│   │   │   │       └── queue.port.ts          ← Interface hacia BullMQ
│   │   │   ├── infrastructure/
│   │   │   │   ├── jobs/
│   │   │   │   │   └── follow-up.job.ts       ← Procesador BullMQ
│   │   │   │   └── listeners/
│   │   │   │       └── lead-qualified.listener.ts
│   │   │   └── follow-up.module.ts
│   │   │
│   │   ├── lead-recovery/                     ← ENGINE 5: recuperación (first-mover)
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── recovery-attempt.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── inactivity-threshold.vo.ts   ← 30 | 60 | 90 días
│   │   │   │   └── services/
│   │   │   │       └── cold-detection.domain-service.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── detect-cold-leads.use-case.ts
│   │   │   │   │   └── trigger-recovery.use-case.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── jobs/
│   │   │   │       └── cold-sweep.cron.ts     ← Cron diario (Nest ScheduleModule)
│   │   │   └── lead-recovery.module.ts
│   │   │
│   │   ├── whatsapp-crm/                      ← WhatsApp CRM centralizado
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── conversation.entity.ts
│   │   │   │   │   └── message.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── message-template.vo.ts
│   │   │   │   └── repositories/
│   │   │   │       └── conversation.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── link-conversation-to-lead.use-case.ts
│   │   │   │   │   ├── send-message.use-case.ts
│   │   │   │   │   └── auto-respond.use-case.ts
│   │   │   │   └── ports/
│   │   │   │       └── messaging.port.ts      ← Interface: send(), getHistory()
│   │   │   ├── infrastructure/
│   │   │   │   ├── providers/
│   │   │   │   │   └── whatsapp-cloud.provider.ts   ← Impl. de messaging.port
│   │   │   │   └── repositories/
│   │   │   │       └── prisma-conversation.repository.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       ├── whatsapp-webhook.controller.ts
│   │   │   │       └── conversation.controller.ts
│   │   │   └── whatsapp-crm.module.ts
│   │   │
│   │   ├── visit-scheduling/                  ← Agenda de visitas
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── visit.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── visit-status.vo.ts     ← SCHEDULED|CONFIRMED|CANCELLED|DONE
│   │   │   │   └── repositories/
│   │   │   │       └── visit.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── schedule-visit.use-case.ts
│   │   │   │   │   └── confirm-visit.use-case.ts
│   │   │   │   └── ports/
│   │   │   │       └── calendar.port.ts       ← Interface hacia Google Calendar
│   │   │   ├── infrastructure/
│   │   │   │   └── providers/
│   │   │   │       └── google-calendar.provider.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── visit.controller.ts
│   │   │   └── visit-scheduling.module.ts
│   │   │
│   │   │   ─── SUPPORTING MODULES ───────────────────────────────────────────
│   │   │
│   │   ├── leads/                             ← Entidad Lead central (shared domain)
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── lead.entity.ts         ← Entidad raíz: el ciudadano de primera clase
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── lead-status.vo.ts      ← NUEVO→CONTACTADO→...→VENTA_CERRADA|PERDIDO
│   │   │   │   │   ├── lead-source.vo.ts
│   │   │   │   │   ├── budget.vo.ts           ← presupuesto + moneda (CLP/UF)
│   │   │   │   │   └── contact-info.vo.ts
│   │   │   │   ├── events/                    ← Domain Events del Lead
│   │   │   │   │   ├── lead-created.event.ts
│   │   │   │   │   ├── lead-assigned.event.ts
│   │   │   │   │   ├── lead-qualified.event.ts
│   │   │   │   │   ├── lead-went-cold.event.ts
│   │   │   │   │   └── lead-recovered.event.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── lead.repository.interface.ts
│   │   │   │   └── services/
│   │   │   │       └── lead-lifecycle.domain-service.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-lead.use-case.ts
│   │   │   │   │   ├── update-lead-status.use-case.ts
│   │   │   │   │   ├── get-lead.use-case.ts
│   │   │   │   │   └── list-leads.use-case.ts
│   │   │   │   └── dtos/
│   │   │   │       ├── create-lead.dto.ts
│   │   │   │       ├── update-lead-status.dto.ts
│   │   │   │       └── lead-response.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── prisma-lead.repository.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── lead.controller.ts
│   │   │   └── leads.module.ts
│   │   │
│   │   ├── properties/                        ← CRUD esencial (SIN MLS/canje/portales)
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── property.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── property-type.vo.ts    ← DEPTO|CASA|OFICINA|TERRENO|...
│   │   │   │   │   ├── property-status.vo.ts  ← ACTIVA|RESERVADA|VENDIDA|INACTIVA
│   │   │   │   │   └── price.vo.ts            ← valor + moneda (UF|CLP)
│   │   │   │   └── repositories/
│   │   │   │       └── property.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   └── dtos/
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   └── properties.module.ts
│   │   │
│   │   ├── activities/                        ← Timeline: trazabilidad de toda interacción
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── activity.entity.ts
│   │   │   │   └── value-objects/
│   │   │   │       └── activity-type.vo.ts    ← LLAMADA|WHATSAPP|EMAIL|REUNION|VISITA|NOTA
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   └── register-activity.use-case.ts
│   │   │   │   └── dtos/
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   └── activities.module.ts
│   │   │
│   │   ├── dashboard/                         ← KPIs ejecutivos
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── get-ttfr-metrics.use-case.ts     ← Tiempo primera respuesta
│   │   │   │   │   ├── get-conversion-metrics.use-case.ts
│   │   │   │   │   ├── get-recovery-metrics.use-case.ts
│   │   │   │   │   └── get-broker-performance.use-case.ts
│   │   │   │   └── dtos/
│   │   │   │       └── dashboard-response.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── queries/                   ← Raw SQL optimizado para métricas
│   │   │   │       └── dashboard.queries.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── dashboard.controller.ts
│   │   │   └── dashboard.module.ts
│   │   │
│   │   │   ─── AI LAYER ─────────────────────────────────────────────────────
│   │   │
│   │   ├── ai/                                ← Capa IA desacoplada
│   │   │   ├── domain/
│   │   │   │   └── ports/
│   │   │   │       └── ai-provider.port.ts    ← Interface: scoreLead(), classify(), summarize()
│   │   │   ├── infrastructure/
│   │   │   │   └── providers/
│   │   │   │       ├── openai.provider.ts     ← Impl. concreta actual
│   │   │   │       └── mock-ai.provider.ts    ← Para testing/dev sin API key
│   │   │   └── ai.module.ts                   ← Exporta el provider activo por config
│   │   │
│   │   │   ─── PLATFORM MODULES ──────────────────────────────────────────────
│   │   │
│   │   ├── notifications/                     ← Centro de notificaciones
│   │   │   ├── domain/
│   │   │   │   └── ports/
│   │   │   │       └── notification.port.ts   ← Interface: sendEmail(), sendPush()
│   │   │   ├── infrastructure/
│   │   │   │   └── providers/
│   │   │   │       └── resend.provider.ts
│   │   │   └── notifications.module.ts
│   │   │
│   │   ├── billing/                           ← Suscripciones Stripe
│   │   │   ├── domain/
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── plan.vo.ts             ← STARTER|PROFESSIONAL|ENTERPRISE
│   │   │   │   └── ports/
│   │   │   │       └── payment.port.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── providers/
│   │   │   │       └── stripe.provider.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       ├── billing.controller.ts
│   │   │   │       └── stripe-webhook.controller.ts
│   │   │   └── billing.module.ts
│   │   │
│   │   └── audit/                             ← Auditoría y cumplimiento
│   │       ├── domain/
│   │       │   └── entities/
│   │       │       └── audit-log.entity.ts
│   │       ├── infrastructure/
│   │       │   └── interceptors/
│   │       │       └── audit.interceptor.ts
│   │       └── audit.module.ts
│   │
│   ├── shared/                                ← Shared Kernel del backend
│   │   │
│   │   ├── domain/                            ← Tipos base del dominio
│   │   │   ├── base-entity.ts                 ← id, createdAt, updatedAt, tenantId
│   │   │   ├── aggregate-root.ts
│   │   │   ├── domain-event.ts                ← Interface base de eventos
│   │   │   └── value-object.ts                ← Clase base VO con equals()
│   │   │
│   │   ├── events/                            ← Bus de eventos in-process
│   │   │   └── domain-event-bus.ts            ← NestJS EventEmitter wrapper tipado
│   │   │
│   │   ├── guards/                            ← Guards globales
│   │   │   └── tenant-isolation.guard.ts      ← Verifica que el recurso ∈ tenantId
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform-response.interceptor.ts
│   │   │
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts     ← Mapea excepciones de dominio → HTTP
│   │   │
│   │   ├── decorators/
│   │   │   ├── current-tenant.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   │
│   │   └── context/
│   │       └── tenant-context.service.ts      ← AsyncLocalStorage wrapper
│   │
│   ├── infrastructure/                        ← Infraestructura transversal
│   │   │
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma              ← (se diseña en FASE 8)
│   │   │   │   ├── migrations/
│   │   │   │   └── seed.ts
│   │   │   └── prisma.service.ts              ← PrismaClient singleton + tenant extension
│   │   │
│   │   ├── queue/
│   │   │   ├── bull.config.ts                 ← Configuración BullMQ + Redis
│   │   │   └── queues.constants.ts            ← Nombres de colas tipados
│   │   │
│   │   ├── cache/
│   │   │   └── redis.service.ts
│   │   │
│   │   └── health/
│   │       └── health.controller.ts           ← Endpoint /health para Docker/LB
│   │
│   └── config/                                ← Configuración de la app
│       ├── app.config.ts
│       ├── database.config.ts
│       ├── jwt.config.ts
│       ├── ai.config.ts
│       └── whatsapp.config.ts
│
├── test/                                      ← Tests del backend
│   ├── unit/                                  ← Co-ubicados con los módulos (ver §6)
│   ├── integration/
│   │   └── modules/
│   │       ├── leads.integration.spec.ts
│   │       └── tenant-isolation.integration.spec.ts
│   └── e2e/
│       ├── lead-intake.e2e-spec.ts
│       └── follow-up-cadence.e2e-spec.ts
│
├── tsconfig.json
├── nest-cli.json
└── package.json
```

---

### 2.3 `packages/` — Código compartido entre apps

```
packages/
│
├── shared-types/                              ← Contratos TypeScript compartidos
│   ├── src/
│   │   ├── lead/
│   │   │   ├── lead-status.enum.ts
│   │   │   ├── lead-source.enum.ts
│   │   │   └── lead.dto.ts
│   │   ├── user/
│   │   │   └── user-role.enum.ts
│   │   ├── property/
│   │   │   └── property-type.enum.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared-utils/                              ← Utilidades puras (sin deps de framework)
│   ├── src/
│   │   ├── uf.ts                              ← Conversión UF/CLP
│   │   ├── rut.ts                             ← Validación RUT chileno
│   │   ├── phone-cl.ts                        ← Normalización fono +569...
│   │   └── date.ts
│   ├── package.json
│   └── tsconfig.json
│
└── shared-config/                             ← Configuraciones de tooling
    ├── eslint/
    │   └── index.js
    ├── tsconfig/
    │   └── base.json
    └── prettier/
        └── index.js
```

---

### 2.4 `infrastructure/` — DevOps y entornos

```
infrastructure/
│
├── docker/
│   ├── api/
│   │   └── Dockerfile                         ← Multi-stage: builder + runner
│   ├── web/
│   │   └── Dockerfile                         ← Multi-stage: builder + runner
│   └── nginx/
│       └── nginx.conf                         ← Reverse proxy (prod)
│
├── docker-compose.yml                         ← Desarrollo local: api + web + postgres + redis
├── docker-compose.prod.yml                    ← Producción
│
├── scripts/
│   ├── migrate.sh                             ← Aplica migraciones Prisma
│   ├── seed.sh
│   └── health-check.sh
│
└── environments/
    ├── .env.example                           ← Template con todas las variables
    ├── .env.development
    └── .env.test
```

---

### 2.5 `.github/` — CI/CD

```
.github/
└── workflows/
    ├── ci.yml                                 ← PR: lint + typecheck + test
    ├── deploy-api.yml                         ← Push a main: despliega api
    └── deploy-web.yml                         ← Push a main: despliega web
```

---

### 2.6 `docs/` — Documentación de diseño

```
docs/
├── README.md                                  ← Índice de control de avance (ya existente)
├── fase-01-mercado-chileno.md
├── fase-02-problemas-corredoras.md
├── fase-03-analisis-competidores.md
├── fase-04-arquitectura.md
├── fase-05-estructura-carpetas.md             ← (este documento)
├── fase-06-modelo-datos.md                    ← (próximas fases)
├── fase-07-diagrama-er.md
├── fase-08-prisma-schema.md
├── fase-09-api-rest.md
├── fase-10-uiux.md
├── fase-11-roadmap.md
├── fase-12-mvp.md
├── adr/                                       ← Architecture Decision Records
│   ├── 001-monorepo-vs-repos-separados.md
│   ├── 002-shared-schema-multitenant.md
│   ├── 003-bullmq-sobre-redis.md
│   ├── 004-ai-provider-interface.md
│   └── 005-domain-events-in-process.md
└── diagrams/
    ├── c4-context.png
    ├── c4-containers.png
    └── lead-lifecycle.png
```

---

## 3. Flujo de dependencias **permitido**

```
┌────────────────────────────────────────────────────────┐
│  DIRECCIÓN DE DEPENDENCIAS PERMITIDA                     │
│                                                          │
│  presentation   →   application   →   domain            │
│                 ↑                  ↑                     │
│           infrastructure  ─────────┘                    │
│           (implementa interfaces del dominio)            │
│                                                          │
│  shared kernel  →  TODOS los módulos (sentido permitido) │
│                                                          │
│  Módulo A → shared/domain  (PERMITIDO)                  │
│  Engine   → Lead entity    (PERMITIDO: es su dominio)   │
│  Dashboard → repositories  (PERMITIDO: vía interfaces)  │
│                                                          │
│  packages/shared-types → frontend Y backend (PERMITIDO) │
│  packages/shared-utils → frontend Y backend (PERMITIDO) │
└────────────────────────────────────────────────────────┘
```

**Reglas explícitas de dependencia permitidas:**
1. `presentation` solo conoce DTOs y use cases de `application`.
2. `application` solo conoce entidades, interfaces de repositorio y puertos del `domain`.
3. `infrastructure` implementa las interfaces del `domain` (Repository Pattern, Provider).
4. Los **listeners de eventos** (Lead Router, Follow-Up, Recovery) solo dependen de su propio use case + el evento del shared domain.
5. `shared/domain` puede ser importado por cualquier módulo.
6. `packages/shared-types` puede ser importado por `apps/web` y `apps/api`.

---

## 4. Flujo de dependencias **prohibido**

```
┌────────────────────────────────────────────────────────┐
│  DEPENDENCIAS EXPLÍCITAMENTE PROHIBIDAS                  │
│                                                          │
│  domain   →  infrastructure    ← NUNCA                  │
│  domain   →  presentation      ← NUNCA                  │
│  domain   →  NestJS/Prisma/OpenAI ← NUNCA              │
│                                                          │
│  Módulo A →  Repositorio de Módulo B  ← NUNCA           │
│  (los módulos no comparten repos; usan domain events)    │
│                                                          │
│  lead-router  →  lead-scoring  (importación directa)    │
│                  ← NUNCA; se comunican por events        │
│                                                          │
│  dashboard    →  prisma directamente  ← NUNCA           │
│  (salvo queries optimizadas en infrastructure/queries/)  │
│                                                          │
│  packages/shared-types  →  apps/*  ← NUNCA (inversión) │
│  packages/shared-utils  →  NestJS/Next  ← NUNCA        │
└────────────────────────────────────────────────────────┘
```

**Herramienta de refuerzo:** se configura `eslint-plugin-boundaries` con reglas que impiden importaciones entre capas prohibidas en CI. El lint falla el PR si una capa cruza los límites.

---

## 5. Reglas arquitectónicas obligatorias

| # | Regla | Razón |
|---|-------|-------|
| R1 | Todo repositorio DEBE implementar una interface del dominio | Desacopla Prisma del negocio; permite mocks en tests |
| R2 | Todo caso de uso DEBE ser una clase con un único método `execute()` | SRP; testeable de forma aislada |
| R3 | Los Domain Events se emiten desde la entidad o el use case, nunca desde el controller | El dominio controla su propio ciclo de vida |
| R4 | Toda entidad DEBE extender `BaseEntity` (id, createdAt, updatedAt, tenantId) | Aislamiento multi-tenant garantizado en el modelo |
| R5 | Ningún módulo puede importar el repositorio de otro módulo | Evita acoplamiento inter-módulo; usar eventos si se necesita comunicación |
| R6 | `AIProvider`, `MessagingProvider`, `CalendarProvider`, `PaymentProvider` DEBEN ser interfaces | Vendor independence; swap sin tocar lógica de negocio |
| R7 | Los jobs de BullMQ DEBEN ser idempotentes | Los reintentos no deben duplicar efectos |
| R8 | Toda query cruzada de múltiples módulos en Dashboard DEBE vivir en `infrastructure/queries/` | Mantiene los repositorios simples; queries complejas separadas y explícitas |
| R9 | `tenantId` DEBE estar presente en TODA query a la base de datos | Triple barrera: middleware + Prisma extension + regla de review |
| R10 | Los DTOs se validan con Zod; los schemas se comparten con el frontend vía `shared-types` | Contrato único; elimina drift entre cliente y servidor |

---

## 6. Convenciones de nombres

### Archivos y carpetas

| Artefacto | Convención | Ejemplo |
|-----------|-----------|---------|
| Entidad | `kebab-case.entity.ts` | `lead.entity.ts` |
| Value Object | `kebab-case.vo.ts` | `lead-status.vo.ts` |
| Domain Event | `kebab-case.event.ts` | `lead-went-cold.event.ts` |
| Use Case | `verb-noun.use-case.ts` | `score-lead.use-case.ts` |
| Repository Interface | `noun.repository.interface.ts` | `lead.repository.interface.ts` |
| Prisma Repository | `prisma-noun.repository.ts` | `prisma-lead.repository.ts` |
| Port / Interface | `noun.port.ts` | `messaging.port.ts` |
| Provider (impl) | `service-name.provider.ts` | `whatsapp-cloud.provider.ts` |
| Controller | `noun.controller.ts` | `lead.controller.ts` |
| DTO | `verb-noun.dto.ts` | `create-lead.dto.ts` |
| Guard | `noun.guard.ts` | `roles.guard.ts` |
| Listener | `event-name.listener.ts` | `lead-created.listener.ts` |
| Job | `noun.job.ts` | `follow-up.job.ts` |
| Cron | `noun.cron.ts` | `cold-sweep.cron.ts` |
| Test unitario | `[archivo].spec.ts` (co-ubicado) | `score-lead.use-case.spec.ts` |
| Test integración | `[módulo].integration.spec.ts` | `leads.integration.spec.ts` |
| Test E2E | `[flujo].e2e-spec.ts` | `lead-intake.e2e-spec.ts` |

### Clases y tipos

| Artefacto | Convención | Ejemplo |
|-----------|-----------|---------|
| Entidad | `PascalCase` + sufijo `Entity` | `LeadEntity` |
| Value Object | `PascalCase` + sufijo `VO` | `LeadStatusVO` |
| Domain Event | `PascalCase` + sufijo `Event` | `LeadWentColdEvent` |
| Use Case | `PascalCase` + sufijo `UseCase` | `ScoreLeadUseCase` |
| DTO | `PascalCase` + sufijo `Dto` | `CreateLeadDto` |
| Repository Interface | `I` + `PascalCase` + `Repository` | `ILeadRepository` |
| Port Interface | `I` + `PascalCase` + `Provider` / `Port` | `IMessagingProvider` |
| Módulo NestJS | `PascalCase` + `Module` | `LeadScoringModule` |
| Enum | `SCREAMING_SNAKE_CASE` | `LEAD_STATUS.NUEVO` |

### Rutas API REST (preview — detalle en FASE 9)

```
/api/v1/{módulo}/{recurso}
GET  /api/v1/leads
POST /api/v1/leads
GET  /api/v1/leads/:id/timeline
POST /api/v1/webhooks/whatsapp
POST /api/v1/webhooks/meta-ads
GET  /api/v1/dashboard/metrics
```

---

## 7. Estrategia para evitar deuda técnica

| Área | Medida preventiva |
|------|-------------------|
| **Acoplamiento** | `eslint-plugin-boundaries` en CI: prohíbe imports entre capas y módulos prohibidos; el PR no pasa si hay violación |
| **Drift de contratos** | DTOs generados desde Zod + compartidos vía `packages/shared-types`: el compilador detecta desincronización |
| **Vendor lock-in** | Todo servicio externo detrás de un Port (interface); la implementación concreta se inyecta y se puede swappear en una hora |
| **Multi-tenant accidental** | Prisma Client Extension que fuerza `tenantId` en toda query + test de integración de aislamiento en CI |
| **Módulos "gordos"** | Cada módulo tiene un `*.module.ts` que exporta SOLO lo que otros módulos necesitan. Si la lista de exports crece, es señal de que el módulo está siendo demasiado generoso → revisión |
| **Naming drift** | Guía de convenciones (este documento §6) en `docs/` + reviewers con checklist de PR |
| **Dependencias circulares** | `madge --circular` en CI; falla el pipeline si hay ciclo |
| **Tests ignorados** | Cobertura mínima por capa en CI (use cases: 80%+; dominio: 90%+); coverage report como artifact de cada PR |
| **Migraciones peligrosas** | Toda migración de DB es backward-compatible (no se elimina columna en el mismo commit que el código que la deja de usar) |
| **Documentación desincronizada** | ADRs obligatorios para decisiones de >3 días de impacto; el PR que cambia arquitectura debe actualizar el ADR correspondiente |

---

## 8. Estrategia para incorporar futuros módulos

Cualquier módulo nuevo (p. ej., `portal-integration`, `mls`, `property-valuation`) sigue este protocolo:

### Checklist de creación de módulo

```
□ 1. Crear directorio bajo apps/api/src/modules/{nombre}/
□ 2. Diseñar el dominio primero: entidades, VOs, interfaces de repositorio
□ 3. Definir los Domain Events que emite (en domain/events/)
□ 4. Implementar use cases en application/ (un archivo por caso de uso)
□ 5. Implementar repositorios/providers en infrastructure/
□ 6. Crear el controller en presentation/ (solo delega a use cases)
□ 7. Registrar el módulo en app.module.ts
□ 8. Si comparte tipos con frontend → agregar a packages/shared-types
□ 9. Si necesita comunicarse con otro módulo → usar Domain Events (no import directo)
□ 10. Agregar tests: unit (use cases + dominio), integration (repositorio real), e2e (flujo completo)
□ 11. Actualizar el ADR si la decisión afecta arquitectura
□ 12. Ejecutar eslint-plugin-boundaries y madge --circular antes del PR
```

### Regla de extensión abierta (Open/Closed)

Los engines de conversión (Follow-Up, Recovery, Scoring) están diseñados para recibir **nuevas cadencias, umbrales o estrategias de scoring** sin modificar el core — solo agregando nuevas implementaciones del port correspondiente o nuevos pasos de cadencia. Esto se materializa en:
- `CadenceStep` como Value Object configurable por tenant (en el futuro, desde la UI).
- `AIProvider` como interface que acepta cualquier implementación futura.
- `InactivityThreshold` como VO configurable (30/60/90 días pueden volverse configuración por plan).

---

### Estado de la fase
✅ **FASE 5 completada.** Próxima: **FASE 6 — Modelo de base de datos** (entidades, relaciones, cardinalidad, decisiones de diseño de datos, índices y estrategia multi-tenant en el esquema).
