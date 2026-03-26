import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import {
  getVerificationById,
  updateVerification,
  deleteVerification,
  ALLOWED_VERIFICATION_UPDATE_FIELDS,
} from '@/lib/api/services/verifications';
import type { VerificationStatus } from '@/lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // Extract ID from URL: /api/v1/verifications/:id
    const segments = ctx.url.pathname.split('/');
    const verificationsIdx = segments.indexOf('verifications');
    const id = segments[verificationsIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid verification ID format', 400);
    }

    // Query
    const { data, error } = await getVerificationById(id);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'Verification not found', 404);
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

    // Extract ID from URL: /api/v1/verifications/:id
    const segments = ctx.url.pathname.split('/');
    const verificationsIdx = segments.indexOf('verifications');
    const id = segments[verificationsIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid verification ID format', 400);
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
      (k) => !ALLOWED_VERIFICATION_UPDATE_FIELDS.includes(k)
    );
    if (unknownKeys.length > 0) {
      return errorResponse(
        'INVALID_FIELD',
        `Unknown fields: ${unknownKeys.join(', ')}. Allowed fields: ${ALLOWED_VERIFICATION_UPDATE_FIELDS.join(', ')}`,
        400
      );
    }

    // Validate verification_status if present
    if (
      'verification_status' in body &&
      !VALID_VERIFICATION_STATUSES.includes(body.verification_status as VerificationStatus)
    ) {
      return errorResponse(
        'INVALID_VALUE',
        `verification_status must be one of: ${VALID_VERIFICATION_STATUSES.join(', ')}`,
        400
      );
    }

    // Validate at least one field provided
    if (Object.keys(body).length === 0) {
      return errorResponse('MISSING_FIELDS', 'At least one field must be provided to update', 400);
    }

    // Update verification
    const validatedBody = body as Parameters<typeof updateVerification>[1];
    const { data, error } = await updateVerification(id, validatedBody);

    if (error || !data) {
      // Check if profile exists to distinguish 404 vs 500
      const { data: existing } = await getVerificationById(id);
      if (!existing) {
        return errorResponse('NOT_FOUND', 'Verification not found', 404);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to update verification', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'verification.update',
      target_type: 'profile',
      target_id: id,
      description: 'Updated verification via API',
      metadata: { fields_updated: Object.keys(body) },
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

    // Extract ID from URL: /api/v1/verifications/:id
    const segments = ctx.url.pathname.split('/');
    const verificationsIdx = segments.indexOf('verifications');
    const id = segments[verificationsIdx + 1];

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid verification ID format', 400);
    }

    // Reset verification fields
    const { data, error } = await deleteVerification(id);

    if (error || !data) {
      // Check if profile exists to distinguish 404 vs 500
      const { data: existing } = await getVerificationById(id);
      if (!existing) {
        return errorResponse('NOT_FOUND', 'Verification not found', 404);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to reset verification', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'verification.delete',
      target_type: 'profile',
      target_id: id,
      description: 'Reset verification via API',
    });

    return successResponse(data);
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
