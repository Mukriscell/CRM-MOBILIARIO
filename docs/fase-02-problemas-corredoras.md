# FASE 2 — Problemas Actuales de las Corredoras

> Documento de fundamentación estratégica para **CLIENTRA**. Parte 2 de 13.
> Profundización cualitativa y cuantitativa de los dolores operativos, **priorizados por impacto en pérdida de ventas**.
> Fecha: junio 2026. Cifras con fuente (§11). Supuestos propios marcados como *(a validar)*.

---

## 1. Tesis del problema

> **La corredora chilena promedio no pierde ventas por falta de leads, sino por la incapacidad de operar el lead que ya tiene.** El cuello de botella no está en marketing; está en la *ejecución comercial*: velocidad de respuesta, persistencia del seguimiento, calificación del comprador y trazabilidad de la conversación.

Esto se sostiene en tres hechos convergentes (de FASE 1 + evidencia de esta fase):
1. El mercado tiene **más oferta que demanda efectiva** (36 meses de stock) → el lead es escaso y disputado.
2. **El 78% de los compradores trabaja con el primer corredor que responde** → la ventana de captura se mide en minutos, no días.
3. La operación típica es **artesanal** (WhatsApp + memoria + Excel), sin sistema que garantice respuesta, seguimiento ni priorización.

El resultado: corredoras que **"trabajan más horas para conseguir menos resultados, mientras desperdician leads"** (Dataprop). CLIENTRA existe para cerrar esa brecha de ejecución.

---

## 2. Metodología de priorización

Cada dolor se evalúa por tres ejes:
- **Impacto en pérdida de ventas** (¿cuánta comisión se pierde por esto?)
- **Frecuencia / prevalencia** (¿le pasa a casi todas las corredoras?)
- **Resolubilidad por software** (¿un CRM bien diseñado lo elimina?)

Se ordenan de mayor a menor severidad y se mapean a una capacidad concreta del producto (§8).

---

## 3. Mapa de dolores (priorizado)

### 🔴 P1 — Responden tarde (*speed-to-lead* roto) — **SEVERIDAD CRÍTICA**
- **Síntoma:** el lead entra (portal, formulario, WhatsApp) y nadie responde en minutos. El corredor promedio internacional **tarda 917 minutos (>15 horas)** en responder un lead nuevo.
- **Causa raíz:** sin notificación instantánea ni asignación automática; los leads llegan a correos/inbox dispersos y se revisan "cuando se puede".
- **Evidencia / impacto:**
  - Responder en <5 min vs. 30 min → **21× más probabilidad de convertir** y **100× más de lograr contacto**.
  - Tras 10 min, las probabilidades de calificar caen **400%**.
  - **78% de los compradores cierra con el primer corredor que responde.**
  - **62% de las consultas llegan fuera de horario hábil** (tardes 18–21h y fines de semana) → sin automatización, se pierden por completo.
- **Mapea a:** captura + asignación automática, notificaciones en tiempo real, autorespuesta/bot de primer contacto (WhatsApp + IA).

### 🔴 P2 — Olvidan seguimientos (sin persistencia) — **SEVERIDAD CRÍTICA**
- **Síntoma:** se contacta una vez y el lead se enfría; "nadie le escribió en el momento adecuado" (Dataprop).
- **Causa raíz:** seguimiento basado en memoria/Excel, sin tareas ni recordatorios sistematizados.
- **Evidencia / impacto:**
  - **80% de las ventas requieren 5+ contactos de seguimiento**, pero **44% de los agentes se rinde tras el primero**.
  - Leads con **6+ intentos de contacto convierten 70% más**.
- **Mapea a:** motor de seguimiento automático (tareas, recordatorios, cadencias), alertas de leads "enfriándose", secuencias por estado del pipeline.

### 🟠 P3 — Gestión artesanal por WhatsApp (sin sistema) — **SEVERIDAD ALTA**
- **Síntoma:** toda la relación vive en el WhatsApp personal del corredor, sin estructura ni respaldo.
- **Causa raíz:** WhatsApp es el canal preferido del comprador chileno, pero se usa como app personal, no como canal CRM.
- **Impacto:** conversaciones no vinculadas a un lead/propiedad; imposible medir, auditar o dar continuidad; si el corredor rota o se va, **la cartera se va con él**.
- **Mapea a:** WhatsApp CRM (bandeja centralizada, vínculo chat↔lead↔propiedad, plantillas), propiedad de la data por el tenant.

### 🟠 P4 — Sin trazabilidad ni respaldo — **SEVERIDAD ALTA**
- **Síntoma:** no hay historial unificado de qué se conversó, ofreció o prometió a cada cliente.
- **Causa raíz:** información fragmentada entre personas y herramientas; "sin orden documental" (Dataprop).
- **Impacto:** decisiones a ciegas, conflictos con clientes, **riesgo reputacional y de malas prácticas** (tema ya bajo la lupa pública: reclamos a corredores y alertas gremiales en 2026). Sin trazabilidad tampoco hay defensa ante un reclamo.
- **Mapea a:** timeline/historial por lead, registro de actividades (llamadas, WhatsApp, correos, reuniones, visitas), auditoría, continuidad ante rotación.

### 🟡 P5 — No priorizan compradores reales — **SEVERIDAD MEDIA-ALTA**
- **Síntoma:** se trata igual al curioso que al comprador con crédito pre-aprobado; el tiempo se diluye.
- **Causa raíz:** ausencia de calificación (presupuesto, pie, dividendo viable, elegibilidad de subsidio) y de scoring de intención.
- **Impacto:** el recurso más caro —el tiempo del corredor— se gasta en leads que no cierran, mientras los reales se enfrían (se realimenta con P1 y P2).
- **Mapea a:** IA de clasificación y scoring *financiera-aware*, lead scoring, detección de intención de compra (diferenciador local de FASE 1).

### 🟡 P6 — No centralizan consultas (fragmentación multicanal) — **SEVERIDAD MEDIA-ALTA**
- **Síntoma:** los leads llegan por Portal Inmobiliario, TocToc, Yapo, Meta Ads, landings, formularios y WhatsApp, cada uno en su silo.
- **Causa raíz:** sin un *inbox* único que normalice fuentes a un modelo de lead común.
- **Impacto:** duplicados, leads que se caen entre canales, imposible atribuir qué fuente convierte (no se puede optimizar la inversión publicitaria).
- **Mapea a:** ingesta multicanal con adaptadores desacoplados, deduplicación, atribución de fuente.

### 🟢 P7 — Sin visibilidad gerencial (caja negra) — **SEVERIDAD MEDIA** *(dolor del rol admin/inmobiliaria)*
- **Síntoma:** el dueño/gerente no sabe cuántos leads entraron, en qué estado están, ni el rendimiento por corredor.
- **Causa raíz:** "sin reportería" (Dataprop); la información vive en cabezas y teléfonos individuales.
- **Impacto:** no se puede gestionar lo que no se mide; decisiones de equipo y de inversión a ciegas.
- **Mapea a:** Dashboard ejecutivo (leads, conversión, rendimiento por corredor, ventas), pipeline visible para el administrador.

---

## 4. Matriz de severidad

| Dolor | Impacto en ventas | Prevalencia | Resoluble por software | Severidad |
|-------|:----------------:|:-----------:|:----------------------:|:---------:|
| P1 Responden tarde | Muy alto | Muy alta | Sí (alta) | 🔴 Crítica |
| P2 Olvidan seguimientos | Muy alto | Muy alta | Sí (alta) | 🔴 Crítica |
| P3 WhatsApp artesanal | Alto | Muy alta | Sí (media) | 🟠 Alta |
| P4 Sin trazabilidad | Alto | Alta | Sí (alta) | 🟠 Alta |
| P5 No priorizan | Medio-alto | Alta | Sí (media, IA) | 🟡 Media-alta |
| P6 No centralizan | Medio-alto | Alta | Sí (media) | 🟡 Media-alta |
| P7 Sin visibilidad | Medio | Alta (admin) | Sí (alta) | 🟢 Media |

**P1 y P2 son el núcleo del MVP** (anticipa FASE 12): atacan directamente la mayor fuga de ventas y son altamente resolubles por software.

---

## 5. El costo de no hacer nada (cuantificación)

**Benchmarks internacionales (mercado USA, direccionales):** un lead mal gestionado equivale a **~US$7.500+** de comisión perdida; los leads no atendidos cuestan **~2 negocios/mes (~US$16.000)** a un agente.

**Estimación adaptada a Chile *(ilustrativa, a validar)*:**
- Propiedad tipo: ~3.500 UF · UF ≈ CLP 39.000 → ≈ CLP 136M (~US$143k).
- Comisión corretaje ≈ 2% + IVA por parte → ≈ **70 UF ≈ CLP 2,73M (~US$2.870) por negocio cerrado**.
- Si una corredora pierde **2 compradores reales al mes** por P1+P2, el costo de oportunidad ronda **~CLP 5,5M/mes (~US$5.700)**.

> Frente a ese costo, un SaaS de ~CLP 79.000/mes (plan PROFESSIONAL hipotético) tiene un **ROI evidente**: basta evitar **una** venta perdida al año para pagarse muchas veces. Este es el argumento comercial central de CLIENTRA.

---

## 6. El *customer journey* roto (estado actual)

```
Lead entra (Portal/Meta/WhatsApp/Landing)
        │
        ▼
[❌ P6] Cae en un silo por canal, sin inbox único
        │
        ▼
[❌ P1] Nadie responde en minutos (avg >15h) → 78% se va con otro corredor
        │
        ▼
[❌ P5] Si responden, no se califica: curioso = comprador real
        │
        ▼
[❌ P2] 1 solo contacto y se abandona (44%) → el lead se enfría
        │
        ▼
[❌ P3/P4] Lo poco gestionado vive en WhatsApp personal, sin historial ni respaldo
        │
        ▼
[❌ P7] El gerente no ve nada: no puede corregir ni medir
        │
        ▼
   💸 Venta perdida + inversión publicitaria desperdiciada
```

CLIENTRA reescribe este flujo: **captura → asigna → responde (auto) → califica (IA) → da seguimiento (cadencia) → registra (timeline) → mide (dashboard).**

---

## 7. A quién le duele (personas afectadas)

| Persona | Rol RBAC | Dolor dominante | "Job to be done" |
|---------|----------|-----------------|------------------|
| **Corredor** | Corredor | P1, P2, P3 | "Que ningún lead se me enfríe ni se me olvide." |
| **Administrador de corredora** | Admin Inmobiliario | P4, P6, P7 | "Ver y controlar la operación comercial completa." |
| **Gerente de inmobiliaria** | Admin Inmobiliario / Super Admin | P7, P5 | "Maximizar conversión de la fuerza de venta y el gasto en marketing." |

---

## 8. Matriz problema → capacidad de producto (trazabilidad a módulos)

> Puente directo hacia las FASES 4–13. Cada dolor tiene dueño en un módulo del prompt.

| Dolor | Capacidad CLIENTRA | Módulo del sistema |
|-------|--------------------|--------------------|
| P1 | Captura + asignación automática, notificaciones, autorespuesta | Leads · WhatsApp CRM · IA |
| P2 | Seguimiento automático: tareas, recordatorios, cadencias, alertas de enfriamiento | Seguimiento Comercial · CRM (pipeline) |
| P3 | Bandeja WhatsApp centralizada, vínculo chat↔lead, plantillas | WhatsApp CRM |
| P4 | Timeline e historial por lead, registro de actividades, auditoría | Seguimiento · CRM · Seguridad |
| P5 | Scoring e intención *financiera-aware*, priorización | Inteligencia Artificial · Leads |
| P6 | Ingesta multicanal + deduplicación + atribución de fuente | Leads · Integraciones |
| P7 | Métricas de leads, conversión, rendimiento por corredor | Dashboard Ejecutivo |
| (Conversión) | Pipeline Kanban con drag&drop por estado | CRM Inmobiliario |
| (Cierre) | Agenda de visitas con recordatorios | Agenda · Google Calendar |

---

## 9. Métricas de éxito (cómo sabremos que CLIENTRA resuelve el dolor)

KPIs *north-star* derivados de los dolores, a instrumentar en el Dashboard:
1. **Tiempo de primera respuesta (TTFR)** — objetivo: <5 min (ataca P1).
2. **% de seguimientos cumplidos a tiempo** — objetivo: >90% de las tareas en fecha (ataca P2).
3. **Nº de toques por lead antes de descartarlo** — objetivo: ≥5 (ataca P2).
4. **Tasa de conversión por etapa del pipeline** (ataca P5, P7).
5. **% de leads con fuente y conversación trazadas** — objetivo: 100% (ataca P3, P4, P6).
6. **Leads "enfriándose" detectados y reactivados** (ataca P2).

---

## 10. Riesgos y supuestos a validar

| # | Supuesto / Riesgo | Validación |
|---|-------------------|-----------|
| R1 | Las cifras de *speed-to-lead* (USA) aplican a Chile en magnitud similar | Medición propia post-MVP / piloto |
| R2 | La comisión y el ticket promedio asumidos | Datos de corredoras reales (entrevistas) |
| R3 | El corredor adoptará disciplina de cadencia si el sistema la facilita | Pruebas de usabilidad / onboarding |
| R4 | WhatsApp Cloud API permite el volumen/flujo requerido sin fricción de aprobación | PoC técnico (FASE 4+) |
| R5 | La IA de scoring será suficientemente precisa para confiar en ella | Validación con dataset de leads reales |

---

## 11. Fuentes

- AgentZap — *Real Estate Lead Response Statistics: 15 Numbers Every Agent Should Know in 2026.* https://agentzap.ai/blog/real-estate-lead-statistics
- iHomefinder — *Speed to Lead in Real Estate: Why the First 5 Minutes Matter.* https://www.ihomefinder.com/blog/uncategorized/speed-to-lead-real-estate/
- HousingWire — *The lead response gap that costs real estate agents $16K a month.* https://www.housingwire.com/articles/missed-calls-cost-agents-deals/
- Dataprop — *Bienes raíces en Chile: ¿qué está pasando y cómo deben gestionar corredores y agencias en 2026?* https://dataprop.cl/bienes-raices-en-chile/
- Dataprop — *Leads inmobiliarios: cómo convertir más sin aumentar tu inversión en publicidad.* https://dataprop.cl/leads-inmobiliarios/
- Agencia Pólvora — *Cómo una inmobiliaria puede dejar de perder leads con un CRM.* https://agenciapolvora.cl/blog/crm-inmobiliaria-perder-menos-leads/
- Cooperativa.cl — *Reclamos a corredores de propiedades: por qué responder no es suficiente.* https://www.cooperativa.cl/noticias/corporativo/noticias/marcas-negocios/reclamos-a-corredores-de-propiedades-por-que-responder-no-es-suficiente/2026-05-18/101211.html
- GlobalBrokers — *Corredores de propiedades bajo la lupa: miles de jugadores, altas ganancias y alertas por "malas prácticas".* https://globalbrokers.cl/diario-inmobiliario/corredores-de-propiedades-bajo-la-lupa-miles-de-jugadores-altas-ganancias-y

---

### Estado de la fase
✅ **FASE 2 completada.** Próxima: **FASE 3 — Análisis de competidores** (benchmark de Dataprop, KiteProp, GlobalBrokers y CRMs genéricos; pricing, fortalezas/debilidades y el espacio de diferenciación para CLIENTRA).
