import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { paginatedResponse, successResponse, errorResponse } from '@/lib/api/response';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/api/pagination';
import {
  listVerifications,
  createVerification,
  VERIFICATIONS_SORT_FIELDS,
} from '@/lib/api/services/verifications';
import type { VerificationStatus } from '@/lib/types';

const VALID_VERIFICATION_STATUSES: VerificationStatus[] = [
  'unverified',
  'pending',
  'verified',
  'rejected',
];

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
    const pagination = parsePaginationParams(ctx.url, VERIFICATIONS_SORT_FIELDS);

    // Filters
    const rawStatus = ctx.url.searchParams.get('verification_status');
    const verification_status: VerificationStatus | undefined =
      rawStatus && VALID_VERIFICATION_STATUSES.includes(rawStatus as VerificationStatus)
        ? (rawStatus as VerificationStatus)
        : undefined;

    const member_type = ctx.url.searchParams.get('member_type') ?? undefined;

    // Query
    const { data, count, error } = await listVerifications({
      pagination,
      verification_status,
      member_type,
    });

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch verifications', 500);
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

    // Validate required: user_id
    if (!body.user_id || typeof body.user_id !== 'string' || body.user_id.trim() === '') {
      return errorResponse('MISSING_FIELD', 'user_id is required and must be a non-empty string', 400);
    }

    // Validate optional: certificate_url
    if (
      body.certificate_url !== undefined &&
      body.certificate_url !== null &&
      typeof body.certificate_url !== 'string'
    ) {
      return errorResponse('INVALID_VALUE', 'certificate_url must be a string or null', 400);
    }

    // Validate optional: certificate_is_official
    if (
      body.certificate_is_official !== undefined &&
      typeof body.certificate_is_official !== 'boolean'
    ) {
      return errorResponse('INVALID_VALUE', 'certificate_is_official must be a boolean', 400);
    }

    // Initiate verification
    const { data, error } = await createVerification({
      user_id: body.user_id as string,
      ...(body.certificate_url !== undefined && {
        certificate_url: body.certificate_url as string | null,
      }),
      ...(body.certificate_is_official !== undefined && {
        certificate_is_official: body.certificate_is_official as boolean,
      }),
    });

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'verification.create',
      target_type: 'profile',
      target_id: data.id,
      description: 'Initiated verification via API',
    });

    return successResponse(data, 201);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
