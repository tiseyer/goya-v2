-- =============================================================================
-- Flow Builder Tables
-- Migration: 20260363_flow_builder_tables
-- Creates: flows, flow_steps, flow_branches, flow_responses, flow_analytics
-- Also: adds birthday column to profiles, indexes, and updated_at triggers
-- =============================================================================

-- === flows ===

CREATE TABLE public.flows (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text        NOT NULL,
  description           text,
  status                text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  priority              integer     NOT NULL DEFAULT 0,
  display_type          text        NOT NULL DEFAULT 'modal' CHECK (display_type IN ('modal', 'fullscreen', 'top_banner', 'bottom_banner', 'notification')),
  modal_dismissible     boolean     NOT NULL DEFAULT true,
  modal_backdrop        text        DEFAULT 'blur' CHECK (modal_backdrop IN ('blur', 'dark', 'none')),
  trigger_type          text        NOT NULL DEFAULT 'login' CHECK (trigger_type IN ('login', 'manual', 'page_load')),
  trigger_delay_seconds integer     DEFAULT 0,
  frequency             text        NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'every_login', 'every_session', 'custom')),
  conditions            jsonb       DEFAULT '[]'::jsonb,
  schema_version        integer     NOT NULL DEFAULT 1,
  is_template           boolean     NOT NULL DEFAULT false,
  template_name         text,
  created_by            uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- === flow_steps ===

CREATE TABLE public.flow_steps (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id        uuid        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  position       integer     NOT NULL DEFAULT 0,
  title          text,
  elements       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  schema_version integer     NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- === flow_branches ===

CREATE TABLE public.flow_branches (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id        uuid    NOT NULL REFERENCES public.flow_steps(id) ON DELETE CASCADE,
  element_key    text    NOT NULL,
  answer_value   text    NOT NULL,
  target_step_id uuid    NOT NULL REFERENCES public.flow_steps(id) ON DELETE CASCADE,
  UNIQUE (step_id, element_key, answer_value)
);

-- === flow_responses ===

CREATE TABLE public.flow_responses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id      uuid        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'skipped', 'dismissed')),
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_step_id uuid        REFERENCES public.flow_steps(id) ON DELETE SET NULL,
  responses    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flow_id, user_id)
);

-- === flow_analytics ===

CREATE TABLE public.flow_analytics (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id    uuid        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event      text        NOT NULL CHECK (event IN ('shown', 'started', 'step_completed', 'completed', 'skipped', 'dismissed')),
  step_id    uuid        REFERENCES public.flow_steps(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- === profiles: birthday column ===

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday date;

-- === indexes ===

-- GIN index for JSONB condition evaluation
CREATE INDEX idx_flows_conditions ON public.flows USING GIN (conditions);

-- Active flow lookup by priority
CREATE INDEX idx_flows_status_priority ON public.flows (status, priority DESC);

-- Ordered step retrieval
CREATE INDEX idx_flow_steps_flow_position ON public.flow_steps (flow_id, position);

-- User's response lookup
CREATE INDEX idx_flow_responses_user_flow ON public.flow_responses (user_id, flow_id);

-- Analytics time-range queries
CREATE INDEX idx_flow_analytics_flow_created ON public.flow_analytics (flow_id, created_at);

-- Per-user analytics lookup
CREATE INDEX idx_flow_analytics_user ON public.flow_analytics (user_id);

-- === triggers ===

CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON public.flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_responses_updated_at
  BEFORE UPDATE ON public.flow_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
