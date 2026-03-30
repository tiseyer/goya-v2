import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { removeAddonFromUser } from '@/lib/api/services/addons';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const handlers = createApiHandler({
  DELETE: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission
    const forbidden = requirePermission(keyOrError, 'write');
    if (forbidden) return forbidden;

    // Extract userId and addonId from URL: /api/v1/addons/users/:userId/:addonId
    const segments = ctx.url.pathname.split('/');
    const usersIdx = segments.indexOf('users');
    const userId = segments[usersIdx + 1];
    const addonId = segments[usersIdx + 2];

    // Validate both UUIDs
    if (!userId || !UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }
    if (!addonId || !UUID_REGEX.test(addonId)) {
      return errorResponse('INVALID_ID', 'Invalid add-on assignment ID format', 400);
    }

    const { data, error } = await removeAddonFromUser(userId, addonId);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'Assignment not found', 404);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'addon.unassign',
      target_type: 'user_designation',
      target_id: addonId,
      description: 'Removed add-on from user via API',
      metadata: { user_id: userId },
    });

    return successResponse(data);
  },
});

export const DELETE = handlers.DELETE;
