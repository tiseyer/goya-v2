export type FaqStatus = 'published' | 'draft'

export interface ChatbotConfig {
  id: string
  name: string
  avatar_url: string | null
  is_active: boolean
  system_prompt: string
  selected_key_id: string | null
  guest_retention_days: number
  created_at: string
  updated_at: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
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
