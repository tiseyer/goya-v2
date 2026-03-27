CREATE TABLE IF NOT EXISTS admin_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL UNIQUE,
  encrypted_value text NOT NULL,
  iv text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_secrets_category ON admin_secrets (category);

-- RLS enabled — no policies means only service role can access
ALTER TABLE admin_secrets ENABLE ROW LEVEL SECURITY;
