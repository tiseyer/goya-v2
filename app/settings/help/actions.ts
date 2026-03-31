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

/** Get current user's role from profiles table */
export async function getUserRole(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return data?.role ?? null
  } catch {
    return null
  }
}

/** Map user roles to the doc audiences they can access */
export function getAudiencesForRole(role: string | null): string[] {
  const map: Record<string, string[]> = {
    student: ['student'],
    teacher: ['teacher', 'student'],
    wellness_practitioner: ['teacher', 'student'],
    school: ['teacher', 'student'],
    moderator: ['moderator', 'teacher', 'student'],
    admin: ['admin', 'moderator', 'teacher', 'student', 'developer'],
  }
  return map[role ?? 'student'] ?? map.student
}
