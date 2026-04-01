CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,          -- first 8 chars of key for identification
  name text NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  last_used_at timestamptz,
  request_count bigint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_key_hash ON api_keys (key_hash) WHERE active = true;
CREATE INDEX idx_api_keys_created_by ON api_keys (created_by);

-- RLS disabled — accessed only via service role client
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
