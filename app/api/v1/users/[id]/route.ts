import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getUserById } from '@/lib/api/services/users';

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

    // Extract ID from URL: /api/v1/users/:id
    const segments = ctx.url.pathname.split('/');
    const usersIdx = segments.indexOf('users');
    const id = segments[usersIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }

    // Query
    const { data, error } = await getUserById(id);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    return successResponse(data);
  },
});

export const GET = handlers.GET;
