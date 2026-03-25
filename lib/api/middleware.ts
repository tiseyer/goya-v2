/**
 * API middleware functions for route handlers.
 *
 * Composition pattern:
 * ```typescript
 * // In a route handler:
 * const keyOrError = await validateApiKey(ctx.req);
 * if (keyOrError instanceof Response) return keyOrError;
 * const limited = rateLimit(keyOrError.id);
 * if (limited) return limited;
 * const forbidden = requirePermission(keyOrError, 'write');
 * if (forbidden) return forbidden;
 * // ... proceed with business logic
 * ```
 */

import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/service';
import { errorResponse } from '@/lib/api/response';
import type { ApiKeyRow, ApiKeyPermission } from '@/lib/api/types';

// ---------------------------------------------------------------------------
// validateApiKey
// ---------------------------------------------------------------------------

/**
 * Validates the API key provided in the `x-api-key` header (or `Authorization: Bearer ...`
 * fallback) against the api_keys table.
 *
 * @returns `ApiKeyRow` on success, or a `Response` (401) on failure.
 */
export async function validateApiKey(req: NextRequest): Promise<ApiKeyRow | Response> {
  // Extract key from x-api-key header or Authorization: Bearer fallback
  let key = req.headers.get('x-api-key');
  if (!key) {
    const auth = req.headers.get('authorization');
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      key = auth.slice(7).trim();
    }
  }

  if (!key) {
    return errorResponse('UNAUTHORIZED', 'API key required', 401);
  }

  // Hash the key with SHA-256 for DB lookup
  const keyHash = createHash('sha256').update(key).digest('hex');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('active', true)
    .single();

  if (error || !data) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  const apiKeyData = data as ApiKeyRow;

  // Fire-and-forget: update last_used_at and increment request_count
  supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      request_count: (apiKeyData.request_count ?? 0) + 1,
    })
    .eq('id', apiKeyData.id)
    .then(() => {
      // intentionally ignored — usage tracking is best-effort
    });

  return apiKeyData;
}

// ---------------------------------------------------------------------------
// rateLimit
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** In-memory sliding-window rate limit state keyed by API key ID. */
const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds
let rateLimitCallCount = 0;

/**
 * Enforces 100 requests per 60-second window per API key.
 *
 * @returns `null` if under the limit, or a `Response` (429) when the limit is exceeded.
 */
export function rateLimit(keyId: string): Response | null {
  rateLimitCallCount++;

  // Periodically purge stale entries to prevent unbounded memory growth
  if (rateLimitCallCount % 1000 === 0) {
    const now = Date.now();
    for (const [id, entry] of rateLimitMap) {
      if (entry.resetAt <= now) {
        rateLimitMap.delete(id);
      }
    }
  }

  const now = Date.now();
  const entry = rateLimitMap.get(keyId);

  if (!entry || entry.resetAt <= now) {
    // Start a new window
    rateLimitMap.set(keyId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    const secondsUntilReset = Math.ceil((entry.resetAt - now) / 1000);
    const response = errorResponse(
      'RATE_LIMITED',
      'Rate limit exceeded. Max 100 requests per minute.',
      429,
      { retry_after: secondsUntilReset }
    );
    // Attach Retry-After header
    response.headers.set('Retry-After', String(secondsUntilReset));
    return response;
  }

  return null;
}

// ---------------------------------------------------------------------------
// requirePermission
// ---------------------------------------------------------------------------

/**
 * Checks that an API key has the required permission.
 * `admin` permission supersedes all other permissions.
 *
 * @returns `null` if allowed, or a `Response` (403) when permission is insufficient.
 */
export function requirePermission(
  apiKey: ApiKeyRow,
  required: ApiKeyPermission
): Response | null {
  const permissions = apiKey.permissions ?? [];

  // admin supersedes everything
  if (permissions.includes('admin')) return null;
  if (permissions.includes(required)) return null;

  return errorResponse('FORBIDDEN', 'Insufficient permissions', 403);
}
