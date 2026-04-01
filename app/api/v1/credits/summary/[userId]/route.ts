import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getCreditSummary } from '@/lib/api/services/credits';

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

    // Extract userId from URL: /api/v1/credits/summary/:userId
    const segments = ctx.url.pathname.split('/');
    const summaryIdx = segments.indexOf('summary');
    const userId = segments[summaryIdx + 1];

    // Validate UUID format
    if (!userId || !UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }

    // Query
    const { data, error } = await getCreditSummary(userId);

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch credit summary', 500);
    }

    return successResponse(data);
  },
});

export const GET = handlers.GET;
