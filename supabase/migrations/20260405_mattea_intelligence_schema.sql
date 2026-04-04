-- INFRA-01: chat_sessions additions for source tracking and user feedback
ALTER TABLE chat_sessions
  ADD COLUMN started_from text NOT NULL DEFAULT 'chat_widget'
    CHECK (started_from IN ('chat_widget', 'search_hint', 'help_page')),
  ADD COLUMN user_feedback text CHECK (user_feedback IN ('up', 'down')),
  ADD COLUMN feedback_at timestamptz;

-- INFRA-02: support_tickets additions for ticket type classification and rejection tracking
ALTER TABLE support_tickets
  ADD COLUMN ticket_type text NOT NULL DEFAULT 'human_escalation'
    CHECK (ticket_type IN ('human_escalation', 'unanswered_question')),
  ADD COLUMN rejection_reason text;
