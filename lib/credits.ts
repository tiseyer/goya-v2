import type { SupabaseClient } from '@supabase/supabase-js'

export type CreditType = 'ce' | 'karma' | 'practice' | 'teaching' | 'community'

export interface CreditEntry {
  id: string
  user_id: string
  credit_type: CreditType
  amount: number
  activity_date: string
  description: string | null
  source: 'manual' | 'automatic'
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

export interface CreditRequirement {
  id: string
  credit_type: CreditType
  required_amount: number
  period_months: number
  updated_at: string
  updated_by: string | null
}

export interface CreditTotals {
  ce: number
  karma: number
  practice: number
  teaching: number
  community: number
}

export interface RequirementCheck {
  meets: boolean
  breakdown: {
    credit_type: CreditType
    required: number
    actual: number
    period_months: number
    meets: boolean
  }[]
}

/**
 * Get total non-expired approved credits for a user, grouped by type.
 * Only counts entries where expires_at >= today AND status = 'approved'.
 */
export async function getUserCreditTotals(
  userId: string,
  supabase: SupabaseClient
): Promise<CreditTotals> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('credit_entries')
    .select('credit_type, amount')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .gte('expires_at', today)

  const totals: CreditTotals = { ce: 0, karma: 0, practice: 0, teaching: 0, community: 0 }
  for (const row of data ?? []) {
    if (row.credit_type in totals) {
      totals[row.credit_type as CreditType] += Number(row.amount)
    }
  }
  return totals
}

/**
 * Get total approved credits of a specific type within the last N months.
 */
export async function getCreditsInPeriod(
  userId: string,
  creditType: CreditType,
  months: number,
  supabase: SupabaseClient
): Promise<number> {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const { data } = await supabase
    .from('credit_entries')
    .select('amount')
    .eq('user_id', userId)
    .eq('credit_type', creditType)
    .eq('status', 'approved')
    .gte('activity_date', cutoffStr)

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
}

/**
 * Check whether a user meets all credit requirements.
 * Returns overall meets flag plus per-type breakdown.
 */
export async function checkUserMeetsRequirements(
  userId: string,
  supabase: SupabaseClient
): Promise<RequirementCheck> {
  const { data: requirements } = await supabase
    .from('credit_requirements')
    .select('*')

  const breakdown = await Promise.all(
    (requirements ?? [])
      .filter(r => r.required_amount > 0)
      .map(async (req: CreditRequirement) => {
        const actual = await getCreditsInPeriod(userId, req.credit_type, req.period_months, supabase)
        return {
          credit_type: req.credit_type as CreditType,
          required: req.required_amount,
          actual,
          period_months: req.period_months,
          meets: actual >= req.required_amount,
        }
      })
  )

  return {
    meets: breakdown.every(b => b.meets),
    breakdown,
  }
}
