-- Add AI provider columns to admin_secrets (backward-compatible, nullable)
ALTER TABLE admin_secrets ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE admin_secrets ADD COLUMN IF NOT EXISTS model text;

-- Index for efficient AI key queries
CREATE INDEX IF NOT EXISTS idx_admin_secrets_provider ON admin_secrets (provider) WHERE provider IS NOT NULL;

COMMENT ON COLUMN admin_secrets.provider IS 'AI provider name (openai, anthropic) — NULL for general secrets';
COMMENT ON COLUMN admin_secrets.model IS 'AI model identifier — NULL for general secrets';
