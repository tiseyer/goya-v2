import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getOverviewMetrics } from '@/lib/api/services/analytics';

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

    // Query
    const { data, error } = await getOverviewMetrics();

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch overview metrics', 500);
    }

    return successResponse(data);
  },
});

export const GET = handlers.GET;
