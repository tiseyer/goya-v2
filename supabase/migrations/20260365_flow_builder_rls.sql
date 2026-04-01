-- =============================================================================
-- Flow Builder RLS Policies
-- Migration: 20260364_flow_builder_rls
-- Enables Row Level Security on all 5 flow builder tables
-- Admin/moderator: full CRUD on content tables (flows, flow_steps, flow_branches)
-- Authenticated users: read-only on active content, own-data CRUD on responses
-- flow_analytics: authenticated insert own events, admin read all
-- =============================================================================


-- =============================================================================
-- flows
-- =============================================================================

ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active/template flows (needed for flow player)
CREATE POLICY "Authenticated users can read active flows"
  ON public.flows FOR SELECT TO authenticated
  USING (status IN ('active') OR is_template = true);

-- Admins/moderators have full access to all flows (any status)
CREATE POLICY "Admins and moderators can manage flows"
  ON public.flows
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


-- =============================================================================
-- flow_steps
-- =============================================================================

ALTER TABLE public.flow_steps ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read steps belonging to active flows
CREATE POLICY "Authenticated users can read steps of active flows"
  ON public.flow_steps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flows
      WHERE flows.id = flow_steps.flow_id AND flows.status = 'active'
    )
  );

-- Admins/moderators have full access
CREATE POLICY "Admins and moderators can manage flow steps"
  ON public.flow_steps
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


-- =============================================================================
-- flow_branches
-- =============================================================================

ALTER TABLE public.flow_branches ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read branches of active flow steps
CREATE POLICY "Authenticated users can read branches of active flows"
  ON public.flow_branches FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flow_steps
      JOIN public.flows ON flows.id = flow_steps.flow_id
      WHERE flow_steps.id = flow_branches.step_id AND flows.status = 'active'
    )
  );

-- Admins/moderators have full access
CREATE POLICY "Admins and moderators can manage flow branches"
  ON public.flow_branches
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


-- =============================================================================
-- flow_responses
-- =============================================================================

ALTER TABLE public.flow_responses ENABLE ROW LEVEL SECURITY;

-- Users can read their own responses
CREATE POLICY "Users can read own flow responses"
  ON public.flow_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert own flow responses"
  ON public.flow_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update own flow responses"
  ON public.flow_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all responses (for user management features)
CREATE POLICY "Admins can read all flow responses"
  ON public.flow_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Admins can update any response (reset, force-complete)
CREATE POLICY "Admins can manage all flow responses"
  ON public.flow_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Admins can insert responses on behalf of users (force-assign)
CREATE POLICY "Admins can insert flow responses"
  ON public.flow_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Admins can delete responses (full reset)
CREATE POLICY "Admins can delete flow responses"
  ON public.flow_responses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );


-- =============================================================================
-- flow_analytics
-- =============================================================================

ALTER TABLE public.flow_analytics ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert analytics events (tracked server-side)
CREATE POLICY "Authenticated users can insert analytics"
  ON public.flow_analytics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all analytics
CREATE POLICY "Admins can read all analytics"
  ON public.flow_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
