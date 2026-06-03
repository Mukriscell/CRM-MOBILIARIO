# FASE 10 — Diseño UI/UX

> Documento de diseño para **CLIENTRA**. Parte 10 de 13.
> **Principio rector de la UX:** orientada a **acción**, no a información.
> Cada pantalla responde una sola pregunta: *"¿Qué debe hacer el corredor AHORA?"*
> Stack: Next.js 15 (App Router) · TailwindCSS · Shadcn/UI · React Query · Zustand.

---

## 0. Filosofía: cada pantalla provoca una acción

```
   ❌ UX de CRM tradicional          ✅ UX de CLIENTRA
   "Aquí están tus 340 leads"        "Estos 3 leads llevan 12 min sin respuesta → Responder"
   "Tienes 87% de ocupación"         "5 seguimientos vencen hoy → Hacer ahora"
   Gráfico de torta decorativo       "8 leads se enfriaron esta semana → Recuperar"
```

**Cuatro mandamientos de diseño:**
1. **Responder rápido** — lo urgente salta a la vista y se acciona en 1 clic.
2. **Dar seguimiento** — el sistema dice *a quién* y *cuándo*, no solo *cuántos*.
3. **Recuperar oportunidades** — los leads fríos tienen pantalla propia con acción.
4. **Convertir compradores** — cada vista empuja el lead a la siguiente etapa.

**Reglas duras de UX:**
- ❌ Cero dashboards decorativos · ❌ Cero métricas sin acción adjunta · ❌ Cero navegación centrada en propiedades.
- ✅ Toda métrica es **clicable** y lleva a la lista de leads que la componen (drill-to-action).
- ✅ Todo *empty state* propone la siguiente acción, no solo "no hay datos".

---

## 1. Arquitectura de información (navegación)

Orden del sidebar — **deliberadamente lead-céntrico**, Property casi al final:

```
┌─────────────────────────────┐
│  CLIENTRA            ◐ dark  │
├─────────────────────────────┤
│  ⚡ Conversión (Dashboard)   │ ← home tras login
│  📥 Bandeja de Leads         │ ← pantalla más usada
│  💬 Inbox WhatsApp     ● 3   │ ← badge de no leídos
│  🪜 Pipeline                 │
│  ✅ Seguimientos       ● 5   │ ← badge de vencidos hoy
│  ♻️  Recovery          ● 8   │ ← badge de candidatos
│  📅 Visitas                  │
│  ─────────────               │
│  🏠 Propiedades              │ ← SOPORTE (penúltimo)
│  👥 Equipo (admin)           │
│  ⚙️  Ajustes                 │
└─────────────────────────────┘
```

> **Los badges no son decorativos: son llamados a la acción.** Un número rojo en Seguimientos/Recovery significa "hay trabajo pendiente aquí ahora".

---

## 2. Sistema de diseño

| Elemento | Decisión |
|----------|----------|
| **Componentes** | Shadcn/UI (Radix + Tailwind) — accesible, themeable, sin lock-in de librería pesada |
| **Tema** | **Dark mode first** (corredores trabajan de noche/fines de semana — 62% de consultas fuera de horario, FASE 2) + light mode. Toggle persistente |
| **Layout** | **Mobile-first**: el corredor vive en el celular entre visitas. Sidebar colapsa a bottom-nav en móvil |
| **Color semántico** | 🔴 urgente/vencido · 🟠 enfriándose · 🟢 a tiempo/HOT · ⚪ neutro. Consistente en toda la app |
| **Score visual** | Badge HOT (🔥 rojo) / WARM (🟠) / COLD (🔵) — lectura instantánea de prioridad |
| **Tipografía** | Inter; números tabulares para métricas y tiempos |
| **Densidad** | Alta en tablas (el corredor escanea decenas de leads), cómoda en detalle |
| **Feedback** | Toasts para acciones; optimistic UI en mover etapa / marcar seguimiento (React Query) |
| **Command palette** | `⌘K` — buscar lead, ir a pantalla, acción rápida (productividad power-user) |

---

## 3. Las pantallas del MVP (plantilla acción-orientada)

> Cada pantalla declara: **Objetivo de negocio · Decisión del usuario · CTA primario · CTAs secundarios · KPI asociado.**

---

### 3.1 ⚡ Dashboard de Conversión (home post-login)

> No es un reporte. Es un **tablero de control de lo urgente**: cada tarjeta es una cola de trabajo accionable.

- **Objetivo de negocio:** que el corredor sepa *qué atacar primero* en los próximos 5 minutos.
- **Decisión del usuario:** ¿dónde está el riesgo de perder una venta hoy?
- **CTA primario:** **"Atender leads sin respuesta"** (botón en la tarjeta roja → abre Bandeja filtrada).
- **CTAs secundarios:** "Ver seguimientos de hoy", "Revisar recovery", "Ver pipeline".
- **KPI asociado:** Tiempo de primera respuesta (TTFR).

**Layout — tarjetas accionables (no gráficos decorativos):**
```
┌── 🔴 SIN RESPUESTA ────┐ ┌── 🟠 SEGUIMIENTOS HOY ─┐ ┌── ♻️ RECUPERABLES ─────┐
│  3 leads               │ │  5 vencen hoy          │ │  8 leads fríos         │
│  máx 14 min esperando  │ │  2 ya vencidos         │ │  potencial: 22 UF com. │
│  [Responder ahora →]   │ │  [Hacer seguimiento →] │ │  [Ir a Recovery →]     │
└────────────────────────┘ └────────────────────────┘ └────────────────────────┘

┌── Leads hoy ──┐ ┌── Esta semana ─┐ ┌── TTFR ────────┐ ┌── Conversión ──┐
│   12  ▲       │ │   58           │ │  4m 12s 🟢     │ │  18%  ▲ 2pts   │
│  (clic→lista) │ │  (clic→lista)  │ │  (clic→leads   │ │  (clic→funnel) │
└───────────────┘ └────────────────┘ │   lentos)      │ └────────────────┘
                                      └────────────────┘
```
> Las métricas de la fila inferior **son clicables** → drill a la lista de leads que las componen. Una métrica que no lleva a una acción no entra al dashboard.
> **Vista por rol:** Corredor ve *sus* colas; Admin ve las del equipo + rendimiento por corredor.

---

### 3.2 📥 Bandeja de Leads (la pantalla más importante)

> El centro de trabajo diario. Ordenada por **urgencia**, no por fecha.

- **Objetivo de negocio:** que ningún lead se enfríe por falta de atención.
- **Decisión del usuario:** ¿a quién contacto ahora y por qué canal?
- **CTA primario por fila:** **"WhatsApp"** (1 clic → abre el hilo en el Inbox con el lead vinculado).
- **CTAs secundarios:** Llamar · Agendar visita · Mover etapa · Asignar (admin).
- **KPI asociado:** Leads sin contacto · Tiempo sin respuesta.

**Tabla (columnas que pediste + señal de urgencia):**
```
| 🔥  | Nombre        | Teléfono     | Fuente   | Estado      | Responsable | Últ. act. | ⏱ Sin resp. | Acciones        |
|-----|---------------|--------------|----------|-------------|-------------|-----------|-------------|-----------------|
| 🔥  | Juan Pérez    | +569 1234... | WhatsApp | Nuevo       | Ana         | hace 12m  | 🔴 12 min    | 💬 📞 📅 ⋯       |
| 🟠  | María Soto    | +569 5678... | Meta Ads | Contactado  | Ana         | hace 2h   | 🟠 —         | 💬 📞 📅 ⋯       |
| 🔵  | Pedro Díaz    | +569 9012... | Landing  | Interesado  | Diego       | ayer      | ⚪ —         | 💬 📞 📅 ⋯       |
```
**Comportamiento accionable:**
- **Orden por defecto:** los `NUEVO` sin `first_response_at` arriba, ordenados por tiempo de espera descendente (lo más urgente primero).
- La columna **⏱ Sin respuesta** se pinta roja a partir de un umbral (configurable, ej. 5 min) → traduce el dato de FASE 2 (78% va con el primero) en una señal visual.
- **Acciones rápidas inline** sin abrir el lead: WhatsApp, llamar (`tel:`), agendar, mover etapa.
- **Filtros** (FASE 9 §8): estado, fuente, score, responsable, comuna, `cold`, búsqueda `q`. Paginación **cursor** (scroll infinito).
- Clic en fila → **Detalle de Lead** (§3.7).

---

### 3.3 💬 Inbox WhatsApp (ventaja competitiva)

> Inspiración: **Intercom / Front / Zendesk Messaging** — NO un CRM. Conversación a la izquierda, contexto del lead a la derecha.

- **Objetivo de negocio:** responder rápido y que la conversación quede vinculada y trazable (no en el teléfono personal).
- **Decisión del usuario:** ¿qué le respondo a este comprador para avanzarlo?
- **CTA primario:** **"Enviar"** (responder el mensaje).
- **CTAs secundarios:** Insertar plantilla · Sugerir respuesta (IA) · Agendar visita · Mover etapa · Vincular a lead.
- **KPI asociado:** Tiempo de primera respuesta · % conversaciones vinculadas a lead.

**Layout de 3 columnas (desktop) / stack (móvil):**
```
┌─ CONVERSACIONES ──┐┌─ HILO ─────────────────────┐┌─ CONTEXTO DEL LEAD ──────┐
│ 🔴 Juan P.  12m   ││  Juan: Hola, vi el depto…   ││  Juan Pérez   🔥 HOT      │
│ 🟠 María S.  2h   ││  ───────────────────────    ││  +569 1234 5678          │
│ ⚪ Pedro D.  ayer ││  Tú: ¡Hola Juan! Claro…     ││  Estado: Nuevo           │
│ ...               ││                             ││  Presupuesto: 4.500 UF   │
│                   ││  [ventana 24h: abierta ✓]   ││  Subsidio: elegible ✓    │
│                   ││  ┌─────────────────────────┐││  Propiedad: DPT-1024     │
│                   ││  │ Escribe… [📎][⚡plantilla]│││  ─────────────           │
│                   ││  │           [✨ sugerir IA] │││  [📅 Agendar visita]     │
│                   ││  └──────────────[Enviar →]──┘││  [🪜 Mover etapa]        │
└───────────────────┘└─────────────────────────────┘└──────────────────────────┘
```
**Detalles que importan:**
- **Estado de ventana 24h** visible: si está cerrada, el compositor obliga a usar **plantilla aprobada** (refleja la regla de FASE 9 §4.7).
- **✨ Sugerir IA**: el `AIProvider` propone una respuesta; el corredor edita y envía (nunca envía solo).
- El panel de contexto muestra los datos de **calificación financiera** (presupuesto, pie, subsidio) → el corredor decide con información de viabilidad a la vista.
- Conversación sin lead → botón **"Crear/Vincular lead"** (no perder el contacto).

---

### 3.4 🪜 Pipeline Kanban

> Tablero de arrastre. Mover una tarjeta **es** la acción de avanzar la venta.

- **Objetivo de negocio:** que cada lead avance de etapa y ninguno se estanque.
- **Decisión del usuario:** ¿qué lead muevo de etapa y cuál está atascado?
- **CTA primario:** **arrastrar tarjeta** a la siguiente columna (drag & drop → `POST /leads/:id/qualify` o cambio de estado).
- **CTAs secundarios:** WhatsApp · Agendar visita · Marcar perdido · Abrir detalle.
- **KPI asociado:** Conversión por etapa · leads estancados (días en columna).

**Columnas — alineadas al enum `LeadStatus` (FASE 6/8), con etiqueta en español:**
```
| Nuevo    | Contactado | Calificado  | Visita      | Negociación | Reserva | Cierre        | (Perdido) |
| NUEVO    | CONTACTADO | INTERESADO  | VISITA_     | NEGOCIACION | RESERVA | VENTA_CERRADA | PERDIDO   |
|          |            |             | AGENDADA    |             |         |               |           |
```
> **Resolución del drift detectado en el checkpoint:** la UI muestra *"Calificado"* y *"Cierre"*, pero **mapean exactamente** a los valores del enum `INTERESADO` y `VENTA_CERRADA`. La UI nunca inventa estados que la base no conoce — solo los etiqueta para el negocio. `PERDIDO` vive en una zona aparte (no es una columna de avance, es una salida).

**Comportamiento accionable:**
- Cada tarjeta muestra: nombre, score (🔥/🟠/🔵), días en la etapa (si excede umbral → 🔴 "estancado").
- Mover a `VISITA_AGENDADA` abre el modal de agendar visita (no solo cambia el estado).
- Mover a `PERDIDO` exige `lostReason` (alimenta el análisis de fugas de FASE 2 y el Recovery).
- WIP visible por columna (cuántos leads acumula cada corredor).

---

### 3.5 ♻️ Recovery Center (módulo de primer nivel — first-mover)

> Lo que ningún competidor local tiene como pantalla principal. **No escondido en ajustes.**

- **Objetivo de negocio:** convertir leads "muertos" en ventas — en un mercado con 36 meses de stock, el frío de hoy es el comprador de mañana.
- **Decisión del usuario:** ¿qué lead frío vale la pena reactivar y cómo?
- **CTA primario:** **"Reactivar"** (dispara secuencia de reactivación → `POST /lead-recovery/reactivate`).
- **CTAs secundarios:** Enviar campaña (lote) · Asignar corredor · Archivar (perdido definitivo).
- **KPI asociado:** Leads recuperados · tasa de recuperación.

**Layout por cohortes de inactividad:**
```
┌── 30 días (12) ────┐ ┌── 60 días (8) ─────┐ ┌── 90 días (5) ─────┐
│ ☐ Juan P. WARM     │ │ ☐ Luis R. COLD     │ │ ☐ Sofía M. COLD    │
│ ☐ Ana T.  WARM     │ │ ☐ Caro V. WARM     │ │ ...                │
│   última: hace 31d │ │   última: hace 63d │ │                    │
│ [Reactivar selecc.]│ │ [Reactivar selecc.]│ │ [Reactivar selecc.]│
└────────────────────┘ └────────────────────┘ └────────────────────┘
   [✉️ Enviar campaña a seleccionados]   [👤 Asignar corredor]   [🗄 Archivar]
```
> Selección múltiple → acción en lote. La cabecera muestra el **potencial de comisión recuperable** (nº leads × ticket promedio) para que la acción tenga peso económico visible — conecta directo con el ROI de FASE 2.

---

### 3.6 ✅ Centro de Seguimientos ("mis tareas")

> Vista de agenda del día. El corredor entra y sabe exactamente qué hacer y cuándo.

- **Objetivo de negocio:** eliminar el olvido de seguimientos (44% se rinde tras el primer contacto — FASE 2).
- **Decisión del usuario:** ¿cuál es mi próxima acción y con quién?
- **CTA primario:** **"Hacer"** (marca el seguimiento como hecho → registra `LeadActivity` y, si aplica, cancela/avanza la cadencia).
- **CTAs secundarios:** Posponer (snooze) · WhatsApp · Llamar · Reagendar.
- **KPI asociado:** % seguimientos cumplidos a tiempo · seguimientos vencidos.

**Vista cronológica del día:**
```
HOY — martes 2 jun
┌──────────────────────────────────────────────────────────┐
│ 🔴 09:00  Llamar a Juan Pérez  (vencido 15m)   [Hacer][💬]│
│ 🟠 10:00  Seguimiento María Soto (WhatsApp)    [Hacer][💬]│
│ ⚪ 14:00  Confirmar visita Pedro Díaz          [Hacer][📅]│
│ ⚪ 16:30  Reactivación Luis (auto-cadencia D14) [Hacer][💬]│
└──────────────────────────────────────────────────────────┘
VENCIDOS (2)  ▾     ESTA SEMANA (9)  ▾
```
> Mezcla **seguimientos manuales** y **pasos de cadencia automática** (Follow-Up Engine) en una sola lista — el corredor no distingue, solo ejecuta. Los vencidos se agrupan arriba en rojo.

---

### 3.7 🗂 Detalle de Lead (el caballo de batalla)

> Donde se trabaja un lead a fondo. Timeline + contexto + acciones, todo en una vista.

- **Objetivo de negocio:** dar al corredor todo lo necesario para dar el siguiente paso correcto.
- **Decisión del usuario:** ¿cuál es la próxima mejor acción para cerrar este lead?
- **CTA primario:** **"Siguiente acción sugerida"** (IA: ej. "Agendar visita" / "Enviar seguimiento") → `AIRecommendation`.
- **CTAs secundarios:** WhatsApp · Llamar · Agendar · Mover etapa · Nota · Tag · Marcar perdido.
- **KPI asociado:** conversión del lead · nº de toques.

**Layout:**
```
┌─ Juan Pérez  🔥 HOT (87)  · Nuevo · Fuente: WhatsApp ───────────────────┐
│ [💬 WhatsApp] [📞 Llamar] [📅 Visita] [🪜 Mover etapa]  [✨ Próxima acción]│
├──────────────────────────────┬──────────────────────────────────────────┤
│  TIMELINE (append-only)       │  CALIFICACIÓN FINANCIERA                  │
│  • hoy 09:12 Lead creado      │  Presupuesto: 4.500 UF                    │
│  • hoy 09:13 Asignado a Ana   │  Pie: 900 UF                              │
│  • hoy 09:13 Autorespuesta ✓  │  Crédito: Pre-aprobado ✓                  │
│  • hoy 09:30 WhatsApp recibido│  Subsidio dividendo: Elegible ✓           │
│  ...                          │  ─────────                                │
│  [+ Nota]  [+ Actividad]      │  Propiedad de interés: DPT-1024 Ñuñoa     │
│                               │  Seguimientos: D1 ✓ · D3 pendiente        │
└──────────────────────────────┴──────────────────────────────────────────┘
```
> El timeline es la **trazabilidad** de FASE 6 hecha visible: reconstruye toda la historia del lead. La columna de calificación pone la **viabilidad financiera** (el diferenciador) frente al corredor para que priorice bien.

---

### 3.8 📅 Visitas · 🏠 Propiedades (soporte)

**Visitas** — Objetivo: que las visitas agendadas se concreten. CTA primario: **"Confirmar"** (o reagendar). Secundarios: cancelar, recordatorio, abrir lead. KPI: % visitas confirmadas / no-show. Vista calendario + lista del día.

**Propiedades** (penúltimo en el nav, **soporte**) — Objetivo: tener el inventario disponible para asociar a leads y visitas. CTA primario: **"Nueva propiedad"**. Secundarios: editar, cambiar estado, asignar corredor. KPI: propiedades activas. **CRUD esencial, sin MLS/canje/publicación** (coherente con FASE 4/6). Su rol en la UX es *alimentar* al lead, nunca ser el punto de partida.

---

## 4. Patrones transversales orientados a acción

| Patrón | Cómo empuja a la acción |
|--------|--------------------------|
| **Empty states** | "No hay leads sin responder 🎉" en vez de tabla vacía; "Conecta WhatsApp para recibir leads → [Conectar]" |
| **Badges del sidebar** | Números rojos = trabajo pendiente; al resolverlo, desaparecen (refuerzo) |
| **Quick actions** | WhatsApp/Llamar/Agendar disponibles en bandeja, inbox, pipeline y detalle — nunca hay que "buscar dónde se hace" |
| **Command palette ⌘K** | Saltar a cualquier lead o ejecutar una acción sin navegar |
| **Optimistic UI** | Mover etapa / marcar seguimiento responde al instante (React Query); si falla, revierte con toast |
| **Notificaciones** | "Nuevo lead asignado: Juan (HOT)" con CTA directo "Responder" |
| **Responsive/móvil** | Bottom-nav con las 4 secciones de acción (Bandeja, Inbox, Seguimientos, Recovery); todo accionable con el pulgar |

---

## 5. Trazabilidad: pantalla → API → KPI → dolor que resuelve

| Pantalla | Endpoints (FASE 9) | KPI | Dolor (FASE 2) |
|----------|--------------------|-----|----------------|
| Dashboard Conversión | `/dashboard/*` | TTFR, conversión | P7 sin visibilidad |
| Bandeja de Leads | `/leads`, `/messages/send`, `/visits` | leads sin contacto, TTFR | P1 responden tarde |
| Inbox WhatsApp | `/conversations`, `/messages/*` | TTFR, % vinculadas | P1, P3 WhatsApp artesanal |
| Pipeline | `/leads/:id/qualify`, `/leads/:id/mark-lost` | conversión por etapa | P5 no priorizan |
| Recovery Center | `/lead-recovery/*` | leads recuperados | (brecha de mercado FASE 3) |
| Seguimientos | `/follow-ups/pending`, `/follow-ups/:id/cancel` | % seguimientos cumplidos | P2 olvidan seguimientos |
| Detalle de Lead | `/leads/:id/timeline`, `/lead-scoring/:id` | nº toques, conversión | P4 sin trazabilidad |

---

## 6. Lo que NO se diseña todavía (deferido)

MLS · Canje · Marketplace · Portal de propietarios · Publicación masiva a portales · **App móvil nativa** (el MVP es web responsive mobile-first, suficiente para el corredor en terreno). Coherente con FASE 1/3/4.

---

## 7. Estados, accesibilidad y rendimiento

- **Estados de toda vista:** loading (skeletons) · empty (con CTA) · error (con reintento) · success.
- **Accesibilidad:** Shadcn/Radix (focus, teclado, ARIA); contraste AA en dark y light; targets táctiles ≥44px.
- **Rendimiento percibido:** RSC para carga inicial, React Query para datos vivos, optimistic UI en acciones frecuentes, scroll infinito con cursor (FASE 9).
- **Internacionalización:** UI en español de Chile; formatos UF/CLP y fecha local (`shared-utils`, FASE 5).

---

### Estado de la fase
✅ **FASE 10 completada.** Próxima: **FASE 11 — Roadmap de desarrollo** (secuencia de construcción por hitos, dependencias técnicas, qué se construye primero y por qué, y los criterios de avance entre etapas).
