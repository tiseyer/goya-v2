import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { paginatedResponse, errorResponse } from '@/lib/api/response';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/api/pagination';
import { getUserCredits, CREDITS_SORT_FIELDS } from '@/lib/api/services/users';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const handlers = createApiHandler({
  GET: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission
    const forbidden = requirePermission(keyOrError, 'read');
    if (forbidden) return forbidden;

    // Extract userId from URL: /api/v1/users/:id/credits
    const segments = ctx.url.pathname.split('/');
    const usersIdx = segments.indexOf('users');
    const userId = segments[usersIdx + 1];

    // Validate UUID format
    if (!userId || !UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }

    // Parse pagination
    const pagination = parsePaginationParams(ctx.url, CREDITS_SORT_FIELDS);

    // Query
    const { data, count, error } = await getUserCredits(userId, pagination);

    if (error) {
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch credits', 500);
    }

    const meta = buildPaginationMeta(count ?? 0, pagination);
    return paginatedResponse(data, meta);
  },
});

export const GET = handlers.GET;
