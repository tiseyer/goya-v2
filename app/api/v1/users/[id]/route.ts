import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getUserById, updateUser } from '@/lib/api/services/users';
import type { UserRole, SubscriptionStatus, MemberType } from '@/lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_ROLES: UserRole[] = ['student', 'teacher', 'wellness_practitioner', 'moderator', 'admin'];
const VALID_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['member', 'guest'];
const VALID_MEMBER_TYPES: MemberType[] = ['student', 'teacher', 'wellness_practitioner'];

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

    // Extract ID from URL: /api/v1/users/:id
    const segments = ctx.url.pathname.split('/');
    const usersIdx = segments.indexOf('users');
    const id = segments[usersIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Validate body fields — only allow known fields
    const ALLOWED_FIELDS = ['role', 'subscription_status', 'member_type'];
    const unknownKeys = Object.keys(body).filter((k) => !ALLOWED_FIELDS.includes(k));
    if (unknownKeys.length > 0) {
      return errorResponse(
        'INVALID_FIELD',
        'Only role, subscription_status, member_type can be updated',
        400
      );
    }

    // Build validated update object
    const validatedBody: {
      role?: UserRole;
      subscription_status?: SubscriptionStatus;
      member_type?: MemberType | null;
    } = {};

    if ('role' in body) {
      if (!VALID_ROLES.includes(body.role as UserRole)) {
        return errorResponse(
          'INVALID_VALUE',
          `role must be one of: ${VALID_ROLES.join(', ')}`,
          400
        );
      }
      validatedBody.role = body.role as UserRole;
    }

    if ('subscription_status' in body) {
      if (!VALID_SUBSCRIPTION_STATUSES.includes(body.subscription_status as SubscriptionStatus)) {
        return errorResponse(
          'INVALID_VALUE',
          `subscription_status must be one of: ${VALID_SUBSCRIPTION_STATUSES.join(', ')}`,
          400
        );
      }
      validatedBody.subscription_status = body.subscription_status as SubscriptionStatus;
    }

    if ('member_type' in body) {
      if (body.member_type !== null && !VALID_MEMBER_TYPES.includes(body.member_type as MemberType)) {
        return errorResponse(
          'INVALID_VALUE',
          `member_type must be one of: ${VALID_MEMBER_TYPES.join(', ')}, or null`,
          400
        );
      }
      validatedBody.member_type = body.member_type as MemberType | null;
    }

    if (Object.keys(validatedBody).length === 0) {
      return errorResponse('MISSING_FIELDS', 'At least one field must be provided to update', 400);
    }

    // Update user
    const { data, error } = await updateUser(id, validatedBody);

    if (error || !data) {
      // Check if user exists to return proper 404 vs 500
      const { data: existing } = await getUserById(id);
      if (!existing) {
        return errorResponse('NOT_FOUND', 'User not found', 404);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to update user', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'user.update',
      target_type: 'user',
      target_id: id,
      description: 'Updated user profile via API',
      metadata: { fields_updated: Object.keys(validatedBody) },
    });

    return successResponse(data);
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
