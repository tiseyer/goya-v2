/**
 * Escalation detection for chatbot sessions.
 * Triggers escalation on keyword phrases or consecutive repeated questions.
 */

const ESCALATION_KEYWORDS = [
  'talk to human',
  'talk to a human',
  'speak to someone',
  'speak to a person',
  'help from a person',
  'real person',
  'human agent',
  'customer support',
  'talk to support',
]

/**
 * Computes a simple character-overlap similarity ratio between two strings.
 * Returns a value between 0 and 1.
 */
function similarityRatio(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0

  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a

  let matches = 0
  for (const ch of shorter) {
    if (longer.includes(ch)) {
      matches++
    }
  }

  return matches / longer.length
}

/**
 * Detects whether the current message should trigger escalation to a human agent.
 *
 * Conditions:
 * 1. Keyword match: userMessage contains any escalation phrase (case-insensitive)
 * 2. Consecutive same-question: last 2 user messages in history are substantially
 *    the same as the current message (>80% character similarity after normalization)
 */
export function detectEscalation(
  userMessage: string,
  recentMessages: { role: string; content: string }[],
): boolean {
  const normalized = userMessage.toLowerCase().trim()

  // Condition 1: Keyword match
  for (const keyword of ESCALATION_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return true
    }
  }

  // Condition 2: Consecutive same-question detection
  const userHistory = recentMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase().trim())

  const lastTwo = userHistory.slice(-2)

  if (lastTwo.length === 2) {
    const sim1 = similarityRatio(normalized, lastTwo[0])
    const sim2 = similarityRatio(normalized, lastTwo[1])
    if (sim1 > 0.8 && sim2 > 0.8) {
      return true
    }
  }

  return false
}
