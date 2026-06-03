# DEMO H2 — WhatsApp + Tiempo de Primera Respuesta (TTFR)

> Hito **H2**: *"El corredor responde por WhatsApp y se mide el tiempo de respuesta."*
> Habilita el **piloto cerrado** (1–2 design partners).

---

## 1. Qué entrega H2

| Capacidad | Estado | Dónde |
|-----------|:------:|-------|
| Autorespuesta inmediata al entrar un lead (speed-to-lead) | ✅ | `SendAutoResponseUseCase` + listener `lead.created` |
| Inbox WhatsApp: conversaciones centralizadas y vinculadas al lead | ✅ | web `/whatsapp` + `GET /conversations` |
| El corredor responde desde la app (queda en el timeline) | ✅ | `POST /conversations/:id/messages` |
| Recepción de mensajes entrantes (webhook idempotente) | ✅ | `POST /messaging/webhook/whatsapp` |
| Medición de **TTFR** (tiempo a primera respuesta humana) | ✅ | `Lead.firstResponseAt` + `GET /leads/stats` |
| Dashboard con TTFR medio | ✅ | web `/` |
| Proveedor desacoplado (WhatsApp Cloud API / consola) | ✅ | `IMessagingProvider` |

---

## 2. Proveedor de mensajería: real vs. simulado

H2 funciona **sin credenciales de WhatsApp** para que puedas probar el flujo completo en local:

- **Sin credenciales** (`WHATSAPP_ACCESS_TOKEN` vacío) → `ConsoleMessagingProvider`: registra el envío en la consola y simula entrega. La conversación, la autorespuesta, la respuesta del corredor y el TTFR funcionan igual.
- **Con credenciales** (`WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`) → `WhatsAppCloudProvider`: envía de verdad por la Graph API de Meta.

El selector está en `MessagingModule` (factory por entorno).

---

## 3. Cómo probar el flujo en local

Con la app levantada (`docker compose up` o `pnpm dev`):

```bash
# 1) Login
TOKEN=$(curl -s localhost:4000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.cl","password":"clientra123"}' | jq -r .data.accessToken)

# 2) Entra un lead → se crea conversación + autorespuesta automática
curl -s localhost:4000/api/v1/lead-intake -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"source":"LANDING","contact":{"firstName":"Sofía","phone":"+56991234567"}}'

# 3) (Demo) Simula que el cliente responde por WhatsApp
curl -s localhost:4000/api/v1/messaging/simulate/inbound -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"fromPhone":"+56991234567","body":"Hola, me interesa el depto"}'

# 4) Abre el Inbox en la web (http://localhost:3000/whatsapp), selecciona la
#    conversación y responde → eso marca el TTFR del lead.

# 5) Verifica el TTFR medio
curl -s localhost:4000/api/v1/leads/stats -H "Authorization: Bearer $TOKEN" | jq
```

> En la web: **Dashboard → tarjeta "⚡ TTFR medio"** y **Inbox WhatsApp** (chat con burbujas, la autorespuesta aparece marcada como *automático*).

---

## 4. Validación automatizada (E2E)

```bash
pnpm --filter @clientra/api test:e2e:h2
```

Verifica 12 checks contra Postgres: intake → autorespuesta → mensaje entrante →
respuesta del corredor (marca TTFR) → idempotencia del TTFR → stats → aislamiento por tenant.

---

## 5. Limitaciones conocidas (H2)

1. **Mapeo multi-número:** el webhook real resuelve el tenant por `WHATSAPP_DEFAULT_TENANT_SLUG` (un número por piloto). El mapeo por `phone_number_id` llega después.
2. **Firma HMAC del webhook:** la verificación de `X-Hub-Signature-256` queda como hardening posterior.
3. **Plantillas y ventana 24h:** se registra `windowExpiresAt`, pero el envío fuera de ventana con plantilla aprobada se completa al integrar la cuenta real de WhatsApp Business.
4. **Cola asíncrona:** el envío es síncrono (rápido); pasar a BullMQ es parte de H4.

---

### Veredicto
✅ **H2 validado funcionalmente (E2E verde).** Con H1+H2 hay producto suficiente para iniciar el **piloto cerrado**.
