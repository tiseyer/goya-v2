import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { paginatedResponse, successResponse, errorResponse } from '@/lib/api/response';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/api/pagination';
import { listEvents, createEvent, EVENTS_SORT_FIELDS } from '@/lib/api/services/events';
import type { EventCategory, EventFormat, EventStatus } from '@/lib/types';

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

    // Pagination
    const pagination = parsePaginationParams(ctx.url, EVENTS_SORT_FIELDS);

    // Filters
    const rawCategory = ctx.url.searchParams.get('category');
    const category: EventCategory | undefined =
      rawCategory && VALID_CATEGORIES.includes(rawCategory as EventCategory)
        ? (rawCategory as EventCategory)
        : undefined;

    const rawStatus = ctx.url.searchParams.get('status');
    const status: EventStatus | undefined =
      rawStatus && VALID_STATUSES.includes(rawStatus as EventStatus)
        ? (rawStatus as EventStatus)
        : undefined;

    const rawFormat = ctx.url.searchParams.get('format');
    const format: EventFormat | undefined =
      rawFormat && VALID_FORMATS.includes(rawFormat as EventFormat)
        ? (rawFormat as EventFormat)
        : undefined;

    const date_from = ctx.url.searchParams.get('date_from') ?? undefined;
    const date_to = ctx.url.searchParams.get('date_to') ?? undefined;

    // Query
    const { data, count, error } = await listEvents({
      pagination,
      category,
      status,
      format,
      date_from,
      date_to,
    });

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch events', 500);
    }

    const meta = buildPaginationMeta(count ?? 0, pagination);
    return paginatedResponse(data, meta);
  },

  POST: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission — write required for POST
    const forbidden = requirePermission(keyOrError, 'write');
    if (forbidden) return forbidden;

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      return errorResponse('MISSING_FIELD', 'title is required', 400);
    }
    if (!body.category || !VALID_CATEGORIES.includes(body.category as EventCategory)) {
      return errorResponse(
        'INVALID_VALUE',
        `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
        400
      );
    }
    if (!body.format || !VALID_FORMATS.includes(body.format as EventFormat)) {
      return errorResponse(
        'INVALID_VALUE',
        `format must be one of: ${VALID_FORMATS.join(', ')}`,
        400
      );
    }
    if (!body.date || typeof body.date !== 'string' || body.date.trim() === '') {
      return errorResponse('MISSING_FIELD', 'date is required', 400);
    }
    if (!body.time_start || typeof body.time_start !== 'string' || body.time_start.trim() === '') {
      return errorResponse('MISSING_FIELD', 'time_start is required', 400);
    }
    if (!body.time_end || typeof body.time_end !== 'string' || body.time_end.trim() === '') {
      return errorResponse('MISSING_FIELD', 'time_end is required', 400);
    }

    // Validate optional enum fields
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status as EventStatus)) {
      return errorResponse(
        'INVALID_VALUE',
        `status must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    // Build CreateEventParams from validated body — only pass through known fields
    const params = {
      title: body.title as string,
      category: body.category as EventCategory,
      format: body.format as EventFormat,
      date: body.date as string,
      time_start: body.time_start as string,
      time_end: body.time_end as string,
      ...(body.description !== undefined && { description: body.description as string | null }),
      ...(body.location !== undefined && { location: body.location as string | null }),
      ...(body.instructor !== undefined && { instructor: body.instructor as string | null }),
      ...(body.price !== undefined && { price: body.price as number }),
      ...(body.is_free !== undefined && { is_free: body.is_free as boolean }),
      ...(body.spots_total !== undefined && { spots_total: body.spots_total as number | null }),
      ...(body.spots_remaining !== undefined && { spots_remaining: body.spots_remaining as number | null }),
      ...(body.featured_image_url !== undefined && { featured_image_url: body.featured_image_url as string | null }),
      ...(body.status !== undefined && { status: body.status as EventStatus }),
    };

    // Create event
    const { data, error } = await createEvent(params);

    if (error || !data) {
      return errorResponse('CREATE_ERROR', 'Failed to create event', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'event.create',
      target_type: 'event',
      target_id: data.id,
      description: 'Created event via API',
      metadata: { title: data.title },
    });

    return successResponse(data, 201);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
