-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NUEVO', 'CONTACTADO', 'INTERESADO', 'VISITA_AGENDADA', 'NEGOCIACION', 'RESERVA', 'VENTA_CERRADA', 'PERDIDO');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WHATSAPP', 'META_ADS', 'INSTAGRAM', 'LANDING', 'WEB_FORM', 'PORTAL', 'REFERIDO', 'OTRO');

-- CreateEnum
CREATE TYPE "LeadLostReason" AS ENUM ('SIN_RESPUESTA', 'FUERA_PRESUPUESTO', 'COMPRO_CON_OTRO', 'NO_CALIFICA_CREDITO', 'SOLO_CONSULTA', 'DUPLICADO', 'OTRO');

-- CreateEnum
CREATE TYPE "ScoreTier" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "ScoreSource" AS ENUM ('AI', 'HEURISTIC');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('NONE', 'PRE_APPROVED', 'APPROVED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AssignedBy" AS ENUM ('SYSTEM', 'MANUAL');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LLAMADA', 'WHATSAPP', 'EMAIL', 'REUNION', 'VISITA', 'NOTA', 'STATUS_CHANGE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FollowUpChannel" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'SENT', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "InactivityThreshold" AS ENUM ('DAYS_30', 'DAYS_60', 'DAYS_90');

-- CreateEnum
CREATE TYPE "RecoveryOutcome" AS ENUM ('PENDING', 'REACTIVATED', 'NO_RESPONSE', 'LOST');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('LEAD_CREATED', 'LEAD_ASSIGNED', 'LEAD_QUALIFIED', 'LEAD_STATUS_CHANGED', 'LEAD_WENT_COLD', 'LEAD_RECOVERED', 'VISIT_SCHEDULED', 'FIRST_RESPONSE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'CORREDOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PriceCurrency" AS ENUM ('UF', 'CLP');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('DEPTO', 'CASA', 'OFICINA', 'TERRENO', 'LOCAL', 'BODEGA', 'ESTACIONAMIENTO');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVA', 'RESERVADA', 'VENDIDA', 'INACTIVA');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VisitReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'SNOOZED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'TEMPLATE', 'IMAGE', 'DOCUMENT', 'AUDIO');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageTemplateStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "AIProviderType" AS ENUM ('OPENAI', 'ANTHROPIC', 'HEURISTIC');

-- CreateEnum
CREATE TYPE "ClassificationType" AS ENUM ('INTENT', 'SENTIMENT');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('NEXT_ACTION', 'SUGGESTED_REPLY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAD_ASSIGNED', 'LEAD_WENT_COLD', 'VISIT_REMINDER', 'FOLLOWUP_DUE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'STATUS_CHANGE', 'LOGIN', 'EXPORT');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rut" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "timezone" TEXT NOT NULL DEFAULT 'America/Santiago',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "price_clp" DECIMAL(12,2) NOT NULL,
    "billing_period" TEXT NOT NULL DEFAULT 'monthly',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_limits" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "feature_key" TEXT NOT NULL,
    "limit_value" INTEGER,
    "is_unlimited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "feature_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "stripe_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "stripe_invoice_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "issued_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "stripe_payment_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCEEDED',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_metrics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "metric_key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CORREDOR',
    "role_id" UUID,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "key" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID,
    "refresh_token_hash" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NUEVO',
    "budget_amount" DECIMAL(14,2),
    "budget_currency" "PriceCurrency" NOT NULL DEFAULT 'CLP',
    "down_payment" DECIMAL(14,2),
    "credit_status" "CreditStatus" NOT NULL DEFAULT 'NONE',
    "subsidy_eligible" BOOLEAN,
    "urgency" "UrgencyLevel",
    "assigned_user_id" UUID,
    "interested_property_id" UUID,
    "current_score_tier" "ScoreTier",
    "first_response_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lost_reason" "LeadLostReason",
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scores" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "score_value" INTEGER NOT NULL,
    "tier" "ScoreTier" NOT NULL,
    "reasons" JSONB,
    "source" "ScoreSource" NOT NULL DEFAULT 'HEURISTIC',
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_by" "AssignedBy" NOT NULL DEFAULT 'SYSTEM',
    "reason" JSONB,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),

    CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "user_id" UUID,
    "type" "ActivityType" NOT NULL,
    "summary" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tags" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#888888',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tag_links" (
    "lead_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "lead_tag_links_pkey" PRIMARY KEY ("lead_id","tag_id")
);

-- CreateTable
CREATE TABLE "lead_follow_ups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "sequence_step" INTEGER NOT NULL,
    "channel" "FollowUpChannel" NOT NULL DEFAULT 'WHATSAPP',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "executed_at" TIMESTAMP(3),
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_recoveries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "inactivity_threshold" "InactivityThreshold" NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recovery_action" JSONB,
    "outcome" "RecoveryOutcome" NOT NULL DEFAULT 'PENDING',
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "lead_recoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_timeline_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "event_type" "TimelineEventType" NOT NULL,
    "payload" JSONB,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "wa_contact_phone" TEXT NOT NULL,
    "assigned_user_id" UUID,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "last_message_at" TIMESTAMP(3),
    "window_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "wa_message_id" TEXT,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "body" TEXT,
    "template_id" UUID,
    "sent_by_user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_deliveries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "wa_template_name" TEXT NOT NULL,
    "category" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "status" "MessageTemplateStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_reminders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "channel" "FollowUpChannel" NOT NULL DEFAULT 'WHATSAPP',
    "send_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" "VisitReminderStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "visit_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_syncs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "provider" "CalendarProvider" NOT NULL DEFAULT 'GOOGLE',
    "external_event_id" TEXT,
    "sync_status" TEXT NOT NULL DEFAULT 'pending',
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "calendar_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "internal_code" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVA',
    "address" TEXT,
    "region" TEXT,
    "commune" TEXT,
    "price_amount" DECIMAL(14,2),
    "price_currency" "PriceCurrency" NOT NULL DEFAULT 'UF',
    "area_built_m2" INTEGER,
    "area_total_m2" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "description" TEXT,
    "assigned_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_features" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "property_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scoring_results" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "provider" "AIProviderType" NOT NULL,
    "model" TEXT,
    "raw_output" JSONB,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scoring_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_classifications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "classification_type" "ClassificationType" NOT NULL,
    "result" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_summaries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "content" TEXT NOT NULL,
    "accepted" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "key" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "provider_id" TEXT,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "actor_user_id" UUID,
    "action" "AuditActionType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "plans_tier_is_active_idx" ON "plans"("tier", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "feature_limits_plan_id_feature_key_key" ON "feature_limits"("plan_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenant_id_key" ON "subscriptions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripe_invoice_id_key" ON "invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_idx" ON "invoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_issued_at_idx" ON "invoices"("tenant_id", "issued_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_id_key" ON "payments"("stripe_payment_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_status_idx" ON "payments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "usage_metrics_tenant_id_period_idx" ON "usage_metrics"("tenant_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "usage_metrics_tenant_id_metric_key_period_key" ON "usage_metrics"("tenant_id", "metric_key", "period");

-- CreateIndex
CREATE INDEX "users_tenant_id_status_idx" ON "users"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "users_tenant_id_role_idx" ON "users"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_key_key" ON "roles"("tenant_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "leads_tenant_id_status_created_at_idx" ON "leads"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "leads_tenant_id_assigned_user_id_status_idx" ON "leads"("tenant_id", "assigned_user_id", "status");

-- CreateIndex
CREATE INDEX "leads_tenant_id_current_score_tier_last_activity_at_idx" ON "leads"("tenant_id", "current_score_tier", "last_activity_at");

-- CreateIndex
CREATE INDEX "leads_tenant_id_last_activity_at_idx" ON "leads"("tenant_id", "last_activity_at");

-- CreateIndex
CREATE INDEX "leads_tenant_id_phone_idx" ON "leads"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "leads_tenant_id_email_idx" ON "leads"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "leads_tenant_id_created_at_idx" ON "leads"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_scores_tenant_id_lead_id_scored_at_idx" ON "lead_scores"("tenant_id", "lead_id", "scored_at");

-- CreateIndex
CREATE INDEX "lead_assignments_tenant_id_lead_id_assigned_at_idx" ON "lead_assignments"("tenant_id", "lead_id", "assigned_at");

-- CreateIndex
CREATE INDEX "lead_assignments_tenant_id_user_id_assigned_at_idx" ON "lead_assignments"("tenant_id", "user_id", "assigned_at");

-- CreateIndex
CREATE INDEX "lead_activities_tenant_id_lead_id_occurred_at_idx" ON "lead_activities"("tenant_id", "lead_id", "occurred_at");

-- CreateIndex
CREATE INDEX "lead_activities_tenant_id_user_id_occurred_at_idx" ON "lead_activities"("tenant_id", "user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "lead_activities_tenant_id_type_occurred_at_idx" ON "lead_activities"("tenant_id", "type", "occurred_at");

-- CreateIndex
CREATE INDEX "lead_notes_tenant_id_lead_id_idx" ON "lead_notes"("tenant_id", "lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_tags_tenant_id_name_key" ON "lead_tags"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "lead_follow_ups_status_scheduled_at_idx" ON "lead_follow_ups"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "lead_follow_ups_tenant_id_lead_id_idx" ON "lead_follow_ups"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "lead_recoveries_tenant_id_outcome_idx" ON "lead_recoveries"("tenant_id", "outcome");

-- CreateIndex
CREATE INDEX "lead_recoveries_tenant_id_lead_id_detected_at_idx" ON "lead_recoveries"("tenant_id", "lead_id", "detected_at");

-- CreateIndex
CREATE INDEX "lead_timeline_events_tenant_id_lead_id_created_at_idx" ON "lead_timeline_events"("tenant_id", "lead_id", "created_at");

-- CreateIndex
CREATE INDEX "conversations_tenant_id_lead_id_idx" ON "conversations"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "conversations_tenant_id_status_last_message_at_idx" ON "conversations"("tenant_id", "status", "last_message_at");

-- CreateIndex
CREATE INDEX "conversations_tenant_id_wa_contact_phone_idx" ON "conversations"("tenant_id", "wa_contact_phone");

-- CreateIndex
CREATE INDEX "conversations_window_expires_at_idx" ON "conversations"("window_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_wa_message_id_key" ON "messages"("wa_message_id");

-- CreateIndex
CREATE INDEX "messages_tenant_id_conversation_id_created_at_idx" ON "messages"("tenant_id", "conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_deliveries_message_id_key" ON "message_deliveries"("message_id");

-- CreateIndex
CREATE INDEX "message_deliveries_tenant_id_status_idx" ON "message_deliveries"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_tenant_id_name_key" ON "message_templates"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "visits_tenant_id_scheduled_at_idx" ON "visits"("tenant_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "visits_tenant_id_user_id_scheduled_at_idx" ON "visits"("tenant_id", "user_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "visits_tenant_id_lead_id_idx" ON "visits"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "visit_reminders_status_send_at_idx" ON "visit_reminders"("status", "send_at");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_syncs_visit_id_key" ON "calendar_syncs"("visit_id");

-- CreateIndex
CREATE INDEX "properties_tenant_id_commune_type_status_idx" ON "properties"("tenant_id", "commune", "type", "status");

-- CreateIndex
CREATE INDEX "properties_tenant_id_status_idx" ON "properties"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "properties_tenant_id_internal_code_key" ON "properties"("tenant_id", "internal_code");

-- CreateIndex
CREATE INDEX "property_images_tenant_id_property_id_idx" ON "property_images"("tenant_id", "property_id");

-- CreateIndex
CREATE INDEX "property_features_tenant_id_property_id_idx" ON "property_features"("tenant_id", "property_id");

-- CreateIndex
CREATE INDEX "lead_scoring_results_tenant_id_lead_id_created_at_idx" ON "lead_scoring_results"("tenant_id", "lead_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_classifications_tenant_id_lead_id_idx" ON "ai_classifications"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "conversation_summaries_tenant_id_conversation_id_idx" ON "conversation_summaries"("tenant_id", "conversation_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_tenant_id_lead_id_idx" ON "ai_recommendations"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_user_id_read_at_idx" ON "notifications"("tenant_id", "user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_tenant_id_key_channel_key" ON "notification_templates"("tenant_id", "key", "channel");

-- CreateIndex
CREATE INDEX "notification_deliveries_tenant_id_status_idx" ON "notification_deliveries"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_type_created_at_idx" ON "audit_logs"("tenant_id", "entity_type", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_actor_user_id_created_at_idx" ON "audit_logs"("tenant_id", "actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "feature_limits" ADD CONSTRAINT "feature_limits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_interested_property_id_fkey" FOREIGN KEY ("interested_property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tag_links" ADD CONSTRAINT "lead_tag_links_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tag_links" ADD CONSTRAINT "lead_tag_links_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "lead_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_recoveries" ADD CONSTRAINT "lead_recoveries_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_timeline_events" ADD CONSTRAINT "lead_timeline_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_reminders" ADD CONSTRAINT "visit_reminders_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_syncs" ADD CONSTRAINT "calendar_syncs_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_features" ADD CONSTRAINT "property_features_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scoring_results" ADD CONSTRAINT "lead_scoring_results_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_classifications" ADD CONSTRAINT "ai_classifications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_summaries" ADD CONSTRAINT "conversation_summaries_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
