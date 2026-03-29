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
