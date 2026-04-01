import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { paginatedResponse, successResponse, errorResponse } from '@/lib/api/response';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/api/pagination';
import { listEnrollments, enrollUser, ENROLLMENTS_SORT_FIELDS } from '@/lib/api/services/courses';

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

    // Extract courseId from URL: /api/v1/courses/:id/enrollments
    const segments = ctx.url.pathname.split('/');
    const coursesIdx = segments.indexOf('courses');
    const courseId = segments[coursesIdx + 1];

    // Validate courseId UUID format
    if (!courseId || !UUID_REGEX.test(courseId)) {
      return errorResponse('INVALID_ID', 'Invalid course ID format', 400);
    }

    // Parse pagination
    const pagination = parsePaginationParams(ctx.url, ENROLLMENTS_SORT_FIELDS);

    // List enrollments
    const { data, count, error } = await listEnrollments(courseId, pagination);

    if (error) {
      if (error === 'COURSE_NOT_FOUND') {
        return errorResponse('NOT_FOUND', 'Course not found', 404);
      }
      return errorResponse('QUERY_ERROR', 'Failed to fetch enrollments', 500);
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

    // Permission
    const forbidden = requirePermission(keyOrError, 'write');
    if (forbidden) return forbidden;

    // Extract courseId from URL: /api/v1/courses/:id/enrollments
    const segments = ctx.url.pathname.split('/');
    const coursesIdx = segments.indexOf('courses');
    const courseId = segments[coursesIdx + 1];

    // Validate courseId UUID format
    if (!courseId || !UUID_REGEX.test(courseId)) {
      return errorResponse('INVALID_ID', 'Invalid course ID format', 400);
    }

    // Parse JSON body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Validate user_id is present and a valid UUID
    const userId = body.user_id as string | undefined;
    if (!userId) {
      return errorResponse('MISSING_FIELD', 'user_id is required', 400);
    }
    if (!UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_FIELD', 'user_id must be a valid UUID', 400);
    }

    // Enroll user
    const { data, error } = await enrollUser(courseId, userId);

    if (error) {
      if (error === 'COURSE_NOT_FOUND') {
        return errorResponse('NOT_FOUND', 'Course not found', 404);
      }
      if (error === 'ALREADY_ENROLLED') {
        return errorResponse('CONFLICT', 'User is already enrolled in this course', 409);
      }
      return errorResponse('ENROLLMENT_ERROR', 'Failed to enroll user', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'course.enroll',
      target_type: 'enrollment',
      target_id: courseId,
      description: 'Enrolled user in course via API',
      metadata: { user_id: userId, course_id: courseId },
    });

    return successResponse(data, 201);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
