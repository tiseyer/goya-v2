-- Phase 19: upgrade_requests and user_designations tables
-- Required by: Phase 15 (designation soft-delete), Phase 17 (upgrade flow), Phase 18 (admin inbox)

-- ---------------------------------------------------------------------------
-- Table 1: upgrade_requests
-- Tracks Teacher Upgrade submissions from submission through admin review.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.upgrade_requests (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                    text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  certificate_urls          text[] NOT NULL DEFAULT '{}',
  stripe_payment_intent_id  text,
  stripe_subscription_id    text,
  rejection_reason          text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  reviewed_at               timestamptz,
  reviewed_by               uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own upgrade requests
CREATE POLICY "Users can read own upgrade_requests"
  ON public.upgrade_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins and moderators can read and write all upgrade requests
CREATE POLICY "Admins can manage upgrade_requests"
  ON public.upgrade_requests
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE TRIGGER update_upgrade_requests_updated_at
  BEFORE UPDATE ON public.upgrade_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_user_id ON public.upgrade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON public.upgrade_requests(status);

-- ---------------------------------------------------------------------------
-- Table 2: user_designations
-- One row per designation product owned by a user.
-- Soft-delete: deleted_at IS NULL means active; set deleted_at to soft-delete.
-- Never hard-delete — preserve purchase history for audit.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_designations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_product_id text NOT NULL,
  stripe_price_id   text NOT NULL,
  purchase_date     timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  deleted_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.user_designations ENABLE ROW LEVEL SECURITY;

-- Users can read their own designations (including soft-deleted, for full history)
CREATE POLICY "Users can read own user_designations"
  ON public.user_designations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can soft-delete (UPDATE) their own active designations
CREATE POLICY "Users can soft-delete own user_designations"
  ON public.user_designations
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Admins and moderators can read and write all designations
CREATE POLICY "Admins can manage user_designations"
  ON public.user_designations
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE INDEX IF NOT EXISTS idx_user_designations_user_id ON public.user_designations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_designations_active ON public.user_designations(user_id) WHERE deleted_at IS NULL;
