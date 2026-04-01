import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import {
  getAddonById,
  updateAddon,
  deleteAddon,
  ALLOWED_ADDON_UPDATE_FIELDS,
  VALID_ADDON_CATEGORIES,
} from '@/lib/api/services/addons';

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

    // Extract ID from URL
    const id = ctx.url.pathname.split('/').at(-1)!;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid add-on ID format', 400);
    }

    // Query
    const { data, error } = await getAddonById(id);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'Add-on not found', 404);
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

    // Extract ID from URL
    const id = ctx.url.pathname.split('/').at(-1)!;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid add-on ID format', 400);
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Check at least one field provided
    if (Object.keys(body).length === 0) {
      return errorResponse('MISSING_FIELDS', 'At least one field must be provided to update', 400);
    }

    // Validate body fields — only allow known fields
    const unknownKeys = Object.keys(body).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (k) => !ALLOWED_ADDON_UPDATE_FIELDS.includes(k as any)
    );
    if (unknownKeys.length > 0) {
      return errorResponse(
        'INVALID_FIELD',
        `Unknown fields: ${unknownKeys.join(', ')}. Allowed fields: ${ALLOWED_ADDON_UPDATE_FIELDS.join(', ')}`,
        400
      );
    }

    // Validate category if provided
    if ('category' in body && !(VALID_ADDON_CATEGORIES as readonly string[]).includes(body.category as string)) {
      return errorResponse(
        'INVALID_VALUE',
        `category must be one of: ${VALID_ADDON_CATEGORIES.join(', ')}`,
        400
      );
    }

    // Update add-on
    const validatedBody = body as Parameters<typeof updateAddon>[1];
    const { data, error } = await updateAddon(id, validatedBody);

    if (error || !data) {
      // Check if add-on exists to distinguish 404 vs 500
      const { data: existing } = await getAddonById(id);
      if (!existing) {
        return errorResponse('NOT_FOUND', 'Add-on not found', 404);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to update add-on', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'addon.update',
      target_type: 'product',
      target_id: data.id,
      description: 'Updated add-on via API',
      metadata: { fields: Object.keys(body) },
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

    // Extract ID from URL
    const id = ctx.url.pathname.split('/').at(-1)!;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return errorResponse('INVALID_ID', 'Invalid add-on ID format', 400);
    }

    // Soft-delete add-on
    const { data, error } = await deleteAddon(id);

    if (error || !data) {
      // Check if add-on exists to distinguish 404 vs 500
      const { data: existing } = await getAddonById(id);
      if (!existing) {
        return errorResponse('NOT_FOUND', 'Add-on not found', 404);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to delete add-on', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'addon.delete',
      target_type: 'product',
      target_id: id,
      description: 'Soft-deleted add-on via API',
    });

    return successResponse(data);
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
