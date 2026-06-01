# FASE 6 — Modelo de Base de Datos

> Documento de diseño de datos para **CLIENTRA**. Parte 6 de 13.
> Sin Prisma Schema. Sin migraciones. Sin SQL. Solo modelo conceptual y lógico listo para producción.
> **Regla fundamental:** el centro del modelo NO es `Property`. El centro es `Lead`.

---

## 0. Principio rector del modelo

Toda entidad se justifica respondiendo *"¿cómo ayuda a convertir más compradores?"* a través de uno de los cinco vectores: **speed-to-lead, seguimiento, recuperación, priorización, conversión**. Si no contribuye, no está en el MVP.

```
                        ┌─────────────────┐
                        │      LEAD       │  ◀── entidad raíz del sistema
                        │  (aggregate root)│
                        └────────┬────────┘
        ┌───────────────┬────────┼────────┬────────────────┐
        ▼               ▼        ▼        ▼                ▼
   LeadScore     LeadAssignment Activity LeadFollowUp  Conversation
   (priorizar)   (speed-to-lead)(traza)  (seguimiento) (WhatsApp)
                                  │
                                  ▼
                            LeadRecovery (recuperación)
```

`Property`, `Visit`, `Subscription` orbitan al Lead; no son el núcleo.

---

## 1. Motor de base de datos: PostgreSQL

| Razón | Detalle |
|-------|---------|
| **Modelo relacional encaja con el dominio** | El ciclo del lead es intrínsecamente relacional (Lead↔Asignación↔Actividad↔Propiedad↔Corredor). Las garantías ACID son críticas: no se puede "perder" un lead por una escritura parcial |
| **Multi-tenant robusto** | Row-Level Security (RLS) nativo como cuarta barrera de aislamiento; `tenant_id` indexable; soporte de particionamiento por tenant a futuro |
| **Reporting potente** | Window functions, CTEs, agregaciones, materialized views para el Dashboard sin un data warehouse separado en etapas tempranas |
| **JSONB híbrido** | Payloads heterogéneos del Lead Intake (cada portal/canal envía formatos distintos) se guardan en JSONB sin perder la capacidad de indexar campos clave (GIN) |
| **Escalabilidad** | Read replicas, particionamiento declarativo (tablas grandes como `activity`, `message`), extensiones (`pg_trgm` para búsqueda, `pg_partman`) |
| **Ecosistema Prisma** | Type-safety end-to-end con TypeScript; soporte first-class de Prisma para PostgreSQL |
| **Costo** | Open source; sin licencias; disponible gestionado en todo proveedor cloud |

---

## 2. Estrategia multi-tenant: Shared Schema + `tenant_id`

| Opción | Aislamiento | Costo operativo | Escala a 100k tenants | Veredicto |
|--------|-------------|-----------------|----------------------|-----------|
| **A. Shared schema + tenant_id** | Lógico (RLS + app) | **Muy bajo** (1 migración para todos) | ✅ Con particionamiento | ✅ **ELEGIDA** |
| B. Schema por tenant | Medio | Alto (N schemas, N migraciones) | ❌ 100k schemas = inmanejable | Para enterprise puntual |
| C. Database por tenant | Máximo | Muy alto (N DBs, N backups, N conexiones) | ❌ Inviable | Solo compliance extremo |

### Justificación técnica y económica

- **Económica:** una corredora pequeña paga ~CLP 30–80k/mes (FASE 1). El costo marginal de infraestructura por tenant debe ser céntimos. La Opción C multiplicaría el costo de DBs gestionadas por el número de tenants → destruye el margen. La Opción A amortiza una sola instancia entre miles de tenants.
- **Técnica:** una única migración versionada aplica a todos. El onboarding de un tenant nuevo es un `INSERT`, no un aprovisionamiento de infraestructura → habilita **self-serve signup** (clave para el modelo SaaS de FASE 3).
- **Ruta de escape:** la arquitectura permite **promover** un cliente enterprise a schema/DB dedicado sin rediseño, porque todo acceso pasa por el Repository + Tenant Context (FASE 4/5).

### Las 4 barreras de aislamiento (defensa en profundidad)
1. **Tenant Middleware** — resuelve `tenant_id` desde el JWT.
2. **Prisma Client Extension** — inyecta `where: { tenantId }` en toda query.
3. **PostgreSQL RLS** — política a nivel de fila como red de seguridad de la base.
4. **Tests de aislamiento en CI** — verifican que el tenant A nunca vea datos del tenant B.

### Convención de modelo
- Toda tabla de negocio lleva `tenant_id UUID NOT NULL` (FK a `tenant`), **indexada y como primer campo de todo índice compuesto**.
- Excepción: tablas globales de plataforma (`plan`, `tenant`) y catálogos de sistema.

---

## 3. Clasificación de dominios (anti dumping-ground de `shared-types`)

> Disciplina solicitada explícitamente: clasificar cada modelo y definir qué puede compartirse.

### 3.1 CORE DOMAIN — el corazón de la conversión
Entidades cuya razón de existir es convertir/recuperar leads. **Su lógica vive solo en el backend.**

`Lead`, `LeadScore`, `LeadAssignment`, `LeadFollowUp`, `LeadRecovery`, `LeadActivity`, `LeadNote`, `LeadTag`, `Conversation`, `Message`, `Visit`.

### 3.2 SUPPORTING DOMAIN — habilitan el core
`Tenant`, `User`, `Property`, `PropertyImage`, `PropertyFeature`, `Subscription`, `Plan`, `Invoice`, `Notification`.

### 3.3 INFRASTRUCTURE DOMAIN — soporte técnico, no de negocio
`UserSession`, `AuditLog`, `MessageDelivery`, `NotificationDelivery`, `CalendarSync`, `UsageMetric`, `AIClassification`, `OutboxEvent`.

### 3.4 Qué SÍ y qué NO va a `packages/shared-types`

| ✅ SÍ compartir (enums estables + contratos públicos) | ❌ NUNCA compartir |
|------------------------------------------------------|---------------------|
| `LeadStatus`, `LeadSource`, `ScoreTier` (enums) | Entidades de dominio (`LeadEntity`) |
| `UserRole`, `PropertyType`, `PropertyStatus` (enums) | Modelos Prisma |
| `VisitStatus`, `PlanTier`, `ActivityType` (enums) | Lógica de negocio / domain services |
| DTOs de request/response de la API REST | Estructuras internas (VOs, repos) |
| Tipos de payload de webhooks públicos | Cualquier cosa con dependencia de NestJS/Prisma |

**Reglas para mantener la disciplina a futuro:**
1. **Regla del "doble consumidor real":** un tipo entra a `shared-types` solo si frontend Y backend lo consumen *hoy*, no "por si acaso".
2. **`shared-types` no importa nada** (cero dependencias). Si un tipo necesita importar lógica, no es un contrato — es dominio.
3. **Los DTOs se derivan de schemas Zod** ubicados en `shared-types`; el backend valida con ellos y el frontend infiere el tipo. Un contrato, una fuente.
4. **Review gate:** todo PR que agregue a `shared-types` requiere justificar el doble consumidor en la descripción.
5. **Enums vs. tablas catálogo:** los enums *estables y de dominio* (LeadStatus) viven en código compartido; los catálogos *editables por el negocio* (futuros tags personalizados) viven en tablas, no en `shared-types`.

---

## 4. Lista completa de entidades del MVP

| # | Entidad | Dominio | Clasificación |
|---|---------|---------|---------------|
| 1 | `Tenant` | Tenant | Supporting |
| 2 | `Plan` | Billing | Supporting |
| 3 | `Subscription` | Billing | Supporting |
| 4 | `Invoice` | Billing | Supporting |
| 5 | `Payment` | Billing | Supporting |
| 6 | `FeatureLimit` | Billing | Supporting |
| 7 | `UsageMetric` | Tenant | Infrastructure |
| 8 | `User` | Auth | Supporting |
| 9 | `Role` | Auth | Supporting |
| 10 | `Permission` | Auth | Supporting |
| 11 | `UserSession` | Auth | Infrastructure |
| 12 | `AuditLog` | Auth | Infrastructure |
| 13 | **`Lead`** | **Lead (CORE)** | **Core** |
| 14 | `LeadScore` | Lead | Core |
| 15 | `LeadAssignment` | Lead | Core |
| 16 | `LeadActivity` | Lead | Core |
| 17 | `LeadNote` | Lead | Core |
| 18 | `LeadTag` | Lead | Core |
| 19 | `LeadTagLink` | Lead | Core (join) |
| 20 | `LeadFollowUp` | Lead | Core |
| 21 | `LeadRecovery` | Lead | Core |
| 22 | `Property` | Property | Supporting |
| 23 | `PropertyImage` | Property | Supporting |
| 24 | `PropertyFeature` | Property | Supporting |
| 25 | `Conversation` | WhatsApp | Core |
| 26 | `Message` | WhatsApp | Core |
| 27 | `MessageTemplate` | WhatsApp | Supporting |
| 28 | `MessageDelivery` | WhatsApp | Infrastructure |
| 29 | `Visit` | Visit | Core |
| 30 | `VisitReminder` | Visit | Supporting |
| 31 | `CalendarSync` | Visit | Infrastructure |
| 32 | `LeadScoringResult` | AI | Infrastructure |
| 33 | `AIClassification` | AI | Infrastructure |
| 34 | `ConversationSummary` | AI | Infrastructure |
| 35 | `AIRecommendation` | AI | Infrastructure |
| 36 | `Notification` | Notification | Supporting |
| 37 | `NotificationTemplate` | Notification | Supporting |
| 38 | `NotificationDelivery` | Notification | Infrastructure |
| 39 | `OutboxEvent` | Shared | Infrastructure |

> **Nota sobre LeadStatus/LeadSource/ActivityType:** se modelan como **enums en código** (no tablas), porque son estables y de dominio. `LeadTimeline` no es una tabla: es una **vista/proyección** sobre `LeadActivity` + eventos (ver §13).

---

## 5. TENANT DOMAIN

### Entidades y atributos clave

**`Tenant`** (la inmobiliaria — raíz de aislamiento)
- `id`, `name`, `slug` (único, para subdominios), `rut` (RUT empresa CL), `status` (TRIAL|ACTIVE|SUSPENDED|CANCELLED), `timezone` (default America/Santiago), `created_at`, `updated_at`, `deleted_at` (soft).

**`Plan`** (catálogo global — sin `tenant_id`)
- `id`, `tier` (STARTER|PROFESSIONAL|ENTERPRISE), `name`, `price_clp`, `billing_period`, `is_active`.

**`Subscription`**
- `id`, `tenant_id`, `plan_id`, `status` (TRIALING|ACTIVE|PAST_DUE|CANCELLED), `stripe_subscription_id`, `current_period_start/end`, `trial_ends_at`, `cancelled_at`.

**`FeatureLimit`** (límites por plan — habilita upsell)
- `id`, `plan_id`, `feature_key` (MAX_USERS|MAX_LEADS_MONTH|AI_SCORING|WHATSAPP_ENABLED), `limit_value`, `is_unlimited`.

**`UsageMetric`** (consumo real por tenant — para enforcement y billing por uso futuro)
- `id`, `tenant_id`, `metric_key`, `value`, `period` (YYYY-MM), `recorded_at`.

### Relaciones
```
Plan (1) ──< (N) Subscription          [un plan, muchas suscripciones]
Plan (1) ──< (N) FeatureLimit          [un plan, muchos límites]
Tenant (1) ──── (1) Subscription        [un tenant, una suscripción activa]
Tenant (1) ──< (N) UsageMetric
```

### Responsabilidades
- `Tenant` es la raíz; su `id` es el `tenant_id` que aísla todo.
- `Plan` + `FeatureLimit` definen *qué puede hacer* el tenant → el guard de RBAC y los engines consultan los límites.
- `Subscription` es el espejo local del estado de Stripe (fuente de verdad para acceso).

---

## 6. AUTH DOMAIN

**`User`**
- `id`, `tenant_id`, `email` (único por tenant), `password_hash`, `first_name`, `last_name`, `phone`, `role_id`, `status` (ACTIVE|INVITED|SUSPENDED), `last_login_at`, `created_at`, `updated_at`, `deleted_at` (soft).

**`Role`** (RBAC)
- `id`, `tenant_id` (NULL para roles de sistema), `key` (SUPER_ADMIN|ADMIN|CORREDOR), `name`, `is_system`.

**`Permission`**
- `id`, `key` (LEAD_CREATE|LEAD_ASSIGN|DASHBOARD_VIEW_ALL|...), `description`.

**`RolePermission`** (join N:N)
- `role_id`, `permission_id`.

**`UserSession`** (refresh tokens / sesiones activas)
- `id`, `user_id`, `tenant_id`, `refresh_token_hash`, `ip`, `user_agent`, `expires_at`, `revoked_at`.

**`AuditLog`** (ver §12)
- `id`, `tenant_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before` (JSONB), `after` (JSONB), `ip`, `created_at`.

### Relaciones
```
Tenant (1) ──< (N) User
Role (1) ──< (N) User
Role (N) ──< RolePermission >── (N) Permission     [N:N]
User (1) ──< (N) UserSession
User (1) ──< (N) AuditLog (como actor)
```

> **Decisión:** Super Admin es el único rol con `tenant_id = NULL` y capacidad cross-tenant, gobernado por guard explícito y auditado en cada acción.

---

## 7. LEAD DOMAIN (CORE) — la entidad más importante

### `Lead` (aggregate root)

| Atributo | Tipo | Propósito de conversión |
|----------|------|-------------------------|
| `id` | UUID | — |
| `tenant_id` | UUID FK | Aislamiento |
| `first_name`, `last_name` | text | Identificación |
| `email`, `phone` | text | **Canales de contacto (phone = clave WhatsApp)** |
| `source` | enum LeadSource | WHATSAPP\|META_ADS\|INSTAGRAM\|LANDING\|WEB_FORM\|PORTAL — atribución |
| `status` | enum LeadStatus | NUEVO→CONTACTADO→INTERESADO→VISITA_AGENDADA→NEGOCIACION→RESERVA→VENTA_CERRADA\|PERDIDO |
| `lost_reason` | enum nullable | Por qué se perdió (análisis de fugas) |
| `interested_property_id` | UUID FK nullable | Propiedad de interés |
| `budget_amount` + `budget_currency` | decimal + enum | **Presupuesto (priorización)** |
| `down_payment` | decimal nullable | **Pie disponible (viabilidad financiera)** |
| `credit_status` | enum nullable | NONE\|PRE_APPROVED\|APPROVED — **señal de comprador real** |
| `subsidy_eligible` | bool nullable | **Elegibilidad subsidio al dividendo (diferenciador CL)** |
| `urgency` | enum nullable | LOW\|MEDIUM\|HIGH — urgencia declarada |
| `assigned_user_id` | UUID FK nullable | Corredor actual (desnormalizado para queries rápidas) |
| `current_score_tier` | enum nullable | HOT\|WARM\|COLD (desnormalizado del último LeadScore) |
| `first_response_at` | timestamp nullable | **⏱ Speed-to-lead: el dato más crítico del sistema** |
| `last_activity_at` | timestamp | **Base de la detección de leads fríos (Recovery)** |
| `raw_payload` | JSONB | Datos crudos heterogéneos del intake |
| `created_at`, `updated_at`, `deleted_at` | timestamp | Auditoría + soft delete |

> **`first_response_at` y `last_activity_at` son los dos campos más estratégicos del modelo:** habilitan el KPI north-star (TTFR) y el motor de Recovery respectivamente. Se desnormalizan a propósito en `Lead` para evitar agregaciones costosas en cada lectura del Dashboard.

### Entidades satélite del Lead

**`LeadScore`** (histórico de puntuación — no se sobrescribe)
- `id`, `tenant_id`, `lead_id`, `score_value` (0–100), `tier` (HOT|WARM|COLD), `reasons` (JSONB: factores), `source` (AI|HEURISTIC), `scored_at`.
- *El "actual" se desnormaliza en `Lead.current_score_tier`; el histórico permite ver la evolución.*

**`LeadAssignment`** (histórico de asignaciones — speed-to-lead + trazabilidad)
- `id`, `tenant_id`, `lead_id`, `user_id`, `assigned_by` (SYSTEM|MANUAL), `reason` (JSONB: comuna/carga), `assigned_at`, `unassigned_at` (nullable).

**`LeadActivity`** (toda interacción — base del timeline)
- `id`, `tenant_id`, `lead_id`, `user_id` (autor), `type` (enum ActivityType: LLAMADA|WHATSAPP|EMAIL|REUNION|VISITA|NOTA|STATUS_CHANGE|SYSTEM), `summary`, `metadata` (JSONB), `occurred_at`, `created_at`.

**`LeadNote`** (notas libres del corredor)
- `id`, `tenant_id`, `lead_id`, `user_id`, `body`, `created_at`, `updated_at`, `deleted_at` (soft).

**`LeadTag`** + **`LeadTagLink`** (etiquetado flexible, editable por tenant)
- `LeadTag`: `id`, `tenant_id`, `name`, `color`.
- `LeadTagLink`: `lead_id`, `tag_id` (join N:N).

**`LeadFollowUp`** (cadencia programada — seguimiento automático)
- `id`, `tenant_id`, `lead_id`, `sequence_step` (int), `channel` (WHATSAPP|EMAIL), `scheduled_at`, `executed_at` (nullable), `status` (PENDING|SENT|CANCELLED|FAILED), `cancel_reason` (nullable, p.ej. LEAD_ADVANCED).

**`LeadRecovery`** (intentos de recuperación — first-mover del mercado)
- `id`, `tenant_id`, `lead_id`, `inactivity_threshold` (DAYS_30|DAYS_60|DAYS_90), `detected_at`, `recovery_action` (JSONB), `outcome` (PENDING|REACTIVATED|NO_RESPONSE|LOST), `resolved_at` (nullable).

### Cardinalidades del Lead Domain
```
Tenant (1) ──< (N) Lead
Lead (1) ──< (N) LeadScore          [histórico de scores]
Lead (1) ──< (N) LeadAssignment     [histórico de asignaciones]
Lead (1) ──< (N) LeadActivity       [timeline]
Lead (1) ──< (N) LeadNote
Lead (N) ──< LeadTagLink >── (N) LeadTag
Lead (1) ──< (N) LeadFollowUp       [pasos de cadencia]
Lead (1) ──< (N) LeadRecovery       [intentos de recuperación]
Lead (N) ──> (1) User (assigned)    [corredor actual]
Lead (N) ──> (1) Property (interested, nullable)
Lead (1) ──< (N) Conversation       [WhatsApp]
Lead (1) ──< (N) Visit
```

**Ownership:** el `Lead` es dueño de su ciclo de vida; todas las satélites tienen FK obligatoria a `lead_id` y `tenant_id`. Borrar un Lead (hard, excepcional) cascadea a sus satélites; en la práctica se usa **soft delete** (ver §11).

---

## 8. PROPERTY DOMAIN (solo MVP)

**`Property`**
- `id`, `tenant_id`, `internal_code` (único por tenant), `type` (enum PropertyType: DEPTO|CASA|OFICINA|TERRENO|LOCAL|BODEGA), `status` (enum: ACTIVA|RESERVADA|VENDIDA|INACTIVA), `address`, `region`, `commune` (comuna), `price_amount` + `price_currency` (UF|CLP), `area_built_m2`, `area_total_m2`, `bedrooms`, `bathrooms`, `description`, `assigned_user_id` (FK nullable), `created_at`, `updated_at`, `deleted_at` (soft).

**`PropertyImage`**
- `id`, `tenant_id`, `property_id`, `url`, `order`, `is_cover`.

**`PropertyFeature`** (catálogo flexible: estacionamiento, bodega, etc.)
- `id`, `tenant_id`, `property_id`, `key`, `value`.

```
Tenant (1) ──< (N) Property
Property (1) ──< (N) PropertyImage
Property (1) ──< (N) PropertyFeature
Property (1) ──< (N) Lead (interested_property_id)
User (1) ──< (N) Property (assigned)
```

> **Explícitamente fuera:** MLS, canje, publicación a portales, marketplace (FASE 1/4 lo difieren). Property es soporte, no core.

---

## 9. WHATSAPP DOMAIN (Core)

**`Conversation`** (hilo con un contacto)
- `id`, `tenant_id`, `lead_id` (FK nullable — puede llegar antes de crear el lead), `wa_contact_phone`, `assigned_user_id`, `status` (OPEN|SNOOZED|CLOSED), `last_message_at`, `window_expires_at` (ventana 24h de WhatsApp), `created_at`.

**`Message`**
- `id`, `tenant_id`, `conversation_id`, `direction` (INBOUND|OUTBOUND), `wa_message_id`, `type` (TEXT|TEMPLATE|IMAGE|DOCUMENT), `body`, `template_id` (nullable), `sent_by_user_id` (nullable, NULL si automático), `metadata` (JSONB), `created_at`.

**`MessageTemplate`** (plantillas pre-aprobadas — autorespuesta fuera de ventana 24h)
- `id`, `tenant_id`, `name`, `wa_template_name`, `category`, `body`, `variables` (JSONB), `status` (APPROVED|PENDING|REJECTED).

**`MessageDelivery`** (estado de entrega — infraestructura)
- `id`, `tenant_id`, `message_id`, `status` (QUEUED|SENT|DELIVERED|READ|FAILED), `error` (nullable), `updated_at`.

```
Lead (1) ──< (N) Conversation
Conversation (1) ──< (N) Message
Message (1) ──── (1) MessageDelivery
Message (N) ──> (1) MessageTemplate (nullable)
User (1) ──< (N) Message (sent_by, nullable)
Tenant (1) ──< (N) Conversation / Message / MessageTemplate
```

> **Decisión clave:** `Conversation.lead_id` es nullable porque un mensaje de WhatsApp puede llegar **antes** de que exista el Lead. El Lead Intake Engine crea el Lead y vincula la conversación (`link-conversation-to-lead.use-case`). Esto preserva el principio "no perder ningún lead".

---

## 10. VISIT, AI, BILLING, NOTIFICATION DOMAINS

### Visit Domain (Core)
**`Visit`** — `id`, `tenant_id`, `lead_id`, `property_id`, `user_id` (corredor), `scheduled_at`, `status` (enum VisitStatus: SCHEDULED|CONFIRMED|COMPLETED|CANCELLED|NO_SHOW), `notes`, `created_at`, `updated_at`.
**`VisitReminder`** — `id`, `tenant_id`, `visit_id`, `channel`, `send_at`, `sent_at`, `status`.
**`CalendarSync`** (infra) — `id`, `tenant_id`, `visit_id`, `provider` (GOOGLE), `external_event_id`, `sync_status`, `last_synced_at`.
```
Lead (1) ──< (N) Visit ; Property (1) ──< (N) Visit ; User (1) ──< (N) Visit
Visit (1) ──< (N) VisitReminder ; Visit (1) ──── (1) CalendarSync
```

### AI Domain (Infrastructure — guardar solo lo necesario)
**`LeadScoringResult`** — `id`, `tenant_id`, `lead_id`, `provider` (OPENAI|ANTHROPIC|HEURISTIC), `model`, `raw_output` (JSONB), `latency_ms`, `created_at`.
**`AIClassification`** — `id`, `tenant_id`, `lead_id` (o `conversation_id`), `classification_type` (INTENT|SENTIMENT), `result`, `confidence`, `created_at`.
**`ConversationSummary`** — `id`, `tenant_id`, `conversation_id`, `summary`, `model`, `created_at`.
**`AIRecommendation`** — `id`, `tenant_id`, `lead_id`, `type` (NEXT_ACTION|SUGGESTED_REPLY), `content`, `accepted` (bool nullable), `created_at`.

> **Disciplina:** la IA **no es fuente de verdad**; sus salidas se cachean para auditoría y para no re-pagar al LLM. El score "vigente" vive en `Lead.current_score_tier` + `LeadScore`, no en las tablas de AI. Se evita 1 tabla por cada micro-función: 4 tablas cubren scoring, clasificación, resumen y recomendación.

### Billing Domain (Supporting)
**`Invoice`** — `id`, `tenant_id`, `subscription_id`, `stripe_invoice_id`, `amount`, `currency`, `status` (DRAFT|OPEN|PAID|VOID), `period_start/end`, `issued_at`, `paid_at`.
**`Payment`** — `id`, `tenant_id`, `invoice_id`, `stripe_payment_id`, `amount`, `status` (SUCCEEDED|FAILED|REFUNDED), `paid_at`.
```
Subscription (1) ──< (N) Invoice ──< (N) Payment
```
> Stripe es la fuente de verdad; estas tablas son el espejo local para acceso rápido y reporting sin llamar a la API.

### Notification Domain (Supporting/Infra)
**`Notification`** — `id`, `tenant_id`, `user_id`, `type`, `title`, `body`, `read_at`, `created_at`.
**`NotificationTemplate`** — `id`, `tenant_id` (nullable=sistema), `key`, `channel`, `subject`, `body`.
**`NotificationDelivery`** (infra) — `id`, `tenant_id`, `notification_id`, `channel` (IN_APP|EMAIL|PUSH), `status`, `provider_id`, `sent_at`.

---

## 11. Estrategia de Soft Delete vs Hard Delete

| Tabla | Estrategia | Justificación |
|-------|-----------|---------------|
| `Lead`, `LeadNote`, `User`, `Property`, `Tenant` | **Soft delete** (`deleted_at`) | **Nunca** se destruye un lead: un lead "borrado" puede ser materia de recuperación o de disputa. Trazabilidad legal/comercial |
| `LeadActivity`, `LeadScore`, `LeadAssignment`, `AuditLog` | **Hard delete prohibido (append-only)** | Son el registro histórico inmutable. No se editan ni borran; reconstruyen la verdad |
| `Conversation`, `Message`, `Invoice`, `Payment` | **Append-only / sin delete** | Registro legal y de comunicación; jamás se elimina |
| `LeadFollowUp`, `LeadRecovery`, `Visit` | **Soft delete / estado CANCELLED** | Se cancelan, no se borran (preservan el "por qué") |
| `UserSession`, `MessageDelivery`, `NotificationDelivery`, `CalendarSync` | **Hard delete permitido** (con TTL/archivado) | Infraestructura efímera; sesiones expiradas y deliveries antiguos se purgan por job |
| `LeadTagLink`, `RolePermission` | **Hard delete** | Joins puros; quitar la relación es la operación natural |

> **Regla global:** el filtro `deleted_at IS NULL` se aplica por defecto vía Prisma Extension (igual que `tenant_id`), de modo que las queries normales nunca ven registros soft-deleted sin pedirlo explícitamente.

---

## 12. Estrategia de auditoría

Responde a las tres preguntas planteadas:

### ¿Cómo sabremos quién hizo qué?
- **`AuditLog`** captura `actor_user_id`, `action`, `entity_type`, `entity_id`, `before`/`after` (JSONB) en toda mutación sensible, vía el `AuditInterceptor` (FASE 5). Inmutable y append-only.

### ¿Cómo reconstruimos una venta?
- El **timeline del Lead** (`LeadActivity`, append-only) + `LeadAssignment` (quién lo trabajó y cuándo) + `LeadScore` (cómo evolucionó la prioridad) + `Conversation`/`Message` (qué se conversó) + `Visit` (qué se mostró) reconstruyen el camino completo de NUEVO → VENTA_CERRADA.

### ¿Cómo investigamos una pérdida de lead?
- `Lead.lost_reason` + `Lead.first_response_at` (¿se respondió a tiempo?) + `LeadFollowUp` (¿se ejecutó la cadencia o falló?) + `LeadRecovery` (¿se intentó recuperar?) + `AuditLog` (¿alguien lo reasignó/ignoró?). **Se puede demostrar exactamente en qué paso se cayó la venta** — esto es producto, no solo compliance: alimenta la mejora del propio sistema.

---

## 13. Estrategia de reporting (sin complejidad prematura)

| Qué | Cómo | Por qué |
|-----|------|---------|
| **TTFR (tiempo primera respuesta)** | Calculado: `first_response_at - created_at`, agregado | Campo desnormalizado en `Lead` → query barata |
| **Conversión por etapa** | Agregación sobre `Lead.status` + transiciones en `LeadActivity` | Sin tabla extra |
| **Leads recuperados** | Count de `LeadRecovery.outcome = REACTIVATED` | Tabla ya existe para el engine |
| **Rendimiento por corredor** | Agregación de `Lead`/`Visit`/`LeadActivity` por `assigned_user_id` | Índices en `assigned_user_id` |
| **Dashboard en tiempo (near-real)** | **Materialized Views** refrescadas por job (cada N min) para métricas pesadas por tenant | Evita recalcular en cada carga; no introduce data warehouse |

**Principio:** **calcular, no almacenar**, mientras el volumen lo permita. Solo se materializa (vista materializada) cuando una métrica se vuelve costosa. **No** se crean tablas de agregados redundantes en el MVP → se evita el riesgo de desincronización. `LeadTimeline` y `TimelineEvent` **no son tablas**: son proyecciones de lectura sobre `LeadActivity` + eventos del outbox.

---

## 14. Estrategia de índices

> Prioridad declarada: speed-to-lead, búsqueda de leads, seguimiento, dashboards. **Todo índice compuesto empieza por `tenant_id`.**

### Índices críticos (speed-to-lead y operación)
| Índice | Tabla | Propósito |
|--------|-------|-----------|
| `(tenant_id, status, created_at)` | `Lead` | Bandeja de leads nuevos sin asignar; el más caliente |
| `(tenant_id, assigned_user_id, status)` | `Lead` | "Mis leads" del corredor por estado |
| `(tenant_id, current_score_tier, last_activity_at)` | `Lead` | Priorización: trabajar HOT primero |
| `(tenant_id, last_activity_at)` | `Lead` | **Sweep de Recovery: detectar fríos (30/60/90d)** |
| `(tenant_id, phone)` y `(tenant_id, email)` | `Lead` | **Deduplicación en Intake (speed-to-lead)** |

### Índices de seguimiento y async
| Índice | Tabla | Propósito |
|--------|-------|-----------|
| `(status, scheduled_at)` | `LeadFollowUp` | Runner de cadencias: próximos pasos a ejecutar |
| `(tenant_id, lead_id, occurred_at)` | `LeadActivity` | Timeline de un lead, orden cronológico |
| `(tenant_id, lead_id)` | `Conversation` | Conversaciones de un lead |
| `(conversation_id, created_at)` | `Message` | Hilo de mensajes ordenado |
| `(window_expires_at)` | `Conversation` | Detectar ventanas 24h por vencer |

### Índices de búsqueda
| Índice | Tabla | Propósito |
|--------|-------|-----------|
| GIN `pg_trgm` en `(first_name, last_name, email, phone)` | `Lead` | Búsqueda difusa de leads |
| GIN en `raw_payload` | `Lead` | Filtrar por campos arbitrarios del intake |
| `(tenant_id, commune, type, status)` | `Property` | Filtro de propiedades + routing por comuna |

### Índices de reporting
| Índice | Tabla | Propósito |
|--------|-------|-----------|
| `(tenant_id, created_at)` | `Lead` | Series temporales de captación |
| `(tenant_id, assigned_user_id, created_at)` | `Visit`, `LeadActivity` | Rendimiento por corredor en el tiempo |
| `(tenant_id, entity_type, created_at)` | `AuditLog` | Investigación de auditoría |

---

## 15. Escalabilidad: 100 → 100.000 tenants

| Escala | Volumen aprox. | Qué pasa | Estrategia |
|--------|----------------|----------|-----------|
| **100 tenants** | ~1M leads, ~10M actividades | Índices en RAM, queries <10ms | Single Postgres; índices de §14 bastan |
| **1.000 tenants** | ~10M leads, ~100M actividades | `LeadActivity`/`Message` crecen; lecturas de dashboard pesan | Read replica para reporting; materialized views; connection pooling (PgBouncer) |
| **10.000 tenants** | ~100M leads, ~1B+ actividades | Tablas append-only enormes; un índice global se degrada | **Particionamiento declarativo** de `LeadActivity`, `Message`, `AuditLog` por rango de fecha (+ hash de tenant); archivado de actividad antigua a almacenamiento frío |
| **100.000 tenants** | Multimillonario | Una sola instancia no escala vertical | **Sharding por tenant** (grupos de tenants en clusters distintos, ruteados por `tenant_id`); tenants enterprise promovidos a DB dedicada; el Tenant Context ya enruta, así que no hay rediseño de aplicación |

**Qué se mantiene constante:** el `tenant_id` como primer campo de índice y de partición hace que el crecimiento sea horizontal y predecible. La aplicación nunca asume una sola base.

---

## 16. Riesgos y mitigaciones

| # | Riesgo | Tipo | Mitigación |
|---|--------|------|-----------|
| D1 | **Fuga cross-tenant** | Multi-tenant | 4 barreras: middleware + Prisma extension + RLS + tests CI |
| D2 | **`LeadActivity`/`Message` se vuelven cuellos de botella** | Performance | Append-only + particionamiento por fecha + archivado; índices acotados por tenant |
| D3 | **Desnormalización (`first_response_at`, `current_score_tier`) se desincroniza** | Diseño | Solo el use case dueño actualiza el campo; tests; el histórico (`LeadScore`) permite reconstruir |
| D4 | **N+1 en timeline/dashboard** | Performance | Queries explícitas en `infrastructure/queries/`; materialized views; `include` controlado en Prisma |
| D5 | **JSONB sin disciplina → datos no consultables** | Diseño | JSONB solo para payload crudo del intake; los campos de negocio son columnas tipadas |
| D6 | **Materialized views obsoletas en el dashboard** | Reporting | Refresh job con timestamp visible ("datos al HH:MM"); métricas críticas (TTFR) se calculan en vivo |
| D7 | **Soft delete acumulando basura** | Performance | Job de archivado de registros soft-deleted con antigüedad > N meses |
| D8 | **Enum estable que el negocio quiere personalizar** | Diseño | LeadStatus/Source quedan como enum; lo personalizable (Tags) ya es tabla — frontera clara |
| D9 | **Borrado en cascada accidental destruye historia** | Diseño | Cascadas prohibidas hacia tablas append-only (ver §17); soft delete por defecto |

---

## 17. Cascadas: permitidas y prohibidas

| Relación | On Delete | Permitida/Prohibida |
|----------|-----------|---------------------|
| `Tenant` → todas sus entidades | RESTRICT (nunca hard-delete un tenant con datos) | Solo soft delete del tenant |
| `Lead` → `LeadNote`, `LeadTagLink`, `LeadFollowUp` | CASCADE (en hard delete excepcional) | ✅ Permitida |
| `Lead` → `LeadActivity`, `LeadScore`, `LeadAssignment` | **RESTRICT** | 🚫 **Prohibida** (append-only histórico) |
| `Lead` → `Conversation`/`Message` | **SET NULL** en `lead_id` | 🚫 Cascade prohibida (los mensajes son registro legal) |
| `Property` → `Lead.interested_property_id` | SET NULL | ✅ (un lead no se borra porque se borre la propiedad) |
| `Conversation` → `Message` | RESTRICT / append-only | 🚫 Prohibida |
| `Subscription` → `Invoice`/`Payment` | RESTRICT | 🚫 Prohibida (registro financiero) |
| `User` → `Lead` (assigned) | SET NULL | ✅ (reasignar, no borrar el lead) |
| `Visit` → `VisitReminder` | CASCADE | ✅ Permitida |

---

## 18. Resumen de entregables

1. ✅ **Lista completa de entidades** — §4 (39 entidades clasificadas)
2. ✅ **Relaciones completas** — §5–§10
3. ✅ **Cardinalidades** — por dominio en cada sección + §17
4. ✅ **Estrategia multi-tenant** — §2 (shared schema + tenant_id, 4 barreras)
5. ✅ **Estrategia de índices** — §14
6. ✅ **Estrategia de auditoría** — §12
7. ✅ **Estrategia de soft delete** — §11
8. ✅ **Estrategia de reporting** — §13 (calcular, no almacenar)
9. ✅ **Riesgos y mitigaciones** — §16, §17
10. ✅ **Clasificación Core / Supporting / Infrastructure** — §3, §4

---

### Estado de la fase
✅ **FASE 6 completada.** Próxima: **FASE 7 — Diagrama Entidad-Relación** (representación visual del modelo: ERD completo con entidades, atributos clave, cardinalidades y notación, derivado directamente de este modelo lógico).
