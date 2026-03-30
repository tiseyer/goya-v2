import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { updateEnrollment } from '@/lib/api/services/courses';
import type { ProgressStatus } from '@/lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_PROGRESS_STATUSES: ProgressStatus[] = ['in_progress', 'completed'];

const handlers = createApiHandler({
  PATCH: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission
    const forbidden = requirePermission(keyOrError, 'write');
    if (forbidden) return forbidden;

    // Extract courseId and userId from URL: /api/v1/courses/:id/enrollments/:userId
    const segments = ctx.url.pathname.split('/');
    const coursesIdx = segments.indexOf('courses');
    const courseId = segments[coursesIdx + 1];
    // enrollments is at coursesIdx + 2, userId is at coursesIdx + 3
    const userId = segments[coursesIdx + 3];

    // Validate both UUIDs
    if (!courseId || !UUID_REGEX.test(courseId)) {
      return errorResponse('INVALID_ID', 'Invalid course ID format', 400);
    }
    if (!userId || !UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }

    // Parse JSON body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Validate body fields — only allow 'status' and 'completed_at'
    const allowedKeys = ['status', 'completed_at'];
    const bodyKeys = Object.keys(body);

    // Reject unknown keys
    const unknownKeys = bodyKeys.filter((k) => !allowedKeys.includes(k));
    if (unknownKeys.length > 0) {
      return errorResponse(
        'UNKNOWN_FIELDS',
        `Unknown field(s): ${unknownKeys.join(', ')}. Allowed: status, completed_at`,
        400
      );
    }

    // Require at least one valid field
    if (bodyKeys.length === 0) {
      return errorResponse('MISSING_FIELD', 'At least one of status or completed_at is required', 400);
    }

    // Validate status value if provided
    if (body.status !== undefined) {
      if (!VALID_PROGRESS_STATUSES.includes(body.status as ProgressStatus)) {
        return errorResponse(
          'INVALID_VALUE',
          'status must be one of: in_progress, completed',
          400
        );
      }
    }

    // Build updates object
    const updates: { status?: ProgressStatus; completed_at?: string | null } = {};
    if (body.status !== undefined) {
      updates.status = body.status as ProgressStatus;
    }
    if (body.completed_at !== undefined) {
      updates.completed_at = body.completed_at as string | null;
    }

    // Update enrollment
    const { data, error } = await updateEnrollment(courseId, userId, updates);

    if (error) {
      if (error === 'NOT_FOUND') {
        return errorResponse('NOT_FOUND', 'Enrollment not found', 404);
      }
      if (error instanceof Error) {
        return errorResponse('UPDATE_ERROR', error.message, 400);
      }
      return errorResponse('UPDATE_ERROR', 'Failed to update enrollment', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'course.enrollment.update',
      target_type: 'enrollment',
      target_id: courseId,
      description: 'Updated enrollment progress via API',
      metadata: { user_id: userId, course_id: courseId, fields_updated: Object.keys(body) },
    });

    return successResponse(data);
  },
});

export const PATCH = handlers.PATCH;
