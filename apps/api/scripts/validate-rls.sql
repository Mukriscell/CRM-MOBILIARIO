-- Validación de RLS como barrera adicional de aislamiento multi-tenant.
-- Uso: PGPASSWORD=clientra psql -h localhost -U clientra -d clientra -f apps/api/scripts/validate-rls.sql
-- Esperado: owner ve 2; rol no-owner ve solo el tenant fijado en app.current_tenant; 0 sin tenant.

SELECT id AS tenant_a FROM tenants WHERE slug='demo';
\gset
SELECT id AS tenant_b FROM tenants WHERE slug='demo2';
\gset

INSERT INTO leads (id, tenant_id, first_name, source, status, last_activity_at, created_at, updated_at)
VALUES (gen_random_uuid(), :'tenant_a', 'RLS-A', 'LANDING', 'NUEVO', now(), now(), now());
INSERT INTO leads (id, tenant_id, first_name, source, status, last_activity_at, created_at, updated_at)
VALUES (gen_random_uuid(), :'tenant_b', 'RLS-B', 'LANDING', 'NUEVO', now(), now(), now());

DROP ROLE IF EXISTS clientra_rls_test;
CREATE ROLE clientra_rls_test NOLOGIN;
GRANT USAGE ON SCHEMA public TO clientra_rls_test;
GRANT SELECT ON leads TO clientra_rls_test;

\echo '== OWNER (bypass): espera 2 =='
SELECT count(*) AS total_owner FROM leads WHERE first_name LIKE 'RLS-%';

SET ROLE clientra_rls_test;
SET app.current_tenant = :'tenant_a';
\echo '== no-owner, tenant A: espera 1 (RLS-A) =='
SELECT count(*) AS a, coalesce(string_agg(first_name,','),'-') FROM leads WHERE first_name LIKE 'RLS-%';
SET app.current_tenant = :'tenant_b';
\echo '== no-owner, tenant B: espera 1 (RLS-B) =='
SELECT count(*) AS b, coalesce(string_agg(first_name,','),'-') FROM leads WHERE first_name LIKE 'RLS-%';
RESET app.current_tenant;
\echo '== no-owner, sin tenant: espera 0 =='
SELECT count(*) AS sin_tenant FROM leads WHERE first_name LIKE 'RLS-%';

RESET ROLE;
DELETE FROM leads WHERE first_name LIKE 'RLS-%';
REVOKE ALL ON leads FROM clientra_rls_test;
REVOKE ALL ON SCHEMA public FROM clientra_rls_test;
DROP ROLE IF EXISTS clientra_rls_test;
\echo '== limpieza OK =='
