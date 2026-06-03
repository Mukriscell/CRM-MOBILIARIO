# FASE 11 — Roadmap de Desarrollo

> Documento de planificación para **CLIENTRA**. Parte 11 de 13.
> **Roadmap por capacidades de negocio completas**, no por módulos técnicos ni capas.
> Cada hito termina con una **capacidad utilizable por un corredor real** y responde:
> *"¿Qué valor nuevo obtiene una corredora al finalizar este hito?"*
> Objetivo: **maximizar aprendizaje de mercado y minimizar el tiempo hasta el primer piloto.**

---

## 0. Filosofía del roadmap: vertical slices, no capas horizontales

```
   ❌ Horizontal (capas)              ✅ Vertical (capacidades)
   ┌─ Auth terminado ─┐               ┌─ "Un lead entra y aparece en la bandeja" ─┐
   ┌─ Lead module ────┐    ⟶          │  toca: auth + tenant + intake + UI         │
   ┌─ WhatsApp ───────┐               │  resultado: la corredora YA ve valor       │
   (nada usable hasta el final)       (cada hito es demostrable a un cliente)
```

Cada hito **atraviesa** todas las capas (DB → backend → API → UI) para entregar una capacidad de punta a punta. Ninguna corredora paga por "Auth terminado"; paga por "ningún lead se me escapa".

**Principio de secuencia:** construir primero lo que genera **aprendizaje de mercado** más rápido y lo que es **prerequisito** de lo siguiente. El orden sigue el ciclo de vida del lead, pero cada paso es entregable por sí mismo.

> ⏱ **Estimaciones:** relativas (sprints de ~2 semanas), indicativas para un equipo pequeño. No son compromisos; son orden de magnitud para planificar el piloto.

---

## 1. Vista global de hitos

| Hito | Capacidad de negocio | Sprints | Gate de piloto |
|------|----------------------|:-------:|----------------|
| **H1** | Un lead entra, se asigna y aparece en la bandeja | 2–3 | — |
| **H2** | El corredor lo responde por WhatsApp y se mide el tiempo de respuesta | 2 | 🚀 **Piloto cerrado** (1–2 design partners) |
| **H3** | El sistema prioriza los leads por viabilidad (scoring) | 1–2 | — |
| **H4** | El sistema hace seguimiento automático (cadencias) | 2 | 🚀 **Piloto ampliado** (5–10 corredoras) |
| **H5** | El sistema recupera oportunidades frías (Recovery) | 1–2 | — |
| **H6** | El corredor conduce el lead hasta el cierre (pipeline + visitas) | 2 | — |
| **H7** | Una corredora se registra sola, paga y opera su equipo | 2–3 | 🚀 **Lanzamiento comercial** (self-serve) |

> **Time-to-pilot ≈ 4–5 sprints (H1+H2).** Ese es el objetivo central: poner CLIENTRA en manos de una corredora real lo antes posible para aprender.

---

## 2. Hitos en detalle

---

### 🟢 H1 — "Un lead entra, se asigna y aparece en la bandeja"

- **Objetivo de negocio:** que ningún lead se pierda — capturar de múltiples canales y que aparezca, asignado, en una bandeja única. Es el cimiento de la promesa del producto.
- **Capacidades habilitadas:**
  - Un lead de formulario/landing/Meta entra por webhook y se crea (sin duplicados).
  - Se asigna automáticamente a un corredor (regla por comuna/carga).
  - El corredor inicia sesión y ve sus leads en la Bandeja, ordenados por urgencia.
- **Dependencias técnicas:** walking skeleton del monorepo (FASE 5) · Tenant + Auth/JWT + RBAC mínimo · Prisma + migración baseline (FASE 8) · Lead Intake (1+ webhook) + dedup · Lead Router · Bandeja de Leads (FASE 10) · Docker Compose + deploy básico.
- **Riesgos:** (R) variabilidad de payloads de webhooks → mitigar con `rawPayload` JSONB + adaptadores; (R) fuga cross-tenant desde el día 1 → activar las 4 barreras (FASE 6) y test de aislamiento en CI antes de cualquier dato real.
- **Criterio de salida:** un lead enviado a un webhook aparece, deduplicado y asignado, en la bandeja del corredor correcto, en < 5 s, con aislamiento por tenant verificado.
- **KPI que valida el éxito:** **% de leads capturados sin pérdida** (objetivo 100% de los eventos válidos) y latencia intake→bandeja.

---

### 🟢 H2 — "El corredor responde por WhatsApp y se mide el tiempo de respuesta" 🚀

- **Objetivo de negocio:** atacar el dolor #1 (responden tarde) y la mayor brecha de mercado (WhatsApp CRM). Aquí CLIENTRA ya entrega su propuesta de valor central.
- **Capacidades habilitadas:**
  - Conversaciones de WhatsApp centralizadas y vinculadas al lead (Inbox).
  - Autorespuesta inmediata 24/7 al entrar un lead (speed-to-lead).
  - El corredor responde desde la app; queda registrado en el timeline.
  - Se mide y muestra el **Tiempo de Primera Respuesta (TTFR)**.
- **Dependencias técnicas:** WhatsApp Cloud API + `MessagingProvider` · webhook de WhatsApp (idempotente) · Inbox WhatsApp (FASE 10) · plantillas aprobadas + ventana 24h · captura de `first_response_at` · Activity/Timeline.
- **Riesgos:** (R) aprobación de WhatsApp Business y plantillas (lead time externo) → iniciar el trámite en H1; (R) límites de la API → throttling en cola; (R) la autorespuesta puede sonar robótica → plantillas revisadas con el design partner.
- **Criterio de salida:** un lead nuevo recibe autorespuesta en < 60 s; el corredor sostiene la conversación dentro de la app; el dashboard muestra el TTFR real.
- **KPI que valida el éxito:** **TTFR < 5 min** y **% de conversaciones vinculadas a un lead = 100%**.
- **🚀 GATE — Piloto cerrado:** con H1+H2 hay producto suficiente para 1–2 corredoras *design partners*. **Inicia el aprendizaje de mercado real.**

---

### 🟢 H3 — "El sistema prioriza los leads por viabilidad (scoring)"

- **Objetivo de negocio:** que el corredor trabaje primero al comprador *viable* (no al curioso) — el diferenciador de IA financiera-aware (FASE 3).
- **Capacidades habilitadas:**
  - Cada lead recibe un score (HOT/WARM/COLD) basado en presupuesto, pie, crédito, subsidio, urgencia.
  - La Bandeja y el Pipeline se ordenan/filtran por prioridad.
  - Si la IA falla, scoring heurístico garantiza un tier siempre.
- **Dependencias técnicas:** `AIProvider` (OpenAI) + fallback heurístico · Lead Scoring Engine · captura de campos financieros en intake/inbox · UI de score (badges).
- **Riesgos:** (R) precisión/latencia/costo del LLM → cache + heurística + timeout; (R) datos financieros incompletos en leads reales → el score degrada con elegancia y pide completar.
- **Criterio de salida:** todo lead tiene un tier; el corredor puede ordenar su bandeja por prioridad; el fallback funciona con el LLM apagado.
- **KPI que valida el éxito:** **tasa de conversión de leads HOT vs. WARM/COLD** (validar que el score predice cierre) y % de leads con calificación financiera completa.

---

### 🟢 H4 — "El sistema hace seguimiento automático" 🚀

- **Objetivo de negocio:** eliminar el olvido de seguimientos (dolor #2; 44% se rinde tras el primer contacto). El producto empieza a trabajar **solo**.
- **Capacidades habilitadas:**
  - Cadencias automáticas (Día 1/3/7/14) que se disparan y se auto-cancelan si el lead avanza.
  - Centro de Seguimientos: el corredor ve "mis tareas" del día (manuales + automáticas mezcladas).
  - Recordatorios y alertas de leads enfriándose.
- **Dependencias técnicas:** BullMQ + Redis (worker async) · Follow-Up Engine + cadencias idempotentes · Centro de Seguimientos (FASE 10) · Notifications.
- **Riesgos:** (R) jobs perdidos/duplicados → BullMQ persistente + idempotencia + dead-letter; (R) over-messaging molesta al comprador → tope de toques y respeto de respuesta.
- **Criterio de salida:** un lead sin actividad recibe automáticamente el siguiente paso de la cadencia; el corredor ve y completa sus seguimientos del día; al avanzar el lead, los pasos pendientes se cancelan solos.
- **KPI que valida el éxito:** **% de seguimientos cumplidos a tiempo (>90%)** y nº de toques por lead (≥5).
- **🚀 GATE — Piloto ampliado:** con captura + respuesta + scoring + seguimiento, el producto es valioso para **5–10 corredoras**. Aprendizaje a mayor escala y primeras señales de disposición a pagar.

---

### 🟢 H5 — "El sistema recupera oportunidades frías"

- **Objetivo de negocio:** convertir leads "muertos" en ventas — capacidad **inexistente en competidores locales** (first-mover, FASE 3). Genera valor de la base de datos ya acumulada en los pilotos.
- **Capacidades habilitadas:**
  - Detección automática de leads fríos (30/60/90 días).
  - Recovery Center con cohortes y acciones en lote (reactivar, campaña, asignar, archivar).
  - Secuencias de reactivación específicas.
- **Dependencias técnicas:** cron diario (sweep sobre `lastActivityAt`) · evento `LeadWentCold` · Lead Recovery Engine · Recovery Center (FASE 10) · reutiliza Follow-Up/WhatsApp de H2/H4.
- **Riesgos:** (R) reactivación percibida como spam → mensajes diferenciados y límite de frecuencia; (R) falsos positivos de "frío" → umbral configurable por tenant.
- **Criterio de salida:** el sweep detecta fríos diariamente; el corredor reactiva en lote desde el Recovery Center; se mide cuántos vuelven al pipeline.
- **KPI que valida el éxito:** **tasa de recuperación** (% de fríos reactivados que responden) y leads recuperados → ventas.

---

### 🟢 H6 — "El corredor conduce el lead hasta el cierre"

- **Objetivo de negocio:** cerrar el ciclo de conversión — pipeline visual + agenda de visitas para llevar el lead de NUEVO a VENTA_CERRADA.
- **Capacidades habilitadas:**
  - Pipeline Kanban con drag & drop (estados mapeados al enum, FASE 10).
  - Agendar/confirmar visitas con sync a Google Calendar y recordatorios.
  - CRUD esencial de propiedades (soporte) para asociar a leads y visitas.
  - Marcar perdido con motivo (alimenta el análisis de fugas y el Recovery).
- **Dependencias técnicas:** Visit Scheduling + `CalendarProvider` (Google) · Pipeline UI · Property CRUD · transiciones de estado + `LeadTimelineEvent`.
- **Riesgos:** (R) OAuth/sync de Google Calendar → degradar a recordatorio interno si falla; (R) estados inconsistentes → la UI solo permite transiciones válidas del enum.
- **Criterio de salida:** un lead se mueve por todo el pipeline; se agenda una visita sincronizada; el cierre y la pérdida quedan registrados con trazabilidad completa.
- **KPI que valida el éxito:** **conversión por etapa** (embudo completo medible) y % de visitas concretadas.

---

### 🟢 H7 — "Una corredora se registra sola, paga y opera su equipo" 🚀

- **Objetivo de negocio:** pasar de pilotos a **negocio comercial self-serve** — onboarding sin fricción, cobro y administración de equipo. Habilita escalar sin venta manual.
- **Capacidades habilitadas:**
  - Signup self-serve → tenant nuevo en un `INSERT` (habilitado por el shared-schema de FASE 6).
  - Suscripción y cobro con Stripe (planes STARTER/PROFESSIONAL/ENTERPRISE) + enforcement de límites por plan.
  - Admin gestiona corredores (invitar, roles, reasignar) y ve el rendimiento del equipo.
  - Dashboard de Conversión completo a nivel de corredora.
- **Dependencias técnicas:** Billing + `PaymentProvider` (Stripe) + webhooks · FeatureLimit enforcement · gestión de usuarios/roles (RBAC completo) · Dashboard ejecutivo · flujo de onboarding.
- **Riesgos:** (R) fricción de onboarding mata la conversión → flujo guiado + conexión de WhatsApp asistida; (R) edge cases de billing (downgrade, past_due) → estados claros y degradación de acceso controlada.
- **Criterio de salida:** una corredora desconocida se registra, conecta WhatsApp, paga un plan, invita a su equipo y opera — sin intervención del equipo de CLIENTRA.
- **KPI que valida el éxito:** **conversión de signup→activación→pago** (funnel SaaS) y CAC/onboarding time.
- **🚀 GATE — Lanzamiento comercial.**

---

## 3. Grafo de dependencias entre hitos

```
H1 (captura+bandeja)
   └─▶ H2 (WhatsApp+TTFR) ──┬─▶ H3 (scoring)
                            ├─▶ H4 (seguimiento) ──▶ H5 (recovery)
                            └─▶ H6 (pipeline+visitas)
   (H3, H4, H6 pueden solaparse parcialmente tras H2)
                                                    └─▶ H7 (self-serve+billing)
```

- **H1 → H2 es estrictamente secuencial** (sin captura no hay qué responder).
- **H3, H4, H6 dependen de H2** pero son relativamente independientes entre sí → paralelizables si el equipo crece.
- **H5 depende de H4** (reutiliza cadencias) y de datos acumulados (mejor tras semanas de piloto).
- **H7 puede empezar en paralelo** desde H4, pero su gate de lanzamiento requiere el producto maduro.

---

## 4. Cómo el roadmap maximiza aprendizaje y minimiza time-to-pilot

| Decisión de secuencia | Por qué |
|-----------------------|---------|
| **WhatsApp+TTFR en H2 (no al final)** | Es la propuesta de valor central y la mayor brecha de mercado; ponerla temprano permite validar la tesis con clientes reales en ~4 sprints |
| **Piloto cerrado tras H2** | Se aprende del mercado con el mínimo producto que ya entrega valor — no se espera al sistema "completo" |
| **Billing/self-serve al final (H7)** | Cobrar antes de tener valor demostrado es prematuro; los pilotos validan disposición a pagar primero |
| **Recovery (H5) después de acumular datos** | Recuperar leads fríos requiere una base con historia; tiene más impacto tras semanas de piloto |
| **Scoring (H3) temprano pero después de responder** | Priorizar importa cuando ya hay flujo de leads y respuesta; valida si el score predice cierres con datos reales |

> **Estrategia de aprendizaje:** cada gate de piloto es un punto de medición. Si H2 no mejora el TTFR de la corredora piloto, se corrige el producto antes de invertir en H3–H7. El roadmap es un bucle de validación, no una línea recta.

---

## 5. Criterios transversales de avance (Definition of Done por hito)

Ningún hito se considera cerrado sin:
1. **Capacidad demostrable** a un corredor real (demo end-to-end, no "código mergeado").
2. **KPI del hito instrumentado** y visible en el dashboard.
3. **Aislamiento multi-tenant verificado** (test de CI en verde).
4. **Cobertura mínima** (dominio 90% / use cases 80%, FASE 5) y CI verde.
5. **Sin deuda crítica** (eslint-boundaries + madge sin violaciones, FASE 5).

---

## 6. Fuera del roadmap del MVP (explícito)

MLS · Canje · Marketplace · Publicación masiva a portales · Portal de propietarios · App móvil nativa · IA generativa avanzada (más allá de scoring/sugerencias) · multi-país (la arquitectura lo permite, pero no se construye hasta validar Chile). Coherente con FASES 1, 3 y 4.

---

### Estado de la fase
✅ **FASE 11 completada.** Próxima: **FASE 12 — Definición del MVP** (alcance exacto del primer producto comercializable: qué entra y qué no, criterios de aceptación, métricas de éxito del MVP y la definición precisa del piloto).
