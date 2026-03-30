CREATE TABLE IF NOT EXISTS public.flow_action_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id uuid NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.flow_steps(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  executed_at timestamptz DEFAULT now() NOT NULL
);

-- Idempotency constraint: one execution per (flow, user, step, action_type)
ALTER TABLE public.flow_action_executions
  ADD CONSTRAINT flow_action_executions_unique
  UNIQUE (flow_id, user_id, step_id, action_type);

-- Index for quick lookups when checking idempotency
CREATE INDEX flow_action_executions_lookup
  ON public.flow_action_executions (flow_id, user_id, step_id);

-- RLS: users can only see their own executions, service role bypasses
ALTER TABLE public.flow_action_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own action executions"
  ON public.flow_action_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages action executions"
  ON public.flow_action_executions FOR ALL
  USING (auth.role() = 'service_role');
