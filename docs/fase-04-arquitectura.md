# FASE 4 — Arquitectura del Sistema

> Documento de fundamentación técnica para **CLIENTRA**. Parte 4 de 13.
> CLIENTRA **no** es un CRM inmobiliario tradicional. Es una **Plataforma de Conversión y Recuperación de Leads Inmobiliarios**.
> Principio rector de toda decisión: *"¿Cómo ayuda esto a convertir más compradores?"*
> Fecha: junio 2026. **No contiene código** — solo arquitectura lista para producción.

---

## 0. Hipótesis arquitectónica

> Las corredoras no pierden ventas por falta de leads. Pierden ventas porque **responden tarde, olvidan seguimientos, no priorizan compradores reales, operan desde WhatsApp sin trazabilidad y no recuperan oportunidades frías.**

Por lo tanto, el **núcleo del sistema no es la entidad "Propiedad"** (como en un CRM tradicional), sino el **ciclo de vida del Lead**. La propiedad es un dato de soporte; el lead y su conversión son el dominio central.

**Jerarquía de optimización (en este orden):**
1. Speed-to-Lead · 2. Lead Recovery · 3. Seguimiento Automático · 4. Priorización Inteligente · 5. Conversión Comercial.

**Explícitamente NO se optimiza en el MVP:** publicación en portales, canje, MLS, marketplace.

---

## 1. Diagrama de arquitectura

### 1.1 Vista de alto nivel (C4 - Contexto y Contenedores)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            ACTORES EXTERNOS                                │
│  Comprador  ·  Corredor  ·  Admin Inmobiliario  ·  Super Admin             │
└───────────────┬─────────────────────────────────────┬──────────────────────┘
                │                                       │
        (WhatsApp, formularios,                  (navegador / móvil)
         Meta Ads, landings)                            │
                │                                       ▼
                │                          ┌────────────────────────────┐
                │                          │   FRONTEND (Next.js 15)     │
                │                          │   App Router · RSC · Shadcn │
                │                          │   React Query · Zustand     │
                │                          └─────────────┬──────────────┘
                │                                         │ HTTPS / REST + JWT
                ▼                                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                       BACKEND — MODULAR MONOLITH (NestJS)                    │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │  CROSS-CUTTING (capa transversal)                                  │     │
│   │  Auth/JWT · RBAC Guard · Tenant Context · Rate Limit · Audit ·     │     │
│   │  Global Error Filter · Logger · Validation Pipe (Zod/DTO)          │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│   ╔══════════════════ CONVERSION CORE (prioridad MVP) ════════════════╗     │
│   ║  Lead Intake → Lead Router → Lead Scoring → Follow-Up →           ║     │
│   ║  Lead Recovery   ·   WhatsApp CRM   ·   Visit Scheduling          ║     │
│   ╚════════════════════════════════════════════════════════════════════╝     │
│                                                                              │
│   ┌──────────── SUPPORTING MODULES ────────────┐  ┌──── PLATFORM ────┐      │
│   │  Property · Activity/Timeline · Dashboard   │  │ Tenant · Billing │      │
│   └─────────────────────────────────────────────┘  └──────────────────┘      │
│                                                                              │
│   ┌──────────── AI LAYER (desacoplada por interfaz) ──────────────────┐     │
│   │  AIProvider Interface ← OpenAIProvider | AnthropicProvider(futuro) │     │
│   └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│   ┌──────────── ASYNC WORKER (in-process scheduler/queue) ────────────┐     │
│   │  Cron jobs (recovery sweep) · Follow-up cadence runner · Retry     │     │
│   └────────────────────────────────────────────────────────────────────┘     │
└───────────────┬───────────────────────────────┬────────────────────┬─────────┘
                │                                │                    │
                ▼                                ▼                    ▼
        ┌───────────────┐              ┌──────────────────┐  ┌────────────────┐
        │ PostgreSQL     │              │  Servicios ext.  │  │  Redis (cache  │
        │ (Prisma ORM)   │              │  WhatsApp Cloud  │  │  + cola async) │
        │ Row-level      │              │  Google Calendar │  └────────────────┘
        │ tenant scoping │              │  Stripe · Resend │
        └───────────────┘              │  OpenAI          │
                                        └──────────────────┘
```

### 1.2 Clean Architecture — capas dentro de cada módulo

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION   Controllers · DTOs · Guards · Validation      │  ← NestJS
│       │  (depende de ↓)                                       │
│  APPLICATION    Use Cases / Services · Ports (interfaces)     │  ← lógica de orquestación
│       │  (depende de ↓)                                       │
│  DOMAIN         Entities · Value Objects · Domain Rules ·     │  ← núcleo, sin deps externas
│                 Repository Interfaces · Domain Events         │
│       ▲  (la infraestructura depende de ↑, no al revés)       │
│  INFRASTRUCTURE Prisma Repositories · AIProvider impl ·       │  ← detalles reemplazables
│                 WhatsApp/Calendar/Stripe adapters             │
└─────────────────────────────────────────────────────────────┘
        Regla de dependencia: las flechas apuntan SIEMPRE hacia el dominio.
```

> **El dominio no conoce Prisma, ni OpenAI, ni WhatsApp.** Solo conoce interfaces (`LeadRepository`, `AIProvider`, `MessagingProvider`). Las implementaciones concretas viven en infraestructura y se inyectan vía DI. Esto cumple **Dependency Inversion (SOLID-D)** y hace cada detalle externo reemplazable sin tocar la lógica de negocio.

---

## 2. Justificación de cada decisión arquitectónica

| Decisión | Justificación | Trade-off aceptado |
|----------|---------------|--------------------|
| **Modular Monolith** (no microservicios) | Un equipo pequeño no puede operar N servicios. Despliegue, transacciones y debugging simples. La modularidad da los límites lógicos sin el costo operativo distribuido. | Escala vertical primero; extracción a servicios diferida hasta que el dominio lo exija |
| **Clean Architecture** | El dominio (ciclo del lead) es el activo de mayor valor y debe sobrevivir a cambios de framework, proveedor de IA o canal de mensajería. Aislarlo lo protege. | Más boilerplate (interfaces + mappers) que un CRUD directo |
| **Repository Pattern** | Desacopla el dominio de Prisma. Permite testear use cases con repos en memoria y cambiar el ORM sin reescribir negocio. | Capa de mapeo entidad↔modelo Prisma |
| **Service Layer + Use Cases** | Cada acción de negocio ("calificar lead", "asignar lead") es un caso de uso explícito, testeable y con una sola responsabilidad (SRP). | — |
| **DTO + Zod/class-validator** | Contrato explícito y validado en el borde; el dominio nunca recibe datos crudos. Frontend y backend comparten esquemas Zod. | — |
| **DI nativa de NestJS** | Inyección de puertos por token; facilita mocks y el swap OpenAI→Anthropic sin tocar consumidores. | — |
| **AI Layer por interfaz** | Requisito explícito: `AIProvider` abstrae el proveedor. El scoring/clasificación son negocio; el LLM es un detalle. | Capa de traducción de prompts por proveedor |
| **Worker async in-process (BullMQ/Redis)** | Follow-Up y Recovery son intrínsecamente **temporales** (Día 1, 3, 7, 14; 30/60/90 días). Requieren scheduler + colas con reintentos. Se mantiene **dentro del monolito** (no Kafka/RabbitMQ, como exige el prompt) usando Redis como backend de cola. | Redis como dependencia adicional (ya útil para cache) |
| **PostgreSQL + Prisma** | Relacional encaja con el dominio (lead↔propiedad↔actividad↔corredor). Prisma da type-safety end-to-end con TS. Soporta JSONB para payloads heterogéneos de intake. | — |
| **Multi-tenant por discriminador (shared DB, `tenantId`)** | Aislamiento lógico con costo operativo mínimo para arrancar; escalable a schema-per-tenant si un cliente enterprise lo exige. | Disciplina estricta de scoping (mitigada con middleware + Prisma extension) |

**Decisiones descartadas explícitamente** (detalle en §9): Microservicios, Kafka/RabbitMQ, Event Sourcing, CQRS, GraphQL.

---

## 3. Mapa de módulos

### 3.1 Conversion Core (prioridad absoluta del MVP)

| Módulo | Responsabilidad | Pregunta de conversión que responde |
|--------|-----------------|--------------------------------------|
| **Lead Intake Engine** | Capturar leads de WhatsApp, landings, Meta Ads, formularios; normalizar a un modelo único; deduplicar | "No perder ningún lead" |
| **Lead Router Engine** | Asignar automáticamente por comuna, tipo de propiedad, disponibilidad y carga del corredor | "Reducir el tiempo de respuesta" |
| **Lead Scoring Engine** | Priorizar por presupuesto, pie, crédito aprobado, interés y urgencia (IA financiera-aware) | "Trabajar primero el lead más valioso" |
| **Follow-Up Engine** | Ejecutar cadencias automáticas (Día 1/3/7/14) por estado del lead | "Eliminar el seguimiento manual" |
| **Lead Recovery Engine** | Detectar leads fríos (30/60/90 días) y disparar reactivación | "Recuperar oportunidades perdidas" |
| **WhatsApp CRM** | Centralizar conversaciones, vincular chat↔lead, autorespuestas, plantillas | "Que la cartera no quede en teléfonos personales" |
| **Visit Scheduling Engine** | Agendar visitas, recordatorios, sync con Google Calendar | "Avanzar el lead hacia el cierre" |

### 3.2 Supporting modules

| Módulo | Responsabilidad |
|--------|-----------------|
| **Property** | CRUD esencial, asignación a corredor, estado. *(NO MLS/canje/publicación masiva)* |
| **Activity / Timeline** | Historial unificado de toda interacción (llamada, WhatsApp, correo, visita) — trazabilidad |
| **Dashboard** | KPIs centro del producto: TTFR, leads capturados, recuperados, conversión, actividad por corredor |

### 3.3 Platform & cross-cutting

| Módulo | Responsabilidad |
|--------|-----------------|
| **Tenant** | Modelo de inmobiliaria, contexto y aislamiento |
| **Auth & RBAC** | JWT + refresh, roles (Super Admin / Admin Inmobiliario / Corredor), permisos |
| **Billing** | Stripe: planes STARTER/PROFESSIONAL/ENTERPRISE, suscripciones *(post-core)* |
| **AI Layer** | `AIProvider` y sus implementaciones |
| **Audit / Logging / Security** | Auditoría, rate limiting, OWASP, error handling global |

---

## 4. Dependencias entre módulos

```
                         ┌─────────────────┐
   (entrada externa) ───▶│  Lead Intake    │
                         └────────┬────────┘
                                  │ crea Lead (estado: NUEVO)
                                  ▼
                         ┌─────────────────┐      consulta carga/comuna
                         │  Lead Router    │◀───────────────┐
                         └────────┬────────┘                │
                                  │ asigna corredor         │
                                  ▼                    ┌─────────────┐
                         ┌─────────────────┐           │  Property   │
                         │  Lead Scoring   │──────────▶│  (tipo/comuna)
                         └────────┬────────┘  usa IA   └─────────────┘
                                  │ score + prioridad        ▲
                                  ▼                          │
        ┌──────────────┐  dispara cadencia ┌─────────────────┴───┐
        │  Follow-Up   │◀─────────────────▶│   WhatsApp CRM      │
        │  Engine      │   envía mensajes  │   (MessagingProvider)│
        └──────┬───────┘                   └─────────────────────┘
               │ si no hay respuesta N días        │
               ▼                                    │ toda interacción
        ┌──────────────┐                            ▼
        │ Lead Recovery│              ┌──────────────────────────┐
        │ Engine       │─────────────▶│  Activity / Timeline     │
        └──────────────┘   reactiva   │  (registra TODO)         │
                                       └────────────┬─────────────┘
        ┌──────────────┐                            │ alimenta
        │ Visit Sched. │───────────────────────────▶│
        └──────────────┘                            ▼
                                       ┌──────────────────────────┐
                                       │  Dashboard (KPIs)        │
                                       └──────────────────────────┘

  AI Layer  ────(inyectado en)───▶  Lead Scoring, Follow-Up (sugerencias), WhatsApp (autorespuesta)
  Tenant Context ──(envuelve)──▶  TODOS los módulos
```

**Reglas de acoplamiento:**
- Los módulos se comunican vía **interfaces de aplicación (ports)**, nunca importando repositorios de otro módulo directamente.
- Comunicación intra-monolito mediante **Domain Events in-process** (p. ej. `LeadCreated`, `LeadAssigned`, `LeadWentCold`) despachados por un event bus simple de NestJS — **sin** broker externo (no Kafka/RabbitMQ). Esto desacopla emisor de consumidores sin Event Sourcing ni CQRS.
- Dependencias **siempre hacia el dominio**; ningún módulo de soporte (Property, Dashboard) es dependencia *dura* del Conversion Core.

---

## 5. Flujo completo de un lead (end-to-end)

```
T+0s     Comprador escribe por WhatsApp / completa formulario / clic en Meta Ad
            │
            ▼
[INTAKE]  Lead Intake Engine recibe el webhook → normaliza → deduplica
          → crea Lead {estado: NUEVO, fuente, tenantId} → emite LeadCreated
            │
            ▼
[ROUTER]  Lead Router Engine escucha LeadCreated → evalúa reglas
          (comuna ∈ corredor, tipo propiedad, disponibilidad, carga)
          → asigna corredor → emite LeadAssigned
            │
            ├─────────────▶ [SPEED-TO-LEAD] Follow-Up dispara AUTORESPUESTA
            │               vía WhatsApp CRM en < 60s, 24/7
            │               (ataca: 78% compra con quien responde primero)
            ▼
[SCORING] Lead Scoring Engine → AIProvider.scoreLead()
          evalúa presupuesto, pie, crédito, urgencia, interés
          → asigna score (HOT/WARM/COLD) → notifica al corredor con prioridad
            │
            ▼
[FOLLOW]  Follow-Up Engine programa la cadencia según estado:
          Día 1: WhatsApp  →  Día 3: recordatorio  →  Día 7: seguimiento
          →  Día 14: reactivación. Cada paso se cancela si el lead avanza.
            │
            ├── Corredor interactúa → Activity/Timeline registra TODO
            ├── Lead avanza en pipeline (CONTACTADO→INTERESADO→VISITA→...)
            └── [VISIT] Visit Scheduling agenda visita + sync Google Calendar
                                                                    │
            (si el lead NO responde en X días)                      │
            ▼                                                       ▼
[RECOVERY] Worker async corre sweep diario → detecta leads          [DASHBOARD]
           fríos (30/60/90 días sin actividad) → emite LeadWentCold actualiza
           → Lead Recovery Engine dispara secuencia de reactivación KPIs en
           (mensaje distinto, oferta, nueva propiedad afín)         vivo
            │
            ▼
        Lead reactivado vuelve al pipeline  ·  o se marca PERDIDO con motivo
```

**Cada transición se audita y alimenta el Dashboard** (TTFR, tasa de recuperación, conversión por etapa).

---

## 6. Estrategia multi-tenant

**Modelo elegido: Shared Database + Shared Schema con discriminador `tenantId`** (row-level isolation).

| Componente | Diseño |
|-----------|--------|
| **Tenant model** | Entidad `Tenant` (inmobiliaria) raíz; toda entidad de negocio lleva `tenantId` (FK indexada, NOT NULL) |
| **Tenant context** | Resuelto desde el JWT (claim `tenantId`) en cada request; almacenado en un `AsyncLocalStorage` / request-scoped provider |
| **Tenant middleware** | Intercepta toda request autenticada, valida el tenant y lo inyecta en el contexto antes de los controllers |
| **Aislamiento en datos** | **Prisma Client Extension** que inyecta `where: { tenantId }` automáticamente en TODA query → defensa de profundidad: aunque un use case olvide filtrar, el ORM lo fuerza |
| **Aislamiento Super Admin** | Único rol con capacidad cross-tenant, gobernado por guard explícito y auditado |

**Por qué shared-schema y no schema/DB-per-tenant:** menor costo operativo y migraciones únicas para arrancar con cientos de tenants pequeños. La arquitectura permite **promover** un cliente enterprise a schema dedicado sin rediseño, porque el acceso ya pasa por el repositorio + contexto de tenant.

**Riesgo principal y mitigación:** *cross-tenant data leak*. Mitigado con triple barrera: (1) middleware, (2) extension de Prisma forzando el filtro, (3) tests automatizados de aislamiento por tenant en CI.

---

## 7. Estrategia de escalabilidad

**Filosofía: escalar lo que duele, cuando duele. No sobre-ingenierizar.**

| Etapa | Carga | Estrategia |
|-------|-------|-----------|
| **MVP** | Decenas de tenants | Monolito single-instance + Postgres + Redis. Docker Compose |
| **Crecimiento** | Cientos de tenants | API stateless → escalado horizontal tras load balancer; Postgres con read replicas; índices en `tenantId`+columnas de filtro |
| **Escala** | Miles de tenants | Separar el **Worker async** en su propio proceso (mismo código, distinto entrypoint); particionar tablas de alto volumen (Activity) por tenant/fecha; cache agresivo de scoring |
| **Enterprise** | Cliente con volumen extremo | Promoción a schema/DB dedicado para ese tenant; extracción del Conversion Core a servicio si la modularidad ya lo permite |

**Puntos de diseño que habilitan la escala sin reescritura:**
- API **stateless** (estado en JWT + Postgres/Redis) → escalado horizontal trivial.
- **Worker desacoplable**: la lógica de Follow-Up/Recovery vive en use cases; separar el runner es cambiar el entrypoint, no la lógica.
- **AIProvider** abstrae costo/latencia del LLM → se puede cachear, batchear o cambiar de proveedor según volumen.
- **Idempotencia en Intake**: los webhooks externos (WhatsApp/Meta) se procesan idempotentemente (clave de deduplicación) para tolerar reintentos.

---

## 8. Riesgos técnicos

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|-----------|
| T1 | **Cross-tenant data leak** | Crítico | Triple barrera (middleware + Prisma extension + tests de aislamiento) |
| T2 | **WhatsApp Cloud API**: límites de rate, plantillas pre-aprobadas, ventana de 24h | Alto | Abstraer en `MessagingProvider`; cola con throttling; plantillas aprobadas para fuera de ventana |
| T3 | **Latencia/costo/caída del LLM** en scoring | Alto | `AIProvider` con timeout + fallback a scoring heurístico determinista; cache; degradación elegante |
| T4 | **Cadencias temporales poco confiables** (jobs perdidos) | Alto | BullMQ con persistencia en Redis, reintentos y dead-letter; jobs idempotentes |
| T5 | **Webhooks duplicados/desordenados** (Meta/WhatsApp) | Medio | Idempotencia por clave de evento; deduplicación en Intake |
| T6 | **Acoplamiento accidental entre módulos** al crecer | Medio | Domain events in-process + límites por interfaces; linters de arquitectura (deps prohibidas) |
| T7 | **Crecimiento de la tabla Activity/Timeline** | Medio | Índices, particionamiento futuro, archivado de actividad antigua |
| T8 | **Migraciones en multi-tenant compartido** | Medio | Migraciones Prisma versionadas + backward-compatible; despliegue blue/green |

---

## 9. Decisiones descartadas y por qué

| Descartado | Por qué se descartó | Qué usamos en su lugar |
|-----------|---------------------|------------------------|
| **Microservicios** | Costo operativo (despliegue, observabilidad, transacciones distribuidas) inviable para el equipo y la etapa; fragmentaría un dominio aún cohesivo | Modular Monolith con límites lógicos por módulo |
| **Kafka / RabbitMQ** | Broker externo = otra pieza de infra que operar y monitorear; el volumen del MVP no lo justifica | **Domain events in-process** (event bus de NestJS) + **BullMQ sobre Redis** para trabajo async/temporal |
| **Event Sourcing** | Complejidad de proyecciones y replays no justificada; el dominio no exige reconstrucción histórica del estado | Estado actual en tablas + **Activity/Timeline** como log de auditoría legible |
| **CQRS** | Separar modelos de lectura/escritura añade complejidad sin un problema de lectura/escritura divergente todavía | Service Layer único; optimización de lectura puntual vía índices/cache si surge |
| **GraphQL** | El cliente es propio y los contratos REST + DTO son suficientes; GraphQL añadiría capa de resolvers y N+1 a vigilar | **REST + DTO** versionado, esquemas Zod compartidos con el frontend |
| **Schema/DB-per-tenant desde el día 1** | Sobre-costo de migraciones y operación para tenants pequeños | Shared schema con `tenantId` + ruta de promoción a dedicado para enterprise |
| **Acoplar OpenAI directamente** | Vendor lock-in; impide cambiar de proveedor o degradar a heurística | `AIProvider` interface + implementaciones intercambiables |

---

## 10. Cómo esta arquitectura cumple el principio rector

| Engine | Componentes arquitectónicos que lo habilitan | KPI que mueve |
|--------|----------------------------------------------|---------------|
| **Speed-to-Lead** | Intake idempotente + Router automático + autorespuesta vía WhatsApp + worker en <60s | Tiempo de primera respuesta (TTFR) |
| **Lead Recovery** | Worker async + sweep diario + Domain event `LeadWentCold` + Recovery Engine | Leads recuperados |
| **Seguimiento Automático** | Follow-Up Engine + BullMQ cadencias + cancelación por avance de estado | % seguimientos cumplidos |
| **Priorización Inteligente** | Scoring Engine + AIProvider financiera-aware + fallback heurístico | Conversión de leads HOT |
| **Conversión Comercial** | Pipeline + Timeline + Visit Scheduling + Dashboard | Tasa de conversión por etapa |

> Todo módulo del MVP responde afirmativamente a *"¿cómo ayuda esto a convertir más compradores?"*. Property, Billing y cualquier funcionalidad de portales/canje/MLS quedan deliberadamente fuera del core y se difieren a versiones futuras.

---

### Estado de la fase
✅ **FASE 4 completada.** Próxima: **FASE 5 — Estructura de carpetas** (organización física del monorepo frontend + backend, convención por módulo siguiendo Clean Architecture, y ubicación de cada capa/puerto/adaptador).
