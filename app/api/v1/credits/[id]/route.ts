import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getCreditById, updateCredit, ALLOWED_CREDIT_UPDATE_FIELDS } from '@/lib/api/services/credits';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ['pending', 'approved', 'rejected'];

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

    // Extract ID from URL: /api/v1/credits/:id
    const segments = ctx.url.pathname.split('/');
    const creditsIdx = segments.indexOf('credits');
    const id = segments[creditsIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid credit ID format', 400);
    }

    // Query
    const { data, error } = await getCreditById(id);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'Credit entry not found', 404);
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

    // Extract ID from URL: /api/v1/credits/:id
    const segments = ctx.url.pathname.split('/');
    const creditsIdx = segments.indexOf('credits');
    const id = segments[creditsIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid credit ID format', 400);
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
      (k) => !ALLOWED_CREDIT_UPDATE_FIELDS.includes(k)
    );
    if (unknownKeys.length > 0) {
      return errorResponse(
        'INVALID_FIELD',
        `Unknown fields: ${unknownKeys.join(', ')}. Allowed fields: ${ALLOWED_CREDIT_UPDATE_FIELDS.join(', ')}`,
        400
      );
    }

    // Validate enum fields if present
    if ('status' in body && !VALID_STATUSES.includes(body.status as string)) {
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

    // Update credit
    const { data, error } = await updateCredit(id, body as Parameters<typeof updateCredit>[1]);

    if (error || !data) {
      // Check if credit exists to distinguish 404 vs 500
      const { data: existing } = await getCreditById(id);
      if (!existing) {
        return errorResponse('NOT_FOUND', 'Credit entry not found', 404);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to update credit entry', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'credit.update',
      target_type: 'credit',
      target_id: id,
      description: 'Updated credit entry via API',
      metadata: { fields_updated: Object.keys(body) },
    });

    return successResponse(data);
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
