CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Membership',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','past_due','canceled','incomplete','trialing','paused','unpaid')),
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month'
    CHECK (interval IN ('month','year')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin/moderator full access
CREATE POLICY "Admin full access on subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','moderator')
    )
  );

-- Users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
