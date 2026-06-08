-- INT-01: unique partial index en leads para evitar race condition en deduplicación.
-- Solo un lead activo (no PERDIDO, no eliminado) por (tenant, phone) y (tenant, email).
CREATE UNIQUE INDEX IF NOT EXISTS "leads_tenant_phone_active_unique"
  ON "leads" ("tenant_id", "phone")
  WHERE "phone" IS NOT NULL
    AND "deleted_at" IS NULL
    AND "status" != 'PERDIDO'::"LeadStatus";

CREATE UNIQUE INDEX IF NOT EXISTS "leads_tenant_email_active_unique"
  ON "leads" ("tenant_id", "email")
  WHERE "email" IS NOT NULL
    AND "deleted_at" IS NULL
    AND "status" != 'PERDIDO'::"LeadStatus";

-- INT-02: unique partial index en conversations para evitar race condition en findOrCreate.
-- Solo una conversación activa (no CLOSED) por (tenant, waContactPhone).
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_tenant_phone_active_unique"
  ON "conversations" ("tenant_id", "wa_contact_phone")
  WHERE "status" != 'CLOSED'::"ConversationStatus";
