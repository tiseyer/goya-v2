/**
 * In-memory rate limiter for chat sessions.
 * Enforces 20 messages per session per hour (sliding window).
 *
 * Follows the same pattern as lib/api/middleware.ts rateLimit().
 */

interface ChatRateLimitEntry {
  count: number
  resetAt: number
}

const chatRateLimitMap = new Map<string, ChatRateLimitEntry>()

export const CHAT_RATE_LIMIT_MAX = 20
export const CHAT_RATE_LIMIT_WINDOW_MS = 3_600_000 // 1 hour

let chatRateLimitCallCount = 0

/**
 * Enforces 20 messages per session per hour.
 *
 * @returns `null` if under the limit, or a `Response` (429) when the limit is exceeded.
 */
export function checkChatRateLimit(sessionId: string): Response | null {
  chatRateLimitCallCount++

  // Periodically purge stale entries to prevent unbounded memory growth
  if (chatRateLimitCallCount % 500 === 0) {
    const now = Date.now()
    for (const [id, entry] of chatRateLimitMap) {
      if (entry.resetAt <= now) {
        chatRateLimitMap.delete(id)
      }
    }
  }

  const now = Date.now()
  const entry = chatRateLimitMap.get(sessionId)

  if (!entry || entry.resetAt <= now) {
    // Start a new window
    chatRateLimitMap.set(sessionId, { count: 1, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS })
    return null
  }

  entry.count++

  if (entry.count > CHAT_RATE_LIMIT_MAX) {
    const secondsUntilReset = Math.ceil((entry.resetAt - now) / 1000)

    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retry_after_seconds: secondsUntilReset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(CHAT_RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
          'Retry-After': String(secondsUntilReset),
        },
      },
    )
  }

  return null
}
