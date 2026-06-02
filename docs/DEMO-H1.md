# DEMO H1 — Plataforma de Conversión de Leads (CLIENTRA)

> Entrega de demostración del **Hito H1**: *"Un lead entra, se asigna y aparece en la bandeja."*
> Validación visual + funcional antes de avanzar a H2.

---

## 0. Cómo se generó esta demo (transparencia)

El entorno de ejecución **no permite mantener vivo un servidor HTTP** (reapea cualquier proceso que quede escuchando un puerto), por lo que no fue posible apuntar un navegador a `localhost:3000`. Para entregar capturas **fieles**:

- Los datos son **reales**: se sembraron 6 leads en PostgreSQL y se leyeron con Prisma.
- Las pantallas se renderizaron con el **mismo markup y clases Tailwind de los componentes Next implementados** (`apps/web/src/...`), compilando el CSS con el toolchain del propio proyecto (offline) y capturando con Chromium headless desde `file://`.
- El flujo de asignación automática muestra la **salida real** del E2E (`pnpm --filter @clientra/api test:e2e`) ejecutado contra Postgres.

> En un entorno local normal (`pnpm dev`), estas mismas pantallas se ven en el navegador en `http://localhost:3000`.

---

## 1. Capturas

| # | Pantalla | Archivo |
|---|----------|---------|
| 1 | Login | [`demo/01-login.png`](./demo/01-login.png) |
| 2 | Dashboard de Conversión | [`demo/02-dashboard-conversion.png`](./demo/02-dashboard-conversion.png) |
| 3 | Bandeja de Leads (vacía) | [`demo/03-bandeja-vacia.png`](./demo/03-bandeja-vacia.png) |
| 4 | Bandeja de Leads (con leads) | [`demo/04-bandeja-llena.png`](./demo/04-bandeja-llena.png) |
| 5 | Detalle de Lead | [`demo/05-detalle-lead.png`](./demo/05-detalle-lead.png) |
| 6 | Flujo de asignación automática | [`demo/06-flujo-asignacion.png`](./demo/06-flujo-asignacion.png) |

---

## 2. Cómo reproducir el flujo en local

**Requisitos:** Node 22+, pnpm 9+, Docker.

```bash
pnpm install
docker compose -f infrastructure/docker-compose.yml up -d        # Postgres + Redis
cp .env.example .env
pnpm --filter @clientra/shared-types build && pnpm --filter @clientra/shared-utils build
pnpm --filter @clientra/api db:generate
pnpm --filter @clientra/api db:migrate                            # crea schema + RLS
pnpm --filter @clientra/api db:seed                               # tenant demo + usuarios
pnpm dev                                                          # API :4000 + Web :3000
```

- **URL local:** Web `http://localhost:3000` · API `http://localhost:4000/api/v1` (health: `/api/v1/health`)
- **Credenciales de prueba:** `admin@demo.cl` / `clientra123` (corredores: `diego@demo.cl`, `carla@demo.cl`)

**Reproducir el flujo H1 (intake → asignación → bandeja):**
```bash
TOKEN=$(curl -s localhost:4000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.cl","password":"clientra123"}' | jq -r .data.accessToken)

# Capturar un lead (entra por intake, se asigna solo por evento)
curl -s localhost:4000/api/v1/lead-intake -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"source":"LANDING","contact":{"firstName":"Juan","phone":"+56991234567"}}'

# Verlo en la bandeja (ya asignado a un corredor)
curl -s localhost:4000/api/v1/leads -H "Authorization: Bearer $TOKEN"
```

**Datos de demo / validación reproducibles:**
```bash
pnpm --filter @clientra/api test:e2e         # E2E completo (8 checks)
# Datos de demo para la UI:
( cd apps/api && DATABASE_URL=... node scripts/demo-h1.cjs )
```

---

## 3. Funcionalidades implementadas (H1)

| Capacidad | Estado | Dónde |
|-----------|:------:|-------|
| Autenticación JWT (login) | ✅ | API `auth` + web login |
| Multi-tenant (tenant del JWT, aislamiento) | ✅ | `TenantContext` + repos + RLS |
| Captura de leads (intake) con respuesta 202 | ✅ | `POST /lead-intake` |
| Deduplicación por teléfono/email (merge) | ✅ | `CreateLeadUseCase` |
| Asignación automática por evento `lead.created` | ✅ | `LeadRouter` listener |
| Bandeja de Leads (lista, score, tiempo sin respuesta, filtros, cursor) | ✅ | web `/leads` + `GET /leads` |
| Dashboard de Conversión (tarjeta "sin respuesta" accionable) | ✅ (subset H1) | web `/` |
| Detalle de lead (datos reales) | ✅ API · ⚠️ UI mínima | `GET /leads/:id` |
| Override manual de asignación (RBAC) | ✅ | `POST /lead-router/assign` |
| Healthcheck | ✅ | `GET /health` |

---

## 4. Funcionalidades pendientes

| Pendiente | Hito previsto |
|-----------|---------------|
| **Página web de Detalle de Lead completa** (timeline rico, acciones funcionales) | Cierre H1 / H2 |
| Inbox WhatsApp + autorespuesta + medición de TTFR | **H2** |
| Lead Scoring real (IA financiera-aware; hoy el tier se setea manual en demo) | **H3** |
| Seguimiento automático (cadencias) + Centro de Seguimientos | **H4** |
| Recovery Center | **H5** |
| Pipeline Kanban + Visitas (Google Calendar) | **H6** |
| Billing / self-serve signup | **H7** |
| Acciones rápidas reales en bandeja (llamar/agendar/mover etapa) | H2+ |

---

## 5. Limitaciones conocidas (H1)

1. **Detalle de lead:** la API existe y devuelve datos reales; la página web de detalle es mínima (el timeline rico requiere `LeadActivity`, que se puebla en H2).
2. **Scoring:** en H1 el `currentScoreTier` no se calcula con IA (eso es H3); en la demo se sembró para ilustrar la UI.
3. **Ruteo:** la regla de asignación es round-robin simple; comuna/carga/tipo se incorporan en H2.
4. **RLS en runtime:** la política está habilitada y validada a nivel de base, pero el aislamiento *activo* hoy es el de capa de aplicación; conectar como rol no-owner + `SET app.current_tenant` por transacción queda como wiring de H2.
5. **Webhooks externos:** `POST /lead-intake/webhook/forms` resuelve tenant por slug; la verificación de firma HMAC se añade en H2.
6. **Notificaciones en tiempo real** del nuevo lead al corredor: pendientes (H2 con WhatsApp/push).

---

## 6. Riesgos abiertos

| # | Riesgo | Mitigación / plan |
|---|--------|-------------------|
| R1 | Aprobación de WhatsApp Business API y plantillas (lead time externo) | Iniciar trámite al comienzo de H2 |
| R2 | Precisión/latencia/costo del LLM para scoring (H3) | `AIProvider` con fallback heurístico (ya diseñado) |
| R3 | Wiring de RLS podría romper conexiones si se aplica mal | Probar en staging con rol no-owner antes de prod |
| R4 | Crecimiento de tablas append-only (activity/message) | Particionamiento por fecha (documentado FASE 6/8) |
| R5 | Confiabilidad de cadencias temporales (H4) | BullMQ persistente + idempotencia |

---

## 7. Verificación UX vs. FASE 10 (aprobada)

| Principio FASE 10 | ¿Se cumple en H1? | Evidencia |
|-------------------|:-----------------:|-----------|
| **Orientada a acción** ("¿qué hago ahora?") | ✅ | Dashboard pregunta "¿Qué debo hacer ahora?"; bandeja "¿A quién contacto ahora?"; CTA "Responder ahora →" |
| **Navegación lead-céntrica** (Propiedades casi al final) | ✅ | Sidebar: Conversión → Bandeja → … → Propiedades (penúltimo) |
| **Dark-mode-first** | ✅ | Tema oscuro por defecto |
| **Color semántico** (urgente/enfriándose/a tiempo) | ✅ | "Sin respuesta" en rojo (≥5 min) / ámbar (<5 min); score HOT 🔥 |
| **Métricas accionables, no decorativas** | ✅ | Tarjeta "Sin respuesta: 3" lleva a la bandeja filtrada |
| **Empty states que proponen acción** | ✅ | "No hay leads sin responder 🎉" |
| **Bandeja: columnas y acción rápida WhatsApp** | ✅ | Score, Nombre, Teléfono, Fuente, Estado, Responsable, Sin respuesta, WhatsApp |

### Desviaciones detectadas (implementado vs. FASE 10)

| Desviación | Severidad | Comentario |
|-----------|:---------:|-----------|
| **Detalle de Lead** especificado en FASE 10 §3.7 con timeline rico, pero la web H1 tiene vista mínima | 🟡 Media | API lista; UI completa en H1-cierre/H2. La captura #5 muestra el layout objetivo con datos reales + banner honesto |
| **Items de nav H2–H5** (Inbox, Pipeline, Seguimientos, Recovery, Visitas) visibles pero **no funcionales** | 🟢 Baja | Marcados `(H2+)` en la demo; en la web actual son links sin destino. Recomendación: deshabilitarlos visualmente hasta su hito |
| **Bandeja sin orden explícito por urgencia** en el front (el back lo soporta) | 🟢 Baja | FASE 10 pide "ordenada por urgencia"; la API ya indexa por ello, falta forzar el `sort` por defecto en la UI |
| **Acciones rápidas** (llamar/agendar/mover etapa) presentes en FASE 10; en H1 solo WhatsApp es accionable | 🟢 Baja | El resto llega con H2/H6 |
| **Command palette ⌘K** (FASE 10 §2) | 🟢 Baja | No es MVP de H1; diferible |

**Conclusión UX:** la experiencia implementada en H1 **respeta los principios rectores de la FASE 10** (acción sobre información, lead-céntrico, dark, color semántico). Las desviaciones son de **alcance** (pantallas de hitos posteriores) y una de **profundidad** (detalle de lead), ninguna contradice el diseño aprobado.

---

### Veredicto
✅ **H1 validado visual y funcionalmente.** Listo para avanzar a **H2** cuando se apruebe, con la recomendación menor de (a) completar la página de detalle y (b) deshabilitar visualmente los items de nav aún no funcionales.
