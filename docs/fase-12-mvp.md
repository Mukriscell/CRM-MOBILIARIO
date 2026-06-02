# FASE 12 — Definición del MVP

> Documento de definición de producto para **CLIENTRA**. Parte 12 de 13.
> **Regla del MVP:** no intenta *parecer completo* — intenta **demostrar conversión real**.
> Define con precisión: qué entra · qué queda fuera · qué se promete al piloto · qué métrica prueba valor · qué es éxito suficiente para seguir invirtiendo.

---

## 0. La tesis que el MVP debe probar (una sola)

> **Si una corredora chilena usa CLIENTRA, responde más rápido, deja de olvidar seguimientos y recupera leads que daba por perdidos — y eso se traduce en más conversión.**

El MVP **no** existe para tener muchas funciones. Existe para **falsar o confirmar esa frase** con datos de una corredora real. Todo lo que no contribuya a probarla queda fuera, por bueno que sea.

Hipótesis cuantificada a validar en el piloto:
- **H-valor:** el TTFR de la corredora baja de horas a **< 5 minutos**.
- **H-comportamiento:** **>90%** de los seguimientos programados se cumplen (vs. el 44% que hoy abandona tras el primer toque).
- **H-conversión:** la **tasa de conversión lead→visita→cierre sube** de forma medible vs. su línea base.
- **H-recuperación:** un **% no trivial de leads fríos se reactiva** (capacidad que hoy no tienen).

---

## 1. Qué ENTRA en el MVP (alcance cerrado)

El MVP = **núcleo de conversión** = hitos **H1 → H5** del roadmap, más el mínimo de H6 para cerrar el ciclo. Cada inclusión se justifica por *"prueba conversión"*.

| # | Capacidad | Por qué entra (prueba conversión) |
|---|-----------|-----------------------------------|
| 1 | **Captura multicanal + bandeja única** (H1) | Sin capturar no hay nada que convertir. Base de todo |
| 2 | **Asignación automática** (H1) | Reduce el tiempo a primer contacto |
| 3 | **WhatsApp CRM + autorespuesta 24/7** (H2) | El canal real del comprador; ataca el dolor #1 |
| 4 | **Medición de TTFR** (H2) | Es **la métrica que prueba el valor** — debe existir desde el día 1 |
| 5 | **Lead Scoring financiera-aware** (H3) | Priorizar al viable sobre el curioso → mejor uso del tiempo |
| 6 | **Seguimiento automático por cadencias** (H4) | Ataca el dolor #2 (olvido); el producto trabaja solo |
| 7 | **Centro de Seguimientos** (H4) | El corredor sabe qué hacer hoy |
| 8 | **Lead Recovery** (H5) | Diferenciador first-mover; convierte la base muerta |
| 9 | **Pipeline + cambio de estado + marcar perdido** (H6 mínimo) | Para *medir* conversión por etapa y motivos de pérdida |
| 10 | **Agendar visita** (H6 mínimo) | Hito clave del embudo hacia el cierre |
| 11 | **Dashboard de Conversión** (KPIs) | Donde se lee si la tesis se cumple |
| 12 | **Multi-tenant + Auth/RBAC mínimo** | Requisito no negociable de aislamiento desde el primer dato real |
| 13 | **CRUD esencial de propiedades** | Soporte mínimo para asociar a leads/visitas (no más) |

---

## 2. Qué QUEDA FUERA del MVP (y por qué no daña la tesis)

| Excluido | Por qué NO es necesario para probar conversión |
|----------|------------------------------------------------|
| **Billing / Stripe / self-serve signup** (H7) | El piloto es **gratuito y onboardeado a mano**. Cobrar no prueba conversión; la prueba de pago viene *después* de demostrar valor. Tenants creados manualmente |
| **MLS, canje, marketplace, publicación a portales** | No tocan el ciclo de conversión; son el juego de los competidores que CLIENTRA *no* está jugando (FASE 3) |
| **Portal de propietarios** | Otro actor, otro problema; fuera de foco |
| **App móvil nativa** | La web mobile-first basta para el corredor en terreno (FASE 10) |
| **Google Calendar sync bidireccional completo** | El MVP agenda y recuerda *dentro* de CLIENTRA; el sync con Google puede ser one-way o diferirse si añade fricción |
| **Reportería avanzada / exportes / BI** | El Dashboard de Conversión con los KPIs clave es suficiente para validar |
| **IA generativa avanzada** (resúmenes largos, copiloto) | El scoring + sugerencia de respuesta bastan; lo demás es lujo |
| **Personalización profunda de cadencias por UI** | El MVP trae cadencias por defecto sensatas; editarlas desde la UI es post-MVP |
| **Roles granulares / permisos finos** | Tres roles (Super Admin/Admin/Corredor) bastan; permisos finos después |
| **Multi-país / multi-moneda operativa** | Chile-only (CLP/UF). La arquitectura lo permite, pero no se construye |

> **Criterio de exclusión:** si una función puede esperar sin impedir medir conversión en el piloto, **espera**. El MVP angosto y profundo gana al MVP ancho y superficial.

---

## 3. Qué se le PROMETE al piloto (contrato explícito)

> Promesa única y honesta — *underpromise, overdeliver*:

> **"En 4 semanas, vas a responder tus leads en minutos, no vas a olvidar ningún seguimiento, y vas a reactivar leads que dabas por perdidos. Te vamos a mostrar con números si eso te hizo convertir más."**

**Lo que SÍ se promete:**
- Todos tus leads (de los canales conectados) en una sola bandeja, sin perderse.
- Autorespuesta inmediata por WhatsApp 24/7.
- Seguimiento automático que no se te olvida.
- Una pantalla que te dice a quién llamar primero (scoring) y a quién recuperar.
- Un dashboard que te muestra tu tiempo de respuesta y tu conversión.

**Lo que NO se promete (gestión de expectativas):**
- No es un reemplazo de tu publicación en portales (sigues usando Portal Inmobiliario, etc.).
- No hace canje ni MLS.
- No factura todavía (es gratis durante el piloto).
- La IA *sugiere*, no responde sola sin tu visto bueno.

**Compromiso operativo con el piloto:** onboarding asistido (conexión de WhatsApp, carga inicial), soporte directo, y una **revisión semanal de métricas** con el corredor (esto es también el mecanismo de aprendizaje de mercado).

---

## 4. Definición precisa del piloto

| Parámetro | Definición |
|-----------|------------|
| **Perfil** | Corredora pequeña/mediana (3–15 corredores) — el ICP de FASE 1; con flujo real de leads y dolor de seguimiento |
| **Cantidad** | 1–2 *design partners* tras H2 (piloto cerrado); 5–10 tras H4 (piloto ampliado) |
| **Duración** | 4 semanas mínimo por corredora (suficiente para ver un ciclo de leads y recuperación) |
| **Datos** | Conexión de WhatsApp real + al menos un canal de captura (landing/Meta/forms) |
| **Línea base** | Antes de arrancar, se registra su TTFR y conversión *actuales* (aunque sea estimada) para comparar |
| **Cadencia de aprendizaje** | Revisión semanal de KPIs + entrevista cualitativa |
| **Costo para el piloto** | Gratuito (no hay billing en el MVP) |

---

## 5. La métrica que PRUEBA valor

> **Métrica north-star del MVP: Tiempo de Primera Respuesta (TTFR).**
> Es la más directamente atacable, la más conectada a la conversión (responder en <5 min = 21× más conversión, FASE 2) y la más fácil de mostrar "antes vs. después".

**Métricas de soporte (confirman la cadena de valor):**
| Métrica | Qué prueba | Meta en el piloto |
|---------|-----------|-------------------|
| **TTFR** (north-star) | Speed-to-lead | de horas → **< 5 min** |
| % seguimientos cumplidos | No-olvido | **> 90%** |
| Leads recuperados | Capacidad first-mover | **> 0 y creciente** (hoy = 0) |
| Conversión lead→visita | Avance del embudo | **sube vs. línea base** |
| Conversión lead→cierre | Resultado final | **sube vs. línea base** |
| % leads con conversación trazada | Fin del WhatsApp artesanal | **100%** |

> **Por qué TTFR y no "leads cerrados":** el cierre inmobiliario tarda semanas/meses; un piloto de 4 semanas no alcanza a mostrar muchos cierres. El TTFR y los seguimientos cumplidos son **indicadores adelantados (leading)** que *predicen* conversión y se mueven dentro del piloto. Se reportan cierres como confirmación, pero el valor se prueba con los leading.

---

## 6. Qué sería ÉXITO SUFICIENTE para seguir invirtiendo (go/no-go)

> Umbral de decisión explícito al cierre del piloto. **Go** = construir H6 completo + H7 (billing) e ir a comercializar. **No-go / pivot** = el producto no movió la aguja, corregir antes de invertir más.

### ✅ Criterio GO (seguir invirtiendo) — se cumplen TODOS:
1. **Valor demostrado:** TTFR de la corredora baja a **< 5 min** de forma sostenida.
2. **Adopción real:** los corredores **usan la bandeja y el inbox a diario** (no abandonan tras la semana 1) — uso activo > 60% de días hábiles.
3. **Comportamiento cambiado:** **> 90%** de seguimientos cumplidos vs. su práctica previa.
4. **Señal de conversión:** mejora medible en conversión lead→visita **o** al menos recuperación de leads antes muertos (> 0).
5. **Disposición a pagar:** al menos **1 de cada 2** corredoras piloto declara que **pagaría** el plan PROFESSIONAL (señal cualitativa fuerte) — idealmente con carta de intención.

### 🟡 Criterio PIVOT (corregir antes de escalar):
- Hay valor en TTFR pero **baja adopción** → problema de UX/onboarding, no de tesis → iterar la experiencia.
- Adopción alta pero **sin señal de conversión ni pago** → revisar el ICP o la propuesta de valor.

### 🔴 Criterio NO-GO (la tesis no se sostiene):
- Ni el TTFR mejora, ni los corredores usan el producto, ni hay disposición a pagar → la hipótesis central está mal; reconsiderar el problema antes de seguir.

> **Suficiente, no perfecto:** no se exige probar el ROI completo de ventas cerradas (imposible en 4 semanas). Se exige evidencia *adelantada* y creíble de que la conversión mejora y de que alguien pagaría. Eso basta para justificar la siguiente inversión (H6+H7).

---

## 7. Criterios de aceptación del MVP (Definition of Done del producto)

El MVP se considera listo para piloto cuando, end-to-end y con aislamiento multi-tenant verificado:
1. ✅ Un lead entra por al menos un webhook real, se deduplica y se asigna automáticamente.
2. ✅ Recibe autorespuesta por WhatsApp en < 60 s, 24/7.
3. ✅ El corredor sostiene la conversación en el Inbox, vinculada al lead.
4. ✅ Cada lead tiene un score (HOT/WARM/COLD), con fallback heurístico si el LLM cae.
5. ✅ Se disparan cadencias automáticas y el corredor ve sus seguimientos del día.
6. ✅ El sweep detecta leads fríos y el corredor los reactiva desde el Recovery Center.
7. ✅ El lead se mueve por el pipeline; se agenda una visita; se marca cierre/pérdida con motivo.
8. ✅ El Dashboard muestra TTFR, conversión y leads recuperados en tiempo real.
9. ✅ Todo lo anterior con CI verde, cobertura mínima y test de aislamiento por tenant.

---

## 8. Resumen ejecutivo del MVP

| Pregunta | Respuesta |
|----------|-----------|
| **¿Qué entra?** | Captura→bandeja, WhatsApp+TTFR, scoring, seguimiento, recovery, pipeline/visita mínimos, dashboard. (H1–H5 + H6 mínimo) |
| **¿Qué queda fuera?** | Billing/self-serve, MLS/canje/marketplace, app nativa, reportería avanzada, IA generativa, multi-país |
| **¿Qué se promete al piloto?** | "Respondes en minutos, no olvidas seguimientos, recuperas leads perdidos — y te lo mostramos con números." Gratis, onboardeado a mano |
| **¿Qué métrica prueba valor?** | **TTFR < 5 min** (north-star) + % seguimientos cumplidos + leads recuperados + conversión vs. línea base |
| **¿Qué es éxito suficiente?** | TTFR < 5 min sostenido + uso diario + >90% seguimientos + señal de conversión/recuperación + 1 de 2 pilotos dispuesto a pagar |

---

### Estado de la fase
✅ **FASE 12 completada.** Con esto concluye la **fase de diseño (FASES 1–12)**.
Próxima y última: **FASE 13 — Generación del sistema módulo por módulo**, comenzando por el hito **H1** del roadmap (captura → asignación → bandeja), construido como vertical slice listo para producción.
