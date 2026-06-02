-- RLS (Row-Level Security) como 4ª barrera de aislamiento multi-tenant (FASE 6 / FASE 8).
-- Defensa en profundidad: además del filtro a nivel de aplicación (TenantContext + repos),
-- la base impone el aislamiento por fila usando current_setting('app.current_tenant').
--
-- Producción: la app debe conectar con un rol NO-owner y ejecutar, por transacción,
--   SET app.current_tenant = '<tenantId>';
-- El owner del schema (migraciones/seed) NO está forzado, para no romper tareas de admin.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'leads', 'lead_scores', 'lead_assignments', 'lead_activities', 'lead_notes',
    'lead_follow_ups', 'lead_recoveries', 'lead_timeline_events',
    'conversations', 'messages', 'visits', 'properties'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%1$s ON %1$s
         USING (tenant_id = NULLIF(current_setting(''app.current_tenant'', true), '''')::uuid);',
      t
    );
  END LOOP;
END $$;
