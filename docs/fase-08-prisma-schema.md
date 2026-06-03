# FASE 8 — Prisma Schema Profesional

> Documento de diseño para **CLIENTRA**. Parte 8 de 13.
> Traduce el modelo lógico (FASE 6) y el ERD (FASE 7) a un `schema.prisma` listo para producción.
> **Artefacto entregado:** [`apps/api/src/infrastructure/database/prisma/schema.prisma`](../apps/api/src/infrastructure/database/prisma/schema.prisma)
> Sin código de aplicación. Sin migraciones manuales. Sin lógica de negocio en Prisma.

---

## 1. Justificación general del diseño

| Principio | Cómo se materializa en el schema |
|-----------|----------------------------------|
| **Lead como aggregate root** | `Lead` es el modelo con más relaciones (15 back-relations). Concentra los campos estratégicos (`firstResponseAt`, `lastActivityAt`, scoring desnormalizado) |
| **Property como soporte** | `Property` no tiene score/cadencia/recovery/timeline. La relación `Lead → Property` es `interestedPropertyId` **opcional** con `onDelete: SetNull` |
| **Multi-tenant consistente** | Todo modelo de negocio lleva `tenantId @db.Uuid`; todo índice compuesto empieza por `tenantId` |
| **Prisma no es capa de negocio** | El schema solo describe estructura, relaciones e índices. Ninguna regla (scoring, cadencias) vive aquí — viven en los use cases (FASE 5) |
| **Append-only explícito** | `LeadActivity`, `LeadTimelineEvent`, `Message`, `AuditLog` documentados con `///` y protegidos con `onDelete: Restrict` |
| **Estabilidad y legibilidad** | Enums agrupados arriba, modelos por dominio, naming uniforme, `@map`/`@@map` en todo |

---

## 2. Convenciones del schema (definidas y respetadas)

| Aspecto | Regla | Ejemplo |
|---------|-------|---------|
| Nombre de modelo | PascalCase **singular** | `Lead`, `LeadActivity` |
| Nombre de tabla | snake_case **plural** vía `@@map` | `@@map("lead_activities")` |
| Nombre de campo | camelCase | `firstResponseAt` |
| Nombre de columna | snake_case vía `@map` | `@map("first_response_at")` |
| PK | `id String @id @default(uuid()) @db.Uuid` | uniforme en todos |
| Timestamps | `createdAt` / `updatedAt` (`@updatedAt`) | comunes |
| Soft delete | `deletedAt DateTime?` | en modelos con historial de negocio |
| FK de tenant | `tenantId String @map("tenant_id") @db.Uuid` | en todo modelo tenant-scoped |
| Enums | SCREAMING_SNAKE_CASE | `LeadStatus.VENTA_CERRADA` |
| Join N:N | modelo explícito con `@@id` compuesto | `LeadTagLink`, `RolePermission` |

> **Por qué `@map`/`@@map`:** la app usa camelCase idiomático de TS/Prisma; la base usa snake_case idiomático de PostgreSQL. La doble convención mantiene ambos mundos limpios sin fricción.

---

## 3. Explicación por modelo (resumen)

### Platform
- **`Tenant`** — raíz de aislamiento. `slug` único (subdominios). Soft delete. `onDelete: Restrict` desde Subscription (nunca se borra un tenant con datos).
- **`Plan`** — catálogo **global** (sin `tenantId`). `FeatureLimit` define límites por plan (habilita enforcement y upsell).
- **`Subscription`** — `@unique` en `tenantId` (un tenant, una suscripción). Espejo local de Stripe.
- **`Invoice` / `Payment`** — registro financiero, `onDelete: Restrict` (nunca se destruye).
- **`UsageMetric`** — consumo por período (`@@unique([tenantId, metricKey, period])`).

### Auth
- **`User`** — `tenantId` **nullable** (único caso justificado: `SUPER_ADMIN` global). `@@unique([tenantId, email])`: el mismo email puede existir en tenants distintos.
- **`Role` / `Permission` / `RolePermission`** — RBAC con N:N explícito. Roles de sistema tienen `tenantId = NULL`.
- **`UserSession`** — refresh tokens hasheados; hard delete permitido (efímero, con TTL en `expiresAt`).
- **`PasswordResetToken`** — `tokenHash` único; expira y se marca `usedAt`.

### Core Conversion
- **`Lead`** — explicado en §4.
- **`LeadScore`** — histórico de puntuación (no se sobrescribe); el "vigente" se desnormaliza en `Lead.currentScoreTier`.
- **`LeadAssignment`** — histórico de asignaciones (`onDelete: Restrict`); base de trazabilidad y speed-to-lead.
- **`LeadActivity`** — **append-only**; toda interacción rica.
- **`LeadNote`** — notas editables (soft delete).
- **`LeadTag` + `LeadTagLink`** — etiquetado flexible editable por tenant (catálogo en tabla, no enum).
- **`LeadFollowUp`** — pasos de cadencia; índice `[status, scheduledAt]` para el runner.
- **`LeadRecovery`** — intentos de recuperación; índice `[tenantId, outcome]`.
- **`LeadTimelineEvent`** — **append-only**; log de **eventos de dominio** (LeadCreated, LeadAssigned…) que alimenta el timeline visual. Se distingue de `LeadActivity`: éste registra *interacciones* (llamadas, mensajes); aquél registra *hitos del ciclo de vida*. Separarlos evita mezclar semánticas y permite un feed de timeline limpio.

### Communication
- **`Conversation`** — `leadId` **nullable** (el chat puede preceder al lead). `windowExpiresAt` modela la ventana de 24h de WhatsApp.
- **`Message`** — **append-only**; `waMessageId` único (idempotencia de webhooks).
- **`MessageDelivery`** — estado de entrega 1:1 con Message.
- **`MessageTemplate`** — plantillas pre-aprobadas para responder fuera de la ventana 24h.

### Visits
- **`Visit`** — conecta Lead + Property + User (corredor). `onDelete: Restrict` hacia Property/User.
- **`VisitReminder`** — índice `[status, sendAt]` para el job de recordatorios.
- **`CalendarSync`** — 1:1 con Visit; espejo del evento de Google Calendar.

### Property (soporte)
- **`Property`** — CRUD esencial. `@@unique([tenantId, internalCode])`. Índice `[tenantId, commune, type, status]` para filtro y routing por comuna.
- **`PropertyImage` / `PropertyFeature`** — cascada desde Property (sí permitida: son datos dependientes).

### AI (infraestructura)
- **`LeadScoringResult`, `AIClassification`, `ConversationSummary`, `AIRecommendation`** — cachean salidas del LLM para auditoría y para no re-pagar. **No son fuente de verdad**: el score vigente vive en `Lead`/`LeadScore`. Solo 4 tablas para 4 funciones — sin proliferación.

### Notifications & Audit
- **`Notification` / `NotificationTemplate` / `NotificationDelivery`** — centro de notificaciones multicanal.
- **`AuditLog`** — **append-only**; `tenantId` nullable para acciones cross-tenant del Super Admin; `before`/`after` en JSONB.

---

## 4. El modelo `Lead` en detalle

Concentra la inteligencia del producto:

| Grupo de campos | Propósito |
|-----------------|-----------|
| `firstResponseAt` | **★ Speed-to-lead** — alimenta el KPI north-star (TTFR) |
| `lastActivityAt` (default now) | **★ Recovery** — el sweep de leads fríos compara contra este campo |
| `budgetAmount`, `downPayment`, `creditStatus`, `subsidyEligible`, `urgency` | **Priorización financiera** — el diferenciador chileno (pie, dividendo, subsidio) |
| `currentScoreTier` | Desnormalización del último `LeadScore` para queries calientes sin join |
| `assignedUserId` | Corredor actual, desnormalizado para la bandeja "mis leads" |
| `interestedPropertyId` (nullable) | **Prueba de que Property es soporte:** un lead vive sin propiedad |
| `rawPayload` (JSONB) | Datos crudos heterogéneos del intake multicanal |
| `deletedAt` | Soft delete — un lead **nunca** se destruye |

---

## 5. Explicación de los enums

Se definieron **solo los necesarios** (sin enums innecesarios). Los pedidos explícitamente, más los de soporte estrictamente requeridos por el dominio:

| Enum | Razón |
|------|-------|
| `LeadStatus`, `LeadSource` | Ciclo de vida y atribución del lead (pedidos) |
| `LeadLostReason` | Análisis de fugas — *por qué* se perdió (auditoría de pérdidas) |
| `ScoreTier`, `ScoreSource`, `CreditStatus`, `UrgencyLevel` | Soportan el scoring financiera-aware |
| `ActivityType`, `TimelineEventType` | Tipan el timeline y las interacciones |
| `FollowUpChannel/Status`, `InactivityThreshold`, `RecoveryOutcome` | Engines de seguimiento y recuperación |
| `UserRole`, `UserStatus` | RBAC (pedido) |
| `TenantStatus`, `PlanTier`, `SubscriptionStatus`, `InvoiceStatus`, `PaymentStatus` | Plataforma y billing (pedidos) |
| `PropertyType`, `PropertyStatus`, `PriceCurrency` | Property (pedidos) + moneda UF/CLP |
| `VisitStatus`, `VisitReminderStatus`, `CalendarProvider` | Visitas (pedido) |
| `MessageDirection`, `MessageType`, `MessageStatus`, `MessageTemplateStatus`, `ConversationStatus` | WhatsApp CRM (pedidos) |
| `AIProviderType`, `ClassificationType`, `RecommendationType` | Capa IA desacoplada |
| `NotificationType`, `NotificationChannel`, `DeliveryStatus` | Notificaciones (pedido) |
| `AuditActionType` | Auditoría (pedido) |

> **Decisión sobre `PropertyType`/`PropertyStatus`:** el prompt los listó como *modelos* y como *enums*. Se modelan como **enums** (no tablas) porque son **estables y de dominio** — coherente con la disciplina de FASE 6 (catálogos editables → tablas; enums de dominio → código). Esto los hace candidatos limpios de `shared-types` sin arrastrar tablas.

---

## 6. Estrategia de índices (justificada)

| Índice | Modelo | Prioridad atacada |
|--------|--------|-------------------|
| `[tenantId, status, createdAt]` | Lead | **Bandeja de leads nuevos** |
| `[tenantId, assignedUserId, status]` | Lead | **"Mis leads" del corredor** |
| `[tenantId, currentScoreTier, lastActivityAt]` | Lead | **Priorización (HOT primero)** |
| `[tenantId, lastActivityAt]` | Lead | **Sweep de Recovery (fríos)** |
| `[tenantId, phone]` / `[tenantId, email]` | Lead | **Deduplicación en intake (speed-to-lead)** |
| `[tenantId, createdAt]` | Lead | Reporting / series temporales |
| `[status, scheduledAt]` | LeadFollowUp | **Runner de cadencias** |
| `[tenantId, leadId, occurredAt]` | LeadActivity | **Timeline cronológico** |
| `[tenantId, userId, occurredAt]` | LeadActivity | **Rendimiento por corredor** |
| `[conversationId, createdAt]` (vía `[tenantId, conversationId, createdAt]`) | Message | Hilo ordenado |
| `[windowExpiresAt]` | Conversation | Ventanas 24h por vencer |
| `[tenantId, commune, type, status]` | Property | Filtro + routing por comuna |
| `[tenantId, entityType, createdAt]` | AuditLog | Investigación de auditoría |

> **Búsqueda difusa (`pg_trgm`) e índices GIN sobre `raw_payload`** se aplican vía migración SQL custom en FASE 13 (Prisma no expresa GIN nativamente); aquí se dejan documentados.

---

## 7. Estrategia de relaciones (refleja la tesis del producto)

- **`Lead ↔ Property`** → `interestedPropertyId` opcional, `onDelete: SetNull`. **El lead nunca depende de la propiedad.**
- **`Lead ↔ Conversation`** → `leadId` nullable en Conversation: el chat puede llegar antes que el lead.
- **`Lead ↔ LeadActivity`** → `onDelete: Restrict`: la historia no se borra al borrar el lead (que además es soft delete).
- **`Tenant ↔ todo`** → cada modelo tenant-scoped referencia `Tenant`; cascada de borrado solo en las hojas dependientes, nunca en registros financieros/históricos.
- **`User ↔ Tenant`** → `Restrict` (no se borra un tenant con usuarios).
- **`User ↔ Role ↔ Permission`** → N:N vía `RolePermission`.

---

## 8. Estrategia multi-tenant en Prisma

1. **`tenantId` presente** en todo modelo de negocio, **siempre como primer campo** de los índices compuestos → todas las queries del tenant son *index-friendly*.
2. **Aislamiento en runtime (fuera del schema):** una **Prisma Client Extension** (FASE 5/13) inyecta `where: { tenantId }` y `deletedAt: null` en toda query → el schema define la estructura, la extensión fuerza el aislamiento.
3. **Cuarta barrera:** PostgreSQL **RLS** se habilita por migración SQL custom sobre las tablas tenant-scoped.

### Cómo evoluciona a enterprise (sin sobreingeniería ahora)
- El schema actual sirve a miles de tenants en shared schema.
- Si un cliente enterprise exige aislamiento físico: se aprovisiona una **base dedicada con el mismo schema** y se enruta su `DATABASE_URL` por el Tenant Context (ya existe). **Cero cambios de modelo**, porque todo acceso pasa por repositorios + contexto de tenant.
- Alternativa intermedia: mover ese tenant a un **schema PostgreSQL dedicado** vía `search_path` — soportado sin tocar los modelos.

---

## 9. Soft delete / hard delete / append-only

| Estrategia | Modelos | Mecanismo en schema |
|-----------|---------|---------------------|
| **Soft delete** | `Lead`, `LeadNote`, `User`, `Property`, `Tenant` | campo `deletedAt DateTime?` + filtro por extensión |
| **Append-only** | `LeadActivity`, `LeadTimelineEvent`, `Message`, `AuditLog`, (`LeadScore`, `LeadAssignment`) | `onDelete: Restrict` + convención `///` + (sin update en la capa de repos) |
| **Hard delete permitido** | `UserSession`, `MessageDelivery`, `NotificationDelivery`, `CalendarSync`, joins (`LeadTagLink`, `RolePermission`) | sin `deletedAt`; purga por TTL/job |
| **Cascada permitida** | Lead→Note/TagLink/FollowUp/Recovery; Property→Image/Feature; Visit→Reminder | `onDelete: Cascade` |
| **Cascada prohibida** | Lead→Activity/Assignment/Timeline; Conversation→Message; Subscription→Invoice/Payment | `onDelete: Restrict` |

---

## 10. Auditoría: qué se puede reconstruir

| Pregunta | Fuentes en el schema |
|----------|----------------------|
| ¿Quién creó un lead? | `AuditLog` (CREATE) + `LeadTimelineEvent` (LEAD_CREATED) |
| ¿Quién lo asignó? | `LeadAssignment` (`userId`, `assignedBy`, `assignedAt`) |
| ¿Quién lo contactó? | `LeadActivity` (`userId`, `type`, `occurredAt`) + `Message` (`sentByUserId`) |
| ¿Quién lo movió de etapa? | `AuditLog` (STATUS_CHANGE) + `LeadTimelineEvent` (LEAD_STATUS_CHANGED) |
| ¿Quién generó la visita? | `Visit` (`userId`, `createdAt`) |
| ¿Qué pasó antes de perder la oportunidad? | `Lead.lostReason` + `firstResponseAt` + `LeadFollowUp` (¿se ejecutó?) + `LeadRecovery` (¿se intentó?) |

---

## 11. Riesgos del schema y mitigaciones

| # | Riesgo | Mitigación |
|---|--------|-----------|
| S1 | Olvidar `tenantId` en una query → fuga cross-tenant | Prisma Extension forzando el filtro + RLS + tests CI |
| S2 | Desnormalización (`currentScoreTier`, `firstResponseAt`) se desincroniza | Solo el use case dueño actualiza; histórico en `LeadScore` permite reconstruir |
| S3 | `LeadActivity`/`Message` crecen sin límite | Particionamiento por fecha (migración SQL, FASE 13) + archivado |
| S4 | `index [status, scheduledAt]` sin `tenantId` en FollowUp | **Intencional**: el runner del worker barre cross-tenant; el aislamiento se aplica al ejecutar cada job. Documentado |
| S5 | JSONB (`rawPayload`, `metadata`) sin disciplina | Solo para datos crudos/heterogéneos; los campos de negocio son columnas tipadas |
| S6 | Enum que el negocio quiere personalizar | Lo personalizable ya es tabla (`LeadTag`); los enums son de dominio estable |
| S7 | `User.tenantId` nullable abre ambigüedad | Único caso (SUPER_ADMIN); guard explícito valida el acceso global |

---

## 12. Recomendaciones para futuras migraciones

1. **Primera migración = baseline** (`prisma migrate dev --name init`) genera todo el schema; revisar el SQL antes de aplicar.
2. **Migraciones SQL custom** (post-baseline) para lo que Prisma no expresa: índices **GIN/`pg_trgm`**, **RLS policies**, **particionamiento** de tablas append-only.
3. **Backward-compatible siempre:** no eliminar columna en el mismo deploy que el código que la deja de usar (expand → migrate → contract).
4. **Nunca editar una migración ya aplicada;** crear una nueva.
5. **Seed idempotente** (`seed.ts`): planes, permisos y roles de sistema.
6. **Shadow DB en CI** para validar que cada migración aplica limpia desde cero.
7. **Promoción enterprise** (DB dedicada): misma cadena de migraciones, distinto `DATABASE_URL` — sin divergencia de schema.

---

## 13. Disciplina `shared-types` (recordatorio aplicado)

Del schema, **solo migran a `packages/shared-types`** los **enums estables** (`LeadStatus`, `LeadSource`, `UserRole`, `PropertyType`, `PropertyStatus`, `VisitStatus`, `PlanTier`, etc.) y los **DTOs públicos** derivados de Zod. **NUNCA** los modelos Prisma ni sus tipos generados. Los tipos de Prisma viven solo en el backend.

---

### Estado de la fase
✅ **FASE 8 completada.** Artefacto: `apps/api/src/infrastructure/database/prisma/schema.prisma`.
Próxima: **FASE 9 — Diseño API REST** (endpoints versionados por módulo, contratos request/response, códigos de estado, autenticación, paginación, y el contrato de los webhooks de intake).
