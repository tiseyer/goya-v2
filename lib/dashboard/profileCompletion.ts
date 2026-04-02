// Pure computation module — no DB queries, no server-only needed.

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileCompletionResult = {
  score: number
  missing: Array<{ key: string; label: string; href: string }>
  complete: string[]
}

// ─── Field completeness check ─────────────────────────────────────────────────

/**
 * Returns true if a profile field value is considered "filled in".
 * Handles JSONB empty arrays correctly — an empty array [] is NOT complete.
 */
export function isFieldComplete(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

// ─── Weighted fields ──────────────────────────────────────────────────────────

/**
 * Five profile fields tracked individually (total weight: 80%).
 * The website/social field (weight 10) is checked via social_fields below.
 */
export const WEIGHTED_FIELDS = [
  { key: 'avatar_url',      weight: 20, label: 'Profile photo',      href: '/settings' },
  { key: 'bio',             weight: 20, label: 'Bio',                href: '/settings' },
  { key: 'location',        weight: 15, label: 'Location',           href: '/settings' },
  { key: 'teaching_styles', weight: 15, label: 'Teaching styles',    href: '/settings' },
  { key: 'website',         weight: 10, label: 'Website or social',  href: '/settings' },
] as const

/**
 * The sixth field (weight 20%) — checks whether the user has created at least
 * one event or course. Caller must compute this and pass it as `hasContent`.
 */
export const CONTENT_FIELD = {
  key: 'has_content',
  weight: 20,
  label: 'Share an event or course',
  href: '/events',
} as const

/**
 * Social link fields — if ANY of these is filled, the "website/social" field
 * (WEIGHTED_FIELDS[4]) scores as complete.
 */
const SOCIAL_FIELDS = ['website', 'instagram', 'youtube'] as const

// ─── Scorer ───────────────────────────────────────────────────────────────────

/**
 * Computes a weighted profile completion score.
 *
 * @param profile  - A plain object whose keys match profiles table columns.
 * @param hasContent - Whether the user has created at least one event or course
 *                     (default false). Adds 20% when true.
 * @returns Score (0–100), list of missing fields, list of complete field keys.
 */
export function getProfileCompletion(
  profile: Record<string, unknown>,
  hasContent = false,
): ProfileCompletionResult {
  let score = 0
  const missing: Array<{ key: string; label: string; href: string }> = []
  const complete: string[] = []

  for (const field of WEIGHTED_FIELDS) {
    // Special handling for the website/social field: check any of the social fields
    const isComplete =
      field.key === 'website'
        ? SOCIAL_FIELDS.some((k) => isFieldComplete(profile[k]))
        : isFieldComplete(profile[field.key])

    if (isComplete) {
      score += field.weight
      complete.push(field.key)
    } else {
      missing.push({ key: field.key, label: field.label, href: field.href })
    }
  }

  // Content field (events/courses)
  if (hasContent) {
    score += CONTENT_FIELD.weight
    complete.push(CONTENT_FIELD.key)
  } else {
    missing.push({ key: CONTENT_FIELD.key, label: CONTENT_FIELD.label, href: CONTENT_FIELD.href })
  }

  return { score, missing, complete }
}
