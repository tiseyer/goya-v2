import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getEventById, updateEvent, deleteEvent, ALLOWED_EVENT_UPDATE_FIELDS } from '@/lib/api/services/events';
import type { EventCategory, EventFormat, EventStatus } from '@/lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_CATEGORIES: EventCategory[] = ['Workshop', 'Teacher Training', 'Dharma Talk', 'Conference', 'Yoga Sequence', 'Music Playlist', 'Research'];
const VALID_FORMATS: EventFormat[] = ['Online', 'In Person', 'Hybrid'];
const VALID_STATUSES: EventStatus[] = ['published', 'draft', 'cancelled', 'deleted'];

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

    // Extract ID from URL: /api/v1/events/:id
    const segments = ctx.url.pathname.split('/');
    const eventsIdx = segments.indexOf('events');
    const id = segments[eventsIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid event ID format', 400);
    }

    // Query
    const { data, error } = await getEventById(id);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'Event not found', 404);
    }

    return successResponse(data);
  },

  PATCH: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission — write required for PATCH
    const forbidden = requirePermission(keyOrError, 'write');
    if (forbidden) return forbidden;

    // Extract ID from URL: /api/v1/events/:id
    const segments = ctx.url.pathname.split('/');
    const eventsIdx = segments.indexOf('events');
    const id = segments[eventsIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid event ID format', 400);
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Validate body fields — only allow known fields
    const unknownKeys = Object.keys(body).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (k) => !ALLOWED_EVENT_UPDATE_FIELDS.includes(k as any)
    );
    if (unknownKeys.length > 0) {
      return errorResponse(
        'INVALID_FIELD',
        `Unknown fields: ${unknownKeys.join(', ')}. Allowed fields: ${ALLOWED_EVENT_UPDATE_FIELDS.join(', ')}`,
        400
      );
    }

    // Validate enum fields if present
    if ('category' in body && !VALID_CATEGORIES.includes(body.category as EventCategory)) {
      return errorResponse(
        'INVALID_VALUE',
        `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
        400
      );
    }
    if ('format' in body && !VALID_FORMATS.includes(body.format as EventFormat)) {
      return errorResponse(
        'INVALID_VALUE',
        `format must be one of: ${VALID_FORMATS.join(', ')}`,
        400
      );
    }
    if ('status' in body && !VALID_STATUSES.includes(body.status as EventStatus)) {
      return errorResponse(
        'INVALID_VALUE',
        `status must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    // Check at least one field provided
    if (Object.keys(body).length === 0) {
      return errorResponse('MISSING_FIELDS', 'At least one field must be provided to update', 400);
    }

    // Update event
    const validatedBody = body as Parameters<typeof updateEvent>[1];
    const { data, error } = await updateEvent(id, validatedBody);

    if (error || !data) {
      // Check if event exists to distinguish 404 vs 500
      const { data: existing } = await getEventById(id);
      if (!existing) {
        return errorResponse('NOT_FOUND', 'Event not found', 404);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to update event', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'event.update',
      target_type: 'event',
      target_id: id,
      description: 'Updated event via API',
      metadata: { fields_updated: Object.keys(validatedBody) },
    });

    return successResponse(data);
  },

  DELETE: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission — write required for DELETE
    const forbidden = requirePermission(keyOrError, 'write');
    if (forbidden) return forbidden;

    // Extract ID from URL: /api/v1/events/:id
    const segments = ctx.url.pathname.split('/');
    const eventsIdx = segments.indexOf('events');
    const id = segments[eventsIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid event ID format', 400);
    }

    // Soft-delete event
    const { data, error } = await deleteEvent(id);

    if (error || !data) {
      // Check if event exists to distinguish 404 vs 500
      const { data: existing } = await getEventById(id);
      if (!existing) {
        return errorResponse('NOT_FOUND', 'Event not found', 404);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to delete event', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'event.delete',
      target_type: 'event',
      target_id: id,
      description: 'Soft-deleted event via API',
    });

    return successResponse(data);
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
