# FASE 1 — Análisis del Mercado Inmobiliario Chileno

> Documento de fundamentación estratégica para **CLIENTRA**. Parte 1 de 13.
> Fecha de análisis: **junio 2026**. Datos consolidados más recientes: **cierre 2025 / enero 2026**.
> Toda cifra lleva fuente (ver §12). Los supuestos propios se marcan como *(a validar)*.

---

## 1. Resumen ejecutivo

El mercado inmobiliario chileno atraviesa una **transición de un ciclo de baja a uno de recuperación**: tras años de contracción por tasas altas e inflación, 2025 cerró con la demanda en sus mejores niveles desde 2021 y las tasas hipotecarias en mínimos de cinco años (~4,14% en diciembre 2025). Sin embargo, persiste un **sobre-stock histórico** (~106 mil viviendas en oferta, 40% con entrega inmediata) y una **velocidad de venta lenta** (36 meses para agotar el stock nacional).

Para CLIENTRA esto define el problema central de negocio: **en un mercado con más oferta que demanda efectiva, el lead deja de ser abundante y se vuelve escaso y caro. El diferencial competitivo de una corredora ya no es captar, sino convertir** — responder rápido, no olvidar seguimientos y priorizar a los compradores reales. Ese es exactamente el dolor que el producto debe eliminar.

Cinco hallazgos estructurales sostienen la oportunidad:

1. **Mercado fragmentado y desregulado.** ~15.000 corredores operando, ~10.800 entidades registradas en el SII, **sin ley vigente ni registro obligatorio** (recién en trámite legislativo). Industria atomizada, profesionalización incipiente → demanda latente de herramientas que ordenen la operación.
2. **Captación monopolizada por un portal.** Portal Inmobiliario (Mercado Libre) concentra **>70% de las búsquedas**; el resto del ecosistema (TocToc, Yapo, Houm, Proppit, etc.) compite por <30%. La captación es multicanal pero asimétrica → un CRM debe integrarse al ecosistema de portales, no competir con él.
3. **WhatsApp es el canal comercial de facto**, pero se gestiona de forma artesanal y sin trazabilidad → vector de pérdida de ventas y oportunidad clara de centralización.
4. **Brecha de Proptech local.** Existen CRMs (Dataprop, KiteProp, GlobalBrokers) y chatbots de IA, pero buena parte de las herramientas "no están diseñadas para los desafíos del corretaje local" → espacio para un producto vertical, chileno y bien integrado.
5. **TAM chileno modesto, tesis regional grande.** Chile solo da un TAM acotado (~US$10–15M ARR estimado *(a validar)*); la narrativa de inversión vive en LatAm: +250.000 corredores, ~8.500 agencias y un mercado de servicios CRM/datos de +US$334M anuales en la región. **Chile = beachhead; LatAm = TAM.**

---

## 2. Tamaño y dinámica del mercado

### 2.1 Volumen de transacciones
- **Q1 2025:** 8.900 viviendas vendidas a nivel nacional, **−18% vs. el trimestre anterior** (arranque débil). [CChC]
- **Tendencia anual 2025:** la demanda confirmó su recuperación y cerró el año en uno de sus **mejores niveles desde 2021**; reportes de prensa señalan un **+14% en ventas nacionales** en 2025, con fuerte repunte de la zona sur. [La Tercera]

### 2.2 Oferta y sobre-stock
- Oferta en niveles **históricamente altos: ~106.000 unidades**, de las cuales ~97.000 son departamentos. [CChC]
- **40% con entrega inmediata** (~42.000 unidades terminadas sin vender) → presión de venta y costo financiero para inmobiliarias.

### 2.3 Velocidad de venta (meses para agotar stock)
| Zona | Meses de stock |
|------|----------------|
| Nacional | **36** (deptos 39 · casas 22) |
| Norte | 31 |
| Centro | 28 |
| Sur (Biobío hacia abajo) | **18** (la más dinámica) |

- Zona sur: **+15% en ventas 2025 vs. 2024** (casas +24%, deptos +13%). [La Tercera / CChC]

### 2.4 Precios
- Región Metropolitana: departamentos **−4,3%**, viviendas unifamiliares **−3,5%** (ajuste a la baja que favorece al comprador). [CChC]

**Lectura para CLIENTRA:** ciclo de stock alto + venta lenta = cada lead es un activo escaso. El valor de un CRM se mide en *no dejar enfriar* prospectos y en *acortar el ciclo de cierre*. La heterogeneidad regional (sur dinámico vs. norte/centro lentos) sugiere que las métricas y alertas del producto deben ser **configurables por mercado**.

---

## 3. Contexto macro y de financiamiento

El financiamiento es el principal *gatekeeper* de la demanda residencial chilena.

- **Tasas hipotecarias:** promedio **~4,14% en diciembre 2025**, mínimo desde diciembre 2021. Alivio relevante al dividendo tras el ciclo restrictivo. [BioBioChile]
- **Subsidio al Dividendo (Estado):** rebaja de **60 pb** en la tasa para **viviendas nuevas de hasta 4.000 UF**, con promesas de compraventa desde el 01-01-2025; reduce la tasa entre **0,61% y 1,16%**. Vigente hasta el **27-05-2027** o hasta agotar **50.000 subsidios**. [MINVU / Hacienda]
- **Regla de endeudamiento:** dividendo mensual ≤ **25% del ingreso líquido** (criterio estándar de evaluación crediticia).

**Lectura para CLIENTRA:** la *calificación financiera del lead* (presupuesto realista, viabilidad del dividendo, elegibilidad de subsidio) es un eje de priorización de altísimo valor. El módulo de IA y el de leads deberían capturar y razonar sobre **presupuesto, pie disponible y elegibilidad de subsidio** para distinguir compradores reales de curiosos — un diferenciador concreto frente a CRMs genéricos.

---

## 4. Estructura de la industria y actores

### 4.1 Corredores e inmobiliarias
- **~15.000 corredores** operando en el país; **~10.800 entidades** (personas naturales o jurídicas) registradas en el SII. [Senado / ACOP]
- Mercado **atomizado**: predominan corredores individuales y pequeñas corredoras, junto a inmobiliarias (desarrolladoras) de mayor tamaño.
- Gremios: **ACOP** (Asociación de Corredores de Propiedades) y **ACOPROT**, que impulsan la profesionalización.

### 4.2 Segmentos de cliente para un SaaS
| Segmento | Perfil | Necesidad dominante | Plan probable |
|----------|--------|--------------------|---------------|
| Corredor independiente | 1 persona, multi-portal, WhatsApp | No perder leads, orden básico | STARTER |
| Corredora pequeña/mediana | 3–15 corredores | Asignación, pipeline, reportes, control de equipo | PROFESSIONAL |
| Inmobiliaria / red | Fuerza de venta, proyectos, alto volumen | Multi-tenant interno, métricas ejecutivas, integraciones | ENTERPRISE |

**Lectura para CLIENTRA:** el RBAC de tres roles del prompt (Super Admin / Administrador Inmobiliario / Corredor) calza con la realidad del mercado. El segmento de entrada natural (*beachhead*) es la **corredora pequeña/mediana**: suficientemente dolida por la pérdida de leads, con presupuesto, y con varios corredores que justifican pipeline + asignación + control.

---

## 5. Ecosistema de portales y captación de leads

- **Portal Inmobiliario** (controlado por **Mercado Libre** desde 2014, compra de US$40M) concentra **>70% del mercado de búsquedas** de propiedades. [La Tercera, sobre investigación de la FNE archivada en julio 2025]
- **TocToc + Yapo juntos < 15%.** Otros relevantes: **Houm, Proppit** (grupo Lifull Connect), **Doomos, Zoom Inmobiliario** (Equifax), **GoPlaceIt, ChilePropiedades, Enlace Inmobiliario**. [Emol / Similarweb]
- La **FNE** investigó el dominio del portal (Rol N°2518-18) y **archivó** el caso en julio 2025 → el statu quo de concentración se mantiene.

**Lectura para CLIENTRA:**
- La captación de leads es **multicanal pero asimétrica**: el grueso entra por Portal Inmobiliario, con cola larga de otros portales + Facebook/Instagram Ads + landing pages + formularios web + WhatsApp directo.
- El CRM **no compite con los portales: se integra a ellos**. La capacidad de *ingerir leads de múltiples portales en un solo inbox* es funcionalidad central (no accesoria).
- Dependencia de un actor dominante = **riesgo de plataforma**: la ingesta debe diseñarse con adaptadores desacoplados (email parsing, webhooks, scraping autorizado, API donde exista) para no quedar atado a un único método frágil.

---

## 6. Marco regulatorio y profesionalización

- **Hoy el corretaje NO está regulado:** no existe ley vigente, ni registro obligatorio, ni examen estatal para ejercer. [ACOP / Senado]
- **Proyecto de ley en trámite:** crea el **Registro Electrónico/Nacional de Corredores de Propiedades** (a cargo del Ministerio de Economía). Aprobado por la **Cámara de Diputados** y en revisión en la **Comisión de Economía del Senado**.
- En debate: la **exigencia de capacitación** (la norma menciona 432 horas; algunos actores proponen bajar a 80).

**Lectura para CLIENTRA:**
- La **profesionalización inminente** es un viento de cola: una industria que se formaliza demanda herramientas que documenten y ordenen la operación (trazabilidad, auditoría, reportes) — justo lo que un CRM aporta.
- Oportunidad de *roadmap*: a futuro, módulos de **cumplimiento y trazabilidad documental** (contratos, mandatos, due diligence) podrían anclarse al nuevo marco legal.
- **Sin un registro único todavía**, la verificación de identidad/idoneidad del corredor recae en el propio SaaS → posible valor agregado (perfil verificado) más adelante.

---

## 7. Madurez digital y panorama Proptech / CRM

- Adopción de Proptech **creciente pero desigual**; crítica recurrente: muchas plataformas **"no están diseñadas para los desafíos del corretaje local"**, requieren desarrollos extra o **no integran bien entre sí**. [Dataprop / Broota]
- **Competidores/adyacentes locales identificados** (detalle en FASE 3): **Dataprop, KiteProp, GlobalBrokers** (CRM + integración a portales), además de **chatbots de IA para WhatsApp** ya con tracción (un proveedor reporta 82 clientes, incluyendo Enaco, Manquehue y Paz).
- Referencia regional de tamaño: el corretaje en LatAm representa un mercado de **+US$334M anuales** en servicios CRM/acceso a datos, con **+250.000 corredores** y **~8.500 agencias**.

**Lectura para CLIENTRA:** el mercado ya validó la categoría (hay quién paga por CRM + IA + WhatsApp), pero el dolor de **integración y diseño local** sigue abierto. El posicionamiento ganador no es "otro CRM", sino **"el CRM vertical chileno que une portales + WhatsApp + IA de priorización en un solo flujo, sin integraciones frágiles"**. La inspiración de UX (HubSpot/Pipedrive/Linear/Notion) debe traducirse a la realidad local, no copiarse.

---

## 8. Comportamiento del comprador y del corredor

Síntesis del patrón operativo dominante (respaldado por la oferta de herramientas del mercado y el contexto descrito):

- **WhatsApp es el canal comercial principal** entre corredor y comprador; gran parte de la gestión vive ahí, sin trazabilidad ni respaldo si el corredor rota.
- **La velocidad de respuesta es decisiva:** el lead consulta varias propiedades/corredores a la vez; quien responde primero y hace seguimiento, gana. El tiempo de primera respuesta es un KPI crítico.
- **El seguimiento se pierde por falta de sistema:** recordatorios mentales, planillas Excel y la memoria del corredor → leads que se enfrían. Esta es, textualmente, la promesa de CLIENTRA.
- **El comprador es multicanal y asíncrono:** descubre en un portal, pregunta por WhatsApp, agenda visita, decide en semanas/meses → exige un *timeline* unificado por lead.

**Lectura para CLIENTRA:** las tres automatizaciones del prompt — **captura automática, asignación automática y seguimiento automático** — atacan directamente las causas de pérdida. El **tiempo de primera respuesta** y la **tasa de no-olvido de seguimientos** deberían ser métricas de primera clase del Dashboard.

---

## 9. Dimensionamiento de mercado para CLIENTRA (TAM / SAM / SOM)

> Ejercicio *bottom-up* **preliminar**. Los precios son hipótesis a contrastar en FASE 3 (competidores) y FASE 12 (pricing del MVP). Tipo de cambio referencial: US$1 ≈ CLP 950 *(a validar)*.

**Supuestos de pricing *(a validar)*:**
- STARTER ≈ CLP 29.000–39.000/mes · PROFESSIONAL ≈ CLP 79.000–99.000/mes · ENTERPRISE ≈ CLP 200.000+/mes.
- **ARPA combinado ≈ CLP 70.000/mes ≈ ~US$885/año.**

| Nivel | Definición | Universo | ARR potencial *(estimado)* |
|-------|-----------|----------|----------------------------|
| **TAM** (Chile) | Todas las entidades de corretaje registradas (~10.800) + inmobiliarias con fuerza de venta | ~11.000–15.000 cuentas | **~US$10–15M** |
| **SAM** (Chile) | Digitalmente activas, multi-lead, con disposición a pagar (~40–50% del TAM) | ~5.000–7.000 cuentas | **~US$4,5–6M** |
| **SOM** (Chile, año 3) | Captura realista para un nuevo entrante (3–5% del SAM) | ~150–350 cuentas | **~US$135k–310k ARR** |

**Conclusión de dimensionamiento:**
- El TAM **solo-Chile es modesto** para una tesis "respaldada por inversión": sirve para un negocio rentable y enfocado, no para retornos de capital de riesgo por sí solo.
- La **tesis venture vive en la expansión regional** (LatAm: +250.000 corredores, ~8.500 agencias, mercado CRM +US$334M). El producto debe nacer **multi-tenant, multi-moneda y localizable** desde el día 1 para que Chile sea un *beachhead* replicable, no un techo.

---

## 10. Implicaciones estratégicas para el producto

Traducción directa de los hallazgos a decisiones de CLIENTRA (insumo para FASES 4–12):

1. **Convertir > captar.** El producto se posiciona alrededor del *funnel de conversión y no-olvido*, no de la generación de leads. KPIs estrella: tiempo de primera respuesta y seguimientos cumplidos.
2. **Ingesta multicanal con adaptadores desacoplados.** Portal Inmobiliario (>70%) + otros portales + Meta Ads + landings + formularios + WhatsApp, normalizados a un modelo único de Lead. Mitiga el riesgo de plataforma.
3. **WhatsApp como ciudadano de primera clase**, no un *plugin*: bandeja centralizada, vínculo chat↔lead, plantillas y recordatorios.
4. **IA de priorización financiera-aware.** Clasificar/puntuar leads usando presupuesto, pie, dividendo viable y elegibilidad de subsidio — no solo intención textual. Capa de IA desacoplada (proveedor reemplazable), tal como exige el prompt.
5. **Multi-tenant + localización desde el día 1.** Moneda (CLP/UF), comuna/región, RUT, y arquitectura lista para otros países LatAm.
6. **Trazabilidad y auditoría como activo**, alineadas con la profesionalización regulatoria que viene.
7. **Beachhead: corredora pequeña/mediana** (3–15 corredores). El onboarding y el plan PROFESSIONAL deben optimizarse para ese ICP.
8. **UF y subsidios en el dominio del producto:** precios en UF, simuladores de dividendo y flags de elegibilidad agregan valor local que los CRMs genéricos no tienen.

---

## 11. Riesgos, supuestos y datos a validar

| # | Supuesto / Riesgo | Cómo validar | Impacto |
|---|-------------------|--------------|---------|
| R1 | Pricing y ARPA asumidos | Benchmark de competidores (FASE 3) + entrevistas | Alto (modelo de negocio) |
| R2 | Disposición a pagar del corredor independiente | Entrevistas / pre-venta del MVP | Alto |
| R3 | Viabilidad técnica de ingesta desde Portal Inmobiliario | PoC de email parsing / webhooks / API | Alto (feature central) |
| R4 | % de SAM "digitalmente activo" | Encuesta gremial (ACOP) / datos de uso | Medio |
| R5 | Dependencia de un portal dominante | Estrategia multi-fuente + relaciones directas | Medio |
| R6 | Avance y forma final de la ley de registro | Seguimiento legislativo | Medio (oportunidad/roadmap) |
| R7 | Estacionalidad y sensibilidad a tasas del mercado | Datos CChC trimestrales | Medio |

**Datos que faltan para cerrar el caso de negocio:** pricing exacto de competidores, tasa de adopción digital por segmento, costo de adquisición (CAC) por canal, y disponibilidad real de APIs de los portales. Se abordan en FASES 2 y 3.

---

## 12. Fuentes

- CChC / GlobalBrokers — *Informe Nacional Mercado Inmobiliario: ventas de viviendas cayeron 18% en el primer trimestre del 2025.* https://cchc.cl/noticias/informe-nacional-mercado-inmobiliario-ventas-de-viviendas-cayeron-18-en-el-primer-trimestre-del-2025
- La Tercera — *Ventas de viviendas a nivel nacional se incrementa 14% en 2025, con fuerte repunte de la zona sur.* https://www.latercera.com/pulso/noticia/ventas-de-viviendas-a-nivel-nacional-se-incrementa-14-en-2025-con-fuerte-repunte-de-la-zona-sur/
- La Tercera — *Portal Inmobiliario tiene más del 70% del mercado de búsquedas de propiedades, según investigación que archivó la FNE.* https://www.latercera.com/pulso/noticia/portal-inmobiliario-tiene-mas-del-70-del-mercado-de-busquedas-de-propiedades-segun-investigacion-que-archivo-la-fne/
- Emol — *Dominado por un "socio inevitable": Quién es quién en el negocio de búsqueda de propiedades online.* https://www.emol.com/noticias/Economia/2025/07/07/1171464/fne-portal-inmobiliario-informe.html
- Similarweb — *portalinmobiliario.com Competidores.* https://www.similarweb.com/es/website/portalinmobiliario.com/competitors/
- ACOP — *¿En qué está el proyecto de ley que crea el Registro Nacional de Corredores de Propiedades?* http://www2.acop.cl/noticias/en-que-esta-el-proyecto-de-ley-que-crea-el-registro-nacional-de-corredores-de-propiedades/
- Senado de Chile — *Registro de Corredores de Propiedades: debaten pertinencia y duración de los cursos.* https://www.senado.cl/noticias/propiedades/registro-de-corredores-de-propiedades-debaten-pertinencia-y-duracion-de
- GPremium — *Ley de Corretaje de Propiedades en Chile: ¿cómo vamos en 2026?* https://gpremium.cl/regulacion-gremial-corretaje-propiedades-acop/
- BioBioChile — *Tasas de interés de los hipotecarios cerraron 2025 en mínimos de cinco años.* https://www.biobiochile.cl/noticias/economia/actualidad-economica/2026/01/07/alivio-al-bolsillo-tasas-de-interes-de-los-hipotecarios-cerraron-2025-en-minimos-de-cinco-anos.shtml
- MINVU — *Nuevo Subsidio al Crédito Hipotecario.* https://www.minvu.gob.cl/nuevo-subsidio-al-credito-hipotecario/
- Ministerio de Hacienda — *Proyecto de subsidio al dividendo.* https://www.hacienda.cl/noticias-y-eventos/noticias/comision-de-hacienda-aprobo-en-particular-el-proyecto-de-subsidio-al-dividendo
- Dataprop — *Proptech en Chile: tendencias, ejemplos y oportunidades reales.* https://dataprop.cl/blog/proptech/
- Broota — *El gran desafío para el corretaje de propiedades en Chile.* https://blog.broota.com/2025/10/el-gran-desafio-para-el-corretaje-de-propiedades-en-chile/

---

### Estado de la fase
✅ **FASE 1 completada.** Próxima: **FASE 2 — Problemas actuales de las corredoras** (profundización cualitativa de los dolores operativos, priorizados por impacto en pérdida de ventas).
