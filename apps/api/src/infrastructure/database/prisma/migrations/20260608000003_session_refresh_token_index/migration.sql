-- Index on refresh_token_hash for O(1) lookup in findActiveByHash (SEC-03).
-- Without this, every token refresh performs a full table scan.
CREATE INDEX IF NOT EXISTS "user_sessions_refresh_token_hash_idx"
  ON "user_sessions"("refresh_token_hash");
