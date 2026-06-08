-- SEC-06: API key por tenant para autenticar el webhook de formularios.
-- El endpoint POST /lead-intake/webhook/forms pasa a requerir X-Api-Key header.
ALTER TABLE "tenants" ADD COLUMN "webhook_api_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_webhook_api_key_key" ON "tenants"("webhook_api_key");
