import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { paginatedResponse, successResponse, errorResponse } from '@/lib/api/response';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/api/pagination';
import { listCourses, createCourse, COURSES_SORT_FIELDS } from '@/lib/api/services/courses';
import type { CourseCategory, CourseLevel, CourseAccess, CourseStatus } from '@/lib/types';

const VALID_CATEGORIES: CourseCategory[] = ['Workshop', 'Yoga Sequence', 'Dharma Talk', 'Music Playlist', 'Research'];
const VALID_LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const VALID_ACCESS: CourseAccess[] = ['members_only', 'free'];
const VALID_STATUSES: CourseStatus[] = ['published', 'draft', 'deleted'];

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
    const pagination = parsePaginationParams(ctx.url, COURSES_SORT_FIELDS);

    // Filters
    const rawCategory = ctx.url.searchParams.get('category');
    const category: CourseCategory | undefined =
      rawCategory && VALID_CATEGORIES.includes(rawCategory as CourseCategory)
        ? (rawCategory as CourseCategory)
        : undefined;

    const rawLevel = ctx.url.searchParams.get('level');
    const level: CourseLevel | undefined =
      rawLevel && VALID_LEVELS.includes(rawLevel as CourseLevel)
        ? (rawLevel as CourseLevel)
        : undefined;

    const rawAccess = ctx.url.searchParams.get('access');
    const access: CourseAccess | undefined =
      rawAccess && VALID_ACCESS.includes(rawAccess as CourseAccess)
        ? (rawAccess as CourseAccess)
        : undefined;

    const rawStatus = ctx.url.searchParams.get('status');
    const status: CourseStatus | undefined =
      rawStatus && VALID_STATUSES.includes(rawStatus as CourseStatus)
        ? (rawStatus as CourseStatus)
        : undefined;

    const search = ctx.url.searchParams.get('search') ?? undefined;

    // Query
    const { data, count, error } = await listCourses({
      pagination,
      category,
      level,
      access,
      status,
      search,
    });

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch courses', 500);
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
    if (!body.category || !VALID_CATEGORIES.includes(body.category as CourseCategory)) {
      return errorResponse(
        'INVALID_VALUE',
        `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
        400
      );
    }

    // Validate optional enum fields if present
    if (body.level !== undefined && body.level !== null && !VALID_LEVELS.includes(body.level as CourseLevel)) {
      return errorResponse(
        'INVALID_VALUE',
        `level must be one of: ${VALID_LEVELS.join(', ')}`,
        400
      );
    }
    if (body.access !== undefined && !VALID_ACCESS.includes(body.access as CourseAccess)) {
      return errorResponse(
        'INVALID_VALUE',
        `access must be one of: ${VALID_ACCESS.join(', ')}`,
        400
      );
    }
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status as CourseStatus)) {
      return errorResponse(
        'INVALID_VALUE',
        `status must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    // Build CreateCourseParams — only pass through known fields
    const params = {
      title: body.title as string,
      category: body.category as CourseCategory,
      ...(body.short_description !== undefined && { short_description: body.short_description as string | null }),
      ...(body.description !== undefined && { description: body.description as string | null }),
      ...(body.instructor !== undefined && { instructor: body.instructor as string | null }),
      ...(body.duration !== undefined && { duration: body.duration as string | null }),
      ...(body.level !== undefined && { level: body.level as CourseLevel | null }),
      ...(body.access !== undefined && { access: body.access as CourseAccess }),
      ...(body.vimeo_url !== undefined && { vimeo_url: body.vimeo_url as string | null }),
      ...(body.thumbnail_url !== undefined && { thumbnail_url: body.thumbnail_url as string | null }),
      ...(body.gradient_from !== undefined && { gradient_from: body.gradient_from as string }),
      ...(body.gradient_to !== undefined && { gradient_to: body.gradient_to as string }),
      ...(body.status !== undefined && { status: body.status as CourseStatus }),
    };

    // Create course
    const { data, error } = await createCourse(params);

    if (error || !data) {
      return errorResponse('CREATE_ERROR', 'Failed to create course', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'course.create',
      target_type: 'course',
      target_id: data.id,
      description: 'Created course via API',
      metadata: { title: data.title },
    });

    return successResponse(data, 201);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
