import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getUserVerifications } from '@/lib/api/services/users';

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

    // Extract userId from URL: /api/v1/users/:id/verifications
    const segments = ctx.url.pathname.split('/');
    const usersIdx = segments.indexOf('users');
    const userId = segments[usersIdx + 1];

    // Validate UUID format
    if (!userId || !UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }

    // Query
    const { data, error } = await getUserVerifications(userId);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    return successResponse(data);
  },
});

export const GET = handlers.GET;
