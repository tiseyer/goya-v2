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

// ─── Status-driven credit tracking (Phase 4+) ──────────────────────────────

export type CreditStatus = 'green' | 'yellow' | 'red' | 'grey'

export interface CreditTypeStatus {
  credit_type: CreditType
  current: number
  required: number
  period_months: number
  expiringSoon: number // credits expiring within 60 days
  status: CreditStatus
  message: string
}

export interface UserCreditStatus {
  overall: CreditStatus
  overallMessage: string
  types: CreditTypeStatus[]
}

/**
 * Get approved credits expiring within the next N days for a user and credit type.
 */
export async function getExpiringCredits(
  userId: string,
  creditType: CreditType,
  withinDays: number,
  supabase: SupabaseClient
): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + withinDays)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const { data } = await supabase
    .from('credit_entries')
    .select('amount')
    .eq('user_id', userId)
    .eq('credit_type', creditType)
    .eq('status', 'approved')
    .gte('expires_at', today)
    .lte('expires_at', cutoffStr)

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
}

/**
 * Compute status-driven credit info for a single credit type.
 */
function computeTypeStatus(
  creditType: CreditType,
  current: number,
  required: number,
  periodMonths: number,
  expiringSoon: number,
): CreditTypeStatus {
  // No requirement configured
  if (required <= 0) {
    return {
      credit_type: creditType,
      current,
      required: 0,
      period_months: periodMonths,
      expiringSoon,
      status: 'grey',
      message: `${current} earned — No minimum required`,
    }
  }

  // Below requirement
  if (current < required) {
    return {
      credit_type: creditType,
      current,
      required,
      period_months: periodMonths,
      expiringSoon,
      status: 'red',
      message: `${current} / ${required} required — Action needed`,
    }
  }

  // Meets requirement but would drop below if expiring credits lapse
  if (expiringSoon > 0 && (current - expiringSoon) < required) {
    return {
      credit_type: creditType,
      current,
      required,
      period_months: periodMonths,
      expiringSoon,
      status: 'yellow',
      message: `${current} / ${required} required — Credits expiring soon`,
    }
  }

  // Meets requirement, no risk
  return {
    credit_type: creditType,
    current,
    required,
    period_months: periodMonths,
    expiringSoon,
    status: 'green',
    message: `${current} / ${required} required — You're on track`,
  }
}

/**
 * Get full status-driven credit info for a user across all credit types.
 */
export async function getUserCreditStatus(
  userId: string,
  supabase: SupabaseClient,
  includeTeaching: boolean = true,
): Promise<UserCreditStatus> {
  const totals = await getUserCreditTotals(userId, supabase)

  const { data: requirements } = await supabase
    .from('credit_requirements')
    .select('*')

  const reqMap = new Map<string, CreditRequirement>()
  for (const r of requirements ?? []) {
    reqMap.set(r.credit_type, r as CreditRequirement)
  }

  const allTypes: CreditType[] = includeTeaching
    ? ['ce', 'karma', 'practice', 'teaching', 'community']
    : ['ce', 'karma', 'practice', 'community']

  const types: CreditTypeStatus[] = await Promise.all(
    allTypes.map(async (ct) => {
      const req = reqMap.get(ct)
      const expiringSoon = await getExpiringCredits(userId, ct, 60, supabase)
      return computeTypeStatus(
        ct,
        totals[ct],
        req?.required_amount ?? 0,
        req?.period_months ?? 24,
        expiringSoon,
      )
    })
  )

  // Overall status = worst among types with requirements
  const withRequirements = types.filter(t => t.status !== 'grey')
  let overall: CreditStatus = 'green'
  if (withRequirements.some(t => t.status === 'red')) {
    overall = 'red'
  } else if (withRequirements.some(t => t.status === 'yellow')) {
    overall = 'yellow'
  } else if (withRequirements.length === 0) {
    overall = 'grey'
  }

  const overallMessages: Record<CreditStatus, string> = {
    green: 'Your membership credits are all up to date.',
    yellow: 'Some of your credits are expiring soon. Review below.',
    red: 'Your credits do not meet the membership requirements. Please submit missing credits.',
    grey: 'No credit requirements are currently configured.',
  }

  return { overall, overallMessage: overallMessages[overall], types }
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
