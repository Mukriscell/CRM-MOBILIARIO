# WhatsApp en producción + plantillas — Guía para CLIENTRA

> Objetivo: poder enviar mensajes a **cualquier cliente real** (no solo números en
> lista blanca) y cumplir la regla de la **ventana de 24 horas** de WhatsApp usando
> plantillas aprobadas.
>
> Fecha: 2026-06-09

---

## Contexto: por qué se necesita esto

Hoy CLIENTRA envía mensajes de **texto libre** (`type: "text"`). Eso solo funciona:
- A números en la **lista blanca** (modo sandbox), o
- Dentro de la **ventana de 24h** desde que el cliente te escribió.

Para iniciar conversación con un cliente nuevo (lead de portal/landing/Meta Ads que
**no** te escribió por WhatsApp) o para los **follow-ups** (Día 1/3/7/14, casi siempre
fuera de las 24h), WhatsApp **obliga** a usar una **plantilla aprobada**.

Dato útil: el modelo `Conversation` ya guarda `windowExpiresAt`, así que CLIENTRA puede
**detectar solo** si está dentro o fuera de la ventana y elegir texto libre vs plantilla.

---

## Parte 1 — Pasar Meta a producción (trámite, sin código)

1. **Verificar el negocio (Business Verification)**
   - [business.facebook.com](https://business.facebook.com) → Configuración del negocio →
     Centro de seguridad → **Iniciar verificación**.
   - Necesitas: nombre legal de la empresa, dirección, teléfono o sitio web, y a veces un
     documento (ej. inicio de actividades / patente). En Chile suele pedir datos del RUT.

2. **Agregar método de pago**
   - WhatsApp Manager → Configuración de pagos → agregar tarjeta. (El envío de plantillas
     tiene costo por conversación; hay un tramo gratis mensual.)

3. **Token permanente (System User)** — para no renovar cada 24h
   - Configuración del negocio → Usuarios → **Usuarios del sistema** → crear uno (rol Admin).
   - Asignarle la app de WhatsApp.
   - **Generar token** con permisos `whatsapp_business_messaging` y
     `whatsapp_business_management` → este token **no expira**.
   - Ponerlo en **Railway → servicio API → Variables → `WHATSAPP_ACCESS_TOKEN`**.

4. **Confirmar el número de WhatsApp Business** en producción (WhatsApp Manager → tu número).

---

## Parte 2 — Crear las plantillas en Meta

WhatsApp Manager → **Plantillas de mensajes** → Crear plantilla.
- **Categoría:** para CLIENTRA casi todo es **UTILITY** (servicio/seguimiento). Marketing
  tiene más restricciones y costo.
- **Idioma:** Español (es).
- **Aprobación:** suele tardar de minutos a 24h.

Plantillas recomendadas (los `{{n}}` son variables que CLIENTRA rellena):

| Uso en CLIENTRA | Nombre sugerido | Texto |
|---|---|---|
| Bienvenida / primer contacto | `lead_bienvenida` | `Hola {{1}}, gracias por tu interés. Soy {{2}} de la corredora y te ayudaré con tu búsqueda. ¿Te acomoda que coordinemos una visita?` |
| Follow-up Día 1 | `seguimiento_dia1` | `Hola {{1}}, ¿alcanzaste a ver la información que te envié? Quedo atento a tus dudas.` |
| Follow-up Día 3 | `seguimiento_dia3` | `Hola {{1}}, sigo disponible para mostrarte propiedades que calcen con lo que buscas. ¿Coordinamos?` |
| Follow-up Día 7 / 14 | `seguimiento_recordatorio` | `Hola {{1}}, paso a recordarte que sigo a tu disposición cuando retomes tu búsqueda. ¡Saludos!` |

> Se puede usar **una sola** plantilla parametrizada para los follow-ups si se prefiere
> simplicidad; el plan de código contempla configurar el nombre por cadencia.

---

## Parte 3 — Plan de implementación en CLIENTRA (código)

Cuando ya tengas **al menos una plantilla aprobada** (necesito su nombre exacto e idioma),
implementamos:

1. **Abstracción de mensajería** (`messaging-provider.interface.ts`)
   - Extender `OutboundMessage` con una variante de plantilla:
     ```ts
     interface OutboundMessage {
       to: string;
       body?: string; // texto libre (dentro de la ventana 24h)
       template?: { name: string; languageCode: string; params?: string[] };
     }
     ```

2. **WhatsAppCloudProvider** (`whatsapp-cloud.provider.ts`)
   - Si viene `template`, armar el payload `type: "template"` con `name`, `language` y
     `components` (parámetros del cuerpo). Si viene `body`, seguir con `type: "text"`.

3. **Selección automática texto vs plantilla**
   - En `SendMessageUseCase` y en el envío de follow-ups: comparar `now` con
     `conversation.windowExpiresAt`.
     - Dentro de la ventana → texto libre.
     - Fuera de la ventana (o conversación nueva business-initiated) → plantilla.

4. **Configuración por entorno** (Railway)
   - `WHATSAPP_TEMPLATE_BIENVENIDA`, `WHATSAPP_TEMPLATE_DIA1`, etc., con los nombres
     aprobados. Así se cambian sin re-deploy de código.

5. **Autorespuesta** (`SendAutoResponseUseCase`)
   - Si el lead vino de una fuente **no-WhatsApp**, el primer contacto es business-initiated
     → usar `lead_bienvenida`. Si vino por WhatsApp (cliente escribió primero) → texto libre.

**Esfuerzo estimado:** ~1 sesión una vez que existan las plantillas aprobadas.

---

## Orden recomendado

1. Hacer el trámite de la **Parte 1** (producción + token permanente).
2. Crear y **aprobar** las plantillas de la **Parte 2** (empezar con `lead_bienvenida`).
3. Avisarme los **nombres exactos** de las plantillas aprobadas → implementamos la Parte 3.
4. Probar: crear un lead de fuente no-WhatsApp → debe llegar la plantilla de bienvenida;
   dejar pasar la ventana de 24h → un follow-up debe salir como plantilla.

> Mientras tanto, en sandbox todo lo demás de CLIENTRA sigue funcionando con tu número en
> lista blanca.
