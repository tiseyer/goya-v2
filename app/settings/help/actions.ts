'use server'

import { createSupabaseServerClient } from '@/lib/supabaseServer'

export interface SupportTicket {
  id: string
  question_summary: string
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
}

export async function getUserTickets(): Promise<SupportTicket[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) return []

    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, question_summary, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return []

    return (data ?? []) as SupportTicket[]
  } catch {
    return []
  }
}
