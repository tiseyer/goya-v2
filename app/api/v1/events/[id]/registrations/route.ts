import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { registerUser } from '@/lib/api/services/events';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const handlers = createApiHandler({
  POST: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission
    const forbidden = requirePermission(keyOrError, 'write');
    if (forbidden) return forbidden;

    // Extract eventId from URL: /api/v1/events/:id/registrations
    const segments = ctx.url.pathname.split('/');
    const eventsIdx = segments.indexOf('events');
    const eventId = segments[eventsIdx + 1];

    // Validate eventId UUID format
    if (!eventId || !UUID_REGEX.test(eventId)) {
      return errorResponse('INVALID_ID', 'Invalid event ID format', 400);
    }

    // Parse JSON body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Validate user_id is present and is a valid UUID
    const userId = body.user_id as string | undefined;
    if (!userId) {
      return errorResponse('MISSING_FIELD', 'user_id is required', 400);
    }
    if (!UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_FIELD', 'user_id must be a valid UUID', 400);
    }

    // Register user
    const { data, error } = await registerUser(eventId, userId);

    if (error) {
      if (error === 'EVENT_NOT_FOUND') {
        return errorResponse('NOT_FOUND', 'Event not found', 404);
      }
      if (error === 'ALREADY_REGISTERED') {
        return errorResponse('CONFLICT', 'User is already registered for this event', 409);
      }
      if (error === 'NO_SPOTS') {
        return errorResponse('NO_SPOTS', 'No spots remaining for this event', 409);
      }
      return errorResponse('REGISTRATION_ERROR', 'Failed to register user', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'event.register',
      target_type: 'event_registration',
      target_id: eventId,
      description: 'Registered user for event via API',
      metadata: { user_id: userId, event_id: eventId },
    });

    return successResponse(data, 201);
  },
});

export const POST = handlers.POST;
