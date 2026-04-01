import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { unregisterUser } from '@/lib/api/services/events';

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

    // Extract eventId and userId from URL: /api/v1/events/:id/registrations/:userId
    const segments = ctx.url.pathname.split('/');
    const eventsIdx = segments.indexOf('events');
    const eventId = segments[eventsIdx + 1];
    // registrations is at eventsIdx + 2, userId is at eventsIdx + 3
    const userId = segments[eventsIdx + 3];

    // Validate both UUIDs
    if (!eventId || !UUID_REGEX.test(eventId)) {
      return errorResponse('INVALID_ID', 'Invalid event ID format', 400);
    }
    if (!userId || !UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }

    // Unregister user
    const { data, error } = await unregisterUser(eventId, userId);

    if (error) {
      if (error === 'NOT_FOUND') {
        return errorResponse('NOT_FOUND', 'Registration not found', 404);
      }
      return errorResponse('UNREGISTER_ERROR', 'Failed to unregister user', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'event.unregister',
      target_type: 'event_registration',
      target_id: eventId,
      description: 'Unregistered user from event via API',
      metadata: { user_id: userId, event_id: eventId },
    });

    return successResponse(data);
  },
});

export const DELETE = handlers.DELETE;
