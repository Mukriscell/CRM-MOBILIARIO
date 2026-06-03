# FASE 9 — Diseño de la API REST

> Documento de diseño para **CLIENTRA**. Parte 9 de 13.
> API **orientada a procesos de conversión**, no a CRUD de entidades.
> Sin código. Sin controladores. Sin Swagger.
> **Hilo conductor:** Intake → Router → Scoring → Follow-Up → Recovery → Visit → Conversión.

---

## 0. Filosofía: la API es el ciclo de vida del lead

```
   Una API CRUD diría:              CLIENTRA dice:
   POST /leads                      POST /lead-intake          (captura, no "crea fila")
   PUT  /leads/:id (status)         POST /leads/:id/qualify    (califica, evento de negocio)
   PUT  /leads/:id (assigned)       POST /lead-router/assign   (asigna, optimiza speed-to-lead)
   GET  /leads?cold=true            GET  /lead-recovery/candidates (proceso de recuperación)
```

Cada endpoint prioritario responde *"¿cómo ayuda a convertir más compradores?"*. Los endpoints CRUD existen (§9) pero son **secundarios**: soportan el proceso, no lo definen.

---

## 1. Estructura general y versionado

### Base URL
```
https://api.clientra.cl/api/v1
```

### Estrategia de versionado: **URI versioning (`/api/v1`)**
| Criterio | Decisión |
|----------|----------|
| Método | Versión en el path (`/api/v1`), no en header ni query |
| Por qué | Explícito, cacheable, trivial de enrutar, visible en logs/analytics. Header versioning es invisible y propenso a error |
| Política de cambios | `v1` es estable; cambios *aditivos* (nuevos campos opcionales, nuevos endpoints) **no** rompen y no suben versión |
| `v2` futuro | Solo para cambios *breaking* (renombrar/eliminar campos, cambiar semántica). `v1` y `v2` **coexisten** durante una ventana de deprecación (mín. 6 meses) |
| Deprecación | Header `Deprecation: true` + `Sunset: <fecha>` en respuestas de `v1` cuando exista `v2` |

### Convenciones transversales
- **Formato:** JSON (`Content-Type: application/json`).
- **Fechas:** ISO-8601 UTC (`2026-06-01T14:30:00Z`).
- **IDs:** UUID v4.
- **Envelope de respuesta:** consistente (ver §6).
- **Idempotencia:** header `Idempotency-Key` en POST que crean recursos o disparan efectos.

---

## 2. Autenticación

| Endpoint | Propósito | Status éxito |
|----------|-----------|--------------|
| `POST /auth/login` | Email+password → access + refresh token | 200 |
| `POST /auth/refresh` | Refresh token → nuevo access token | 200 |
| `POST /auth/logout` | Revoca el refresh token (sesión) | 204 |
| `POST /auth/forgot-password` | Dispara email de reset (Resend) | 202 |
| `POST /auth/reset-password` | token + nueva password | 200 |

### Modelo de tokens
- **Access token (JWT):** vida corta (**15 min**). Contiene claims: `sub` (userId), `tenantId`, `role`, `permissions`, `exp`, `iat`, `jti`.
- **Refresh token:** opaco, vida larga (**7–30 días**), almacenado **hasheado** en `user_sessions`. Rotación en cada refresh (el viejo se revoca → detección de robo).
- **Revocación:** `logout` marca `revokedAt`; un refresh con token revocado → `401`.

### Contrato `POST /auth/login`
```jsonc
// Request
{ "email": "ana@corredora.cl", "password": "••••••••" }

// 200 OK
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "rt_8f3a...",
    "expiresIn": 900,
    "user": { "id": "uuid", "firstName": "Ana", "role": "ADMIN", "tenantId": "uuid" }
  }
}
// 401 credenciales inválidas · 403 tenant SUSPENDED · 429 demasiados intentos
```

---

## 3. Estrategia multi-tenant: el tenant viaja en el JWT

| Opción evaluada | Veredicto |
|-----------------|-----------|
| **`tenantId` como claim del JWT** | ✅ **ELEGIDA** |
| Header `X-Tenant-Id` | ❌ Falsificable; el cliente podría enviar otro tenant |
| Subdominio (`acme.clientra.cl`) → resuelve tenant | ✅ Complementario (UX), pero la **autoridad** es el JWT |

**Flujo definitivo:**
1. En `login`, el backend resuelve el `tenantId` del usuario y lo **firma dentro del JWT**.
2. El `TenantMiddleware` (FASE 5) extrae `tenantId` del token validado y lo inyecta en el `AsyncLocalStorage` (Tenant Context).
3. **El cliente nunca declara su tenant** — se deriva del token. Imposible cruzar tenants manipulando un header.
4. **Excepción Super Admin:** `tenantId = null` en el token + permiso `cross_tenant`. Para operar sobre un tenant específico usa `X-Acting-Tenant-Id`, validado contra su permiso global y **auditado**.

---

## 4. Mapa completo de endpoints (agrupado por módulo)

### 🟢 CONVERSION CORE (prioritarios)

#### 4.1 Lead Intake — *"no perder ningún lead"*
| Método | Endpoint | Propósito | Status |
|--------|----------|-----------|--------|
| POST | `/lead-intake` | Ingesta genérica autenticada (app/integraciones) | 202 |
| POST | `/lead-intake/webhook/meta` | Facebook/Instagram Lead Ads | 202 |
| POST | `/lead-intake/webhook/whatsapp` | WhatsApp Cloud API | 202 |
| POST | `/lead-intake/webhook/forms` | Formularios externos | 202 |
| POST | `/lead-intake/webhook/landing` | Landing pages | 202 |
| GET | `/lead-intake/status` | Salud de canales + últimos intakes | 200 |

> **202 Accepted, no 201:** el intake **encola** el procesamiento (normalización + dedup + creación). La respuesta inmediata protege el speed-to-lead: nunca se hace esperar al webhook externo. El lead se crea async y emite `LeadCreated`.

```jsonc
// POST /lead-intake   Request
{
  "source": "LANDING",
  "contact": { "firstName": "Juan", "phone": "+56991234567", "email": "juan@mail.cl" },
  "interest": { "propertyCode": "DPT-1024", "commune": "Ñuñoa", "budget": 4500, "currency": "UF" },
  "raw": { "utm_source": "google", "form_id": "lp-home" }
}
// 202 Accepted
{ "data": { "intakeId": "uuid", "status": "QUEUED", "deduplication": "pending" } }
// 400 payload inválido · 401 sin auth · 422 falta contacto mínimo (phone|email) · 429 rate limit
```

#### 4.2 Lead Router — *"reducir el tiempo de respuesta"*
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/lead-router/assign` | Asigna un lead según reglas (manual override del auto) |
| POST | `/lead-router/reassign` | Reasigna (con motivo, auditado) |
| GET | `/lead-router/rules` | Lee reglas de ruteo del tenant |
| PUT | `/lead-router/rules` | Actualiza reglas (comuna, tipo, carga, round-robin) |

> **Flujo:** el ruteo **automático** se dispara por el evento `LeadCreated` (no requiere llamada HTTP). Estos endpoints son para **override manual** y **configuración**. `assign` emite `LeadAssigned` → gatilla autorespuesta (speed-to-lead).

```jsonc
// POST /lead-router/assign   Request
{ "leadId": "uuid", "userId": "uuid", "reason": "especialista Ñuñoa" }
// 200 OK
{ "data": { "leadId": "uuid", "assignedTo": "uuid", "assignedBy": "MANUAL", "assignedAt": "..." } }
// 404 lead no existe · 409 lead ya cerrado · 422 corredor sin capacidad
```

#### 4.3 Lead Scoring — *"trabajar primero el lead más valioso"*
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/lead-scoring/evaluate` | Evalúa un lead (IA financiera-aware, async) |
| POST | `/lead-scoring/recalculate` | Recalcula (batch o por lead) tras nueva info |
| GET | `/lead-scoring/:leadId` | Score vigente + histórico + factores |

```jsonc
// GET /lead-scoring/:leadId   200 OK
{
  "data": {
    "leadId": "uuid",
    "current": { "tier": "HOT", "value": 87, "source": "AI", "scoredAt": "..." },
    "factors": { "budgetFit": 0.9, "creditStatus": "PRE_APPROVED", "subsidyEligible": true, "urgency": "HIGH" },
    "history": [ { "tier": "WARM", "value": 64, "scoredAt": "..." } ]
  }
}
// 404 lead sin score aún · 202 si evaluate se encoló
```
> Si el LLM falla, `evaluate` cae a **scoring heurístico determinista** (FASE 4) → siempre devuelve un tier. Emite `LeadScored`.

#### 4.4 Follow-Up Engine — *"eliminar el seguimiento manual"*
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/follow-ups/schedule` | Programa una cadencia para un lead |
| POST | `/follow-ups/:id/cancel` | Cancela un paso (con motivo) |
| GET | `/follow-ups/pending` | Pasos pendientes (filtrable por corredor) |
| GET | `/follow-ups/completed` | Pasos ejecutados |

> **Cadencia por defecto** (configurable por tenant): Día 1 WhatsApp → Día 3 recordatorio → Día 7 seguimiento → Día 14 reactivación. Cada paso se **auto-cancela** si el lead avanza de estado (`cancelReason: LEAD_ADVANCED`). El runner BullMQ ejecuta por `[status, scheduledAt]`. `schedule` emite `FollowUpScheduled`.

#### 4.5 Lead Recovery — *"recuperar oportunidades perdidas"* (first-mover)
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| GET | `/lead-recovery/candidates` | Leads fríos detectados (30/60/90 días) |
| POST | `/lead-recovery/reactivate` | Dispara secuencia de reactivación |
| POST | `/lead-recovery/:leadId/archive` | Archiva como definitivamente perdido (con motivo) |
| GET | `/lead-recovery/metrics` | Tasa de recuperación, reactivados, perdidos |

```jsonc
// GET /lead-recovery/candidates?threshold=DAYS_60   200 OK
{
  "data": [ { "leadId": "uuid", "lastActivityAt": "...", "daysCold": 63, "lastScore": "WARM" } ],
  "pagination": { "nextCursor": "...", "hasMore": true }
}
```
> El **cron diario** (FASE 4) detecta fríos y emite `LeadWentCold`; estos endpoints permiten al corredor/admin actuar. `reactivate` emite `LeadRecovered` si hay respuesta.

#### 4.6 Visit Scheduling
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/visits` | Agenda visita (+ sync Google Calendar) |
| PATCH | `/visits/:id` | Reagenda / edita |
| POST | `/visits/:id/confirm` | Confirma asistencia |
| POST | `/visits/:id/cancel` | Cancela (con motivo) |
| GET | `/visits/calendar` | Vista calendario (rango + corredor) |

> `POST /visits` emite `VisitScheduled` → crea `LeadActivity` + `CalendarSync` + programa `VisitReminder`. Mueve el lead a `VISITA_AGENDADA`.

#### 4.7 WhatsApp CRM
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| GET | `/conversations` | Bandeja centralizada (filtros + cursor) |
| POST | `/conversations` | Abre/snooze/cierra; vincula a lead |
| GET | `/conversations/:id` | Hilo + mensajes |
| POST | `/messages/send` | Envía mensaje (texto o plantilla) |
| GET | `/messages` | Mensajes de una conversación |
| GET/POST | `/messages/templates` | Gestiona plantillas pre-aprobadas |

```jsonc
// POST /messages/send   Request
{ "conversationId": "uuid", "type": "TEMPLATE", "templateId": "uuid", "variables": { "1": "Ana" } }
// 201 Created
{ "data": { "messageId": "uuid", "direction": "OUTBOUND", "delivery": "QUEUED" } }
// 409 ventana 24h expirada y no es plantilla (debe usar TEMPLATE) · 422 plantilla no aprobada
```
> `send` emite `MessageSent`; abrir una conversación nueva emite `ConversationStarted`. La **ventana de 24h** de WhatsApp se valida: fuera de ella solo se permiten plantillas aprobadas.

### 🔵 ENDPOINTS CRUD SECUNDARIOS (soporte, no eje)
| Recurso | Endpoints | Nota |
|---------|-----------|------|
| Leads | `GET /leads`, `GET /leads/:id`, `GET /leads/:id/timeline`, `POST /leads`, `PATCH /leads/:id`, `DELETE /leads/:id` (soft) | El detalle/timeline sí es central; el `POST` directo es excepción (lo normal es `/lead-intake`) |
| Leads (proceso) | `POST /leads/:id/qualify`, `POST /leads/:id/mark-lost`, `POST /leads/:id/notes`, `POST /leads/:id/tags` | Transiciones como acciones de negocio |
| Properties | `GET/POST/PATCH/DELETE /properties`, `/properties/:id/images` | Soporte |
| Users | `GET/POST/PATCH/DELETE /users`, `POST /users/invite` | Admin |
| Roles/Permissions | `GET /roles`, `GET /permissions`, `PUT /roles/:id/permissions` | RBAC |
| Tenants | `GET/POST/PATCH /tenants` | **Solo Super Admin** |
| Subscriptions | `GET /subscriptions/me`, `POST /subscriptions/checkout`, `POST /subscriptions/cancel` | Billing |
| Dashboard | `GET /dashboard/metrics`, `/dashboard/ttfr`, `/dashboard/conversion`, `/dashboard/recovery`, `/dashboard/broker-performance` | Lectura agregada |

---

## 5. Eventos de negocio → endpoints que los emiten

| Evento de dominio | Emitido por | Consumidores (in-process) |
|-------------------|-------------|---------------------------|
| `LeadCreated` | `POST /lead-intake/*` | Lead Router (auto-assign) |
| `LeadAssigned` | `POST /lead-router/assign` + auto | Follow-Up (autorespuesta), Notifications |
| `LeadScored` | `POST /lead-scoring/evaluate` | Dashboard, Notifications (si HOT) |
| `FollowUpScheduled` | `POST /follow-ups/schedule` + auto | Worker BullMQ |
| `LeadWentCold` | cron (no HTTP) | Lead Recovery |
| `LeadRecovered` | `POST /lead-recovery/reactivate` | Dashboard, Timeline |
| `VisitScheduled` | `POST /visits` | Calendar sync, Reminder, Timeline |
| `ConversationStarted` | `POST /conversations` + webhook WA | Timeline |
| `MessageSent` | `POST /messages/send` | Delivery tracking, Timeline |

> Los eventos viajan por el **event bus in-process** (FASE 4), no por la API. La tabla muestra el origen para trazabilidad. Muchos efectos (auto-assign, autorespuesta) ocurren **sin** llamada HTTP — la API expone el override, el sistema hace el trabajo.

---

## 6. Envelope de respuesta y códigos HTTP

### Envelope estándar
```jsonc
// Éxito con colección
{ "data": [ ... ], "pagination": { "nextCursor": "...", "hasMore": true, "limit": 25 } }
// Éxito con recurso
{ "data": { ... } }
// Error
{ "error": { "code": "LEAD_ALREADY_CLOSED", "message": "...", "details": [ ... ], "traceId": "uuid" } }
```

### Catálogo de status codes
| Code | Uso en CLIENTRA |
|------|-----------------|
| 200 | Lectura / acción síncrona OK |
| 201 | Recurso creado síncronamente (ej. mensaje, visita) |
| 202 | **Aceptado y encolado** (lead-intake, scoring async) — clave para speed-to-lead |
| 204 | Acción sin contenido (logout, cancel) |
| 400 | Payload malformado |
| 401 | Sin auth / token inválido o expirado |
| 403 | Autenticado pero sin permiso (RBAC) o tenant suspendido |
| 404 | Recurso inexistente **o de otro tenant** (no se revela cuál) |
| 409 | Conflicto de estado (lead ya cerrado, ventana 24h expirada) |
| 422 | Validación de negocio (falta phone/email, plantilla no aprobada) |
| 429 | Rate limit excedido (incluye `Retry-After`) |
| 500 | Error interno (con `traceId` para soporte) |

> **404 para cross-tenant:** si se pide un recurso de otro tenant, se responde **404** (no 403) para no revelar su existencia.

---

## 7. Paginación: **Cursor-based**

| Opción | Veredicto |
|--------|-----------|
| Offset (`?page=2&size=25`) | ❌ Se degrada con datos grandes; resultados inconsistentes si se insertan leads (los nuevos desplazan páginas) |
| **Cursor (`?cursor=...&limit=25`)** | ✅ **ELEGIDA** |

**Por qué cursor:** las bandejas de leads/conversaciones reciben inserciones constantes (nuevos leads en tiempo real). Offset causaría duplicados/saltos al paginar. El cursor (basado en `createdAt`+`id`) es estable y O(1) con los índices de FASE 8.

```
GET /leads?status=NUEVO&limit=25&cursor=eyJjcmVhdGVkQXQiOiI...
→ { "data":[...], "pagination": { "nextCursor": "...", "hasMore": true, "limit": 25 } }
```
- `limit` máx. 100 (default 25).
- El cursor es opaco (base64 de `{createdAt, id}`), no manipulable por el cliente.

---

## 8. Filtros, búsqueda y ordenamiento

Convención uniforme por query params:

| Recurso | Filtros | Búsqueda | Orden |
|---------|---------|----------|-------|
| **Leads** | `status`, `source`, `scoreTier`, `assignedUserId`, `commune`, `createdFrom/To`, `cold=true` | `q` (nombre/email/phone, `pg_trgm`) | `sort=createdAt\|lastActivityAt\|scoreValue` `&order=asc\|desc` |
| **Conversations** | `status`, `assignedUserId`, `hasLead`, `windowOpen` | `q` (teléfono/nombre) | `lastMessageAt` |
| **Activities** | `leadId`, `type`, `userId`, `dateFrom/To` | — | `occurredAt` |
| **Visits** | `status`, `userId`, `propertyId`, `dateFrom/To` | — | `scheduledAt` |
| **Follow-Ups** | `status`, `leadId`, `channel`, `dueBefore` | — | `scheduledAt` |

- Filtros combinables (AND).
- Todos respetan automáticamente el `tenantId` del contexto (nunca se acepta como filtro del cliente).
- Validación de cada param con Zod; param desconocido → `400`.

---

## 9. Contratos de Webhooks (intake externo)

Todos comparten el **patrón de seguridad e idempotencia**:

| Aspecto | Estrategia |
|---------|-----------|
| **Autenticación** | Cada proveedor tiene su mecanismo (ver tabla); secretos en env, nunca en código |
| **Verificación de firma** | Se valida la firma HMAC del proveedor **antes** de procesar |
| **Idempotencia** | Clave de evento del proveedor (`wa_message_id`, Meta `leadgen_id`) → si ya existe, se responde 200 sin re-procesar |
| **Respuesta rápida** | 202 inmediato + encolado; nunca procesamiento síncrono dentro del webhook |
| **Replay protection** | Timestamp del evento + ventana de tolerancia (5 min); eventos viejos se rechazan |

| Webhook | Auth/Firma | Idempotency key | Notas |
|---------|-----------|-----------------|-------|
| `/webhook/meta` (Lead Ads) | `X-Hub-Signature-256` (HMAC-SHA256 app secret) + verify token en GET de handshake | `leadgen_id` | Pull del lead vía Graph API tras el ping |
| `/webhook/whatsapp` | `X-Hub-Signature-256` (Cloud API) + verify token | `wa_message_id` | Maneja mensajes + estados de entrega |
| `/webhook/forms` | HMAC propio (`X-Clientra-Signature`) con secret por tenant | hash del payload + `formSubmissionId` | Para integradores genéricos |
| `/webhook/landing` | API key por tenant (`X-Api-Key`) + HMAC | `submissionId` | Landing pages propias |

### Estrategia anti-duplicación de leads (crítica)
**Doble barrera:**
1. **Idempotencia de webhook** (clave del proveedor) → evita procesar el mismo evento dos veces.
2. **Deduplicación de negocio** en el Intake: antes de crear el Lead, se busca por `[tenantId, phone]` y `[tenantId, email]` (índices de FASE 8) dentro de una ventana configurable (ej. 30 días). Si existe:
   - Se **fusiona**: se agrega una `LeadActivity` (nueva consulta) al lead existente y se actualiza `lastActivityAt`, **sin crear duplicado**.
   - Si el lead estaba frío/perdido → puede gatillar recovery.
3. Respuesta del intake incluye `"deduplication": "merged" | "created"`.

```jsonc
// 202 tras dedup
{ "data": { "intakeId": "uuid", "leadId": "uuid", "deduplication": "merged" } }
```

---

## 10. Auditoría: qué se registra

| Generan evento auditable (`AuditLog`) | NO se auditan (ruido) |
|---------------------------------------|------------------------|
| `login`, `reset-password` (LOGIN) | `GET` de lectura simple |
| Asignación/reasignación de lead (ASSIGN) | health checks |
| Cambio de estado del lead (STATUS_CHANGE) | webhooks entrantes (se loggean aparte, no como audit de usuario) |
| `mark-lost`, `archive` (UPDATE) | refresh de token (se registra en `user_sessions`) |
| Creación/edición de usuarios, roles (CREATE/UPDATE) | navegación de dashboard |
| Acciones cross-tenant del Super Admin | — |
| Exportaciones de datos (EXPORT) | — |

**Qué se registra:** `actorUserId`, `action`, `entityType`, `entityId`, `before`/`after` (JSONB), `ip`, `createdAt`, `tenantId`. Append-only (FASE 8). Permite reconstruir una venta o investigar una pérdida (FASE 6 §12).

---

## 11. Rate limiting

| Zona | Límite (por defecto) | Clave | Razón |
|------|----------------------|-------|-------|
| **Auth** (`/auth/login`, `forgot-password`) | 5 / min / IP + 10 / hora / email | IP + email | Anti fuerza bruta / credential stuffing |
| **Webhooks** | 1.000 / min / proveedor (burst alto) | proveedor + tenant | Picos legítimos de campañas; protege sin perder leads |
| **API interna** (autenticada) | 600 / min / usuario | userId | Uso normal de la app |
| **API pública/integraciones** | 120 / min / API key | tenant + API key | Integradores externos |

- Implementado con **Redis** (sliding window). Respuesta `429` con `Retry-After` y headers `X-RateLimit-Remaining/Reset`.
- **Los webhooks tienen el límite más laxo a propósito:** perder un lead por rate limit contradice la tesis del producto. Ante saturación, se encola, no se rechaza.

---

## 12. Seguridad (resumen de controles)

| Control | Implementación |
|---------|----------------|
| **JWT** | Access 15 min + refresh rotativo hasheado; `jti` para revocación |
| **RBAC** | `RolesGuard` + decorador `@Roles()` (FASE 5); permisos en el claim |
| **Tenant Isolation** | `tenantId` del JWT → contexto → Prisma extension + RLS; cross-tenant = 404 |
| **Input Validation** | Zod en el borde (DTOs); param desconocido → 400 |
| **Idempotency Keys** | Header `Idempotency-Key` en POST con efectos; webhooks por clave de proveedor |
| **Replay Protection** | Timestamp + ventana 5 min en webhooks |
| **Webhook Verification** | HMAC-SHA256 por proveedor antes de procesar |
| **Transport** | HTTPS obligatorio; HSTS |
| **Headers** | Helmet (CSP, X-Frame-Options, etc.) — FASE 4 |
| **Secrets** | En variables de entorno / secret manager; nunca en repo |

---

## 13. Riesgos de API y mitigaciones

| # | Riesgo | Mitigación |
|---|--------|-----------|
| A1 | **Lead duplicado** por reintento de webhook | Idempotencia (clave proveedor) + dedup por phone/email (doble barrera, §9) |
| A2 | **Webhook lento bloquea el speed-to-lead** | 202 + encolado; cero procesamiento síncrono en el webhook |
| A3 | **Fuga cross-tenant** vía parámetro manipulado | `tenantId` jamás se acepta del cliente; deriva del JWT; 404 para ajenos |
| A4 | **Caída del LLM** rompe scoring | `evaluate` cae a heurístico determinista; nunca bloquea el flujo |
| A5 | **Pérdida de lead por rate limit** en campaña masiva | Límite de webhooks laxo + cola; degradar encolando, no rechazando |
| A6 | **Refresh token robado** | Rotación + detección de reuso (token viejo revocado → invalida la cadena) |
| A7 | **Ventana 24h de WhatsApp** viola política Meta | Validación: fuera de ventana solo plantillas aprobadas → 409 si no |
| A8 | **Paginación inconsistente** en bandejas vivas | Cursor estable (createdAt+id), no offset |
| A9 | **Breaking change** rompe integraciones | Versionado URI + cambios solo aditivos en v1 + ventana de deprecación para v2 |
| A10 | **Enumeración de recursos** por IDs secuenciales | UUID v4 (no secuencial) + 404 uniforme |

---

## 14. Resumen de entregables

1. ✅ **Mapa completo de endpoints** — §4 (Core + CRUD secundario)
2. ✅ **Agrupación por módulo** — §4 (Conversion Core / CRUD / Dashboard)
3. ✅ **Contratos request/response** — §2, §4, §6 (ejemplos JSON + status)
4. ✅ **Estrategia de autenticación** — §2 (JWT + refresh rotativo)
5. ✅ **Estrategia multi-tenant** — §3 (tenant en el JWT)
6. ✅ **Estrategia de paginación** — §7 (cursor-based, justificada)
7. ✅ **Estrategia de filtros** — §8
8. ✅ **Contratos webhook** — §9 (firma, idempotencia, anti-duplicación)
9. ✅ **Eventos de negocio** — §5
10. ✅ **Riesgos de API y mitigaciones** — §13

---

### Estado de la fase
✅ **FASE 9 completada.** Próxima: **FASE 10 — Diseño UI/UX** (arquitectura de información, flujos de pantalla centrados en conversión, sistema de diseño con Shadcn/UI, dark mode, mobile-first y los componentes clave: bandeja de leads, pipeline Kanban, inbox WhatsApp, dashboard de KPIs).
