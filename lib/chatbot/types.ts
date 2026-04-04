export type FaqStatus = 'published' | 'draft'

export interface ChatbotConfig {
  id: string
  name: string
  avatar_url: string | null
  is_active: boolean
  system_prompt: string
  selected_key_id: string | null
  guest_retention_days: number
  enabled_tools: string[]
  created_at: string
  updated_at: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: string | null
  status: FaqStatus
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined from profiles for display
  creator_name?: string
}

// --- Chat service types (added in Phase 14) ---

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string | null
  anonymous_id: string | null
  is_escalated: boolean
  started_from: 'chat_widget' | 'search_hint' | 'help_page'
  user_feedback: 'up' | 'down' | null
  feedback_at: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessageRequest {
  session_id?: string
  message: string
  anonymous_id?: string
}

export interface ChatStreamResult {
  stream: ReadableStream<Uint8Array>
  session_id: string
  escalated?: boolean
}

// --- Admin types (added in Phase 15) ---

export type TicketStatus = 'open' | 'in_progress' | 'resolved'

export interface ConversationListItem {
  id: string
  user_id: string | null
  anonymous_id: string | null
  user_name: string | null
  user_email: string | null
  is_escalated: boolean
  started_from: 'chat_widget' | 'search_hint' | 'help_page'
  created_at: string
  last_message_at: string
  message_count: number
}

export interface SupportTicket {
  id: string
  session_id: string | null
  user_id: string | null
  anonymous_id: string | null
  question_summary: string
  status: TicketStatus
  ticket_type: 'human_escalation' | 'unanswered_question'
  rejection_reason: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  // Joined fields
  user_name: string | null
  user_email: string | null
}

export type ToolSlug = 'events' | 'teachers' | 'courses' | 'faq'

export interface ToolConnection {
  slug: ToolSlug
  name: string
  description: string
  enabled: boolean
  locked: boolean // faq is always locked-on
}
