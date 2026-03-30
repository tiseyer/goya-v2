import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getAllSettings, updateSettings } from '@/lib/api/services/settings';

const handlers = createApiHandler({
  GET: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission — admin only
    const forbidden = requirePermission(keyOrError, 'admin');
    if (forbidden) return forbidden;

    // Query
    const { data, error } = await getAllSettings();

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch settings', 500);
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

    // Permission — admin only
    const forbidden = requirePermission(keyOrError, 'admin');
    if (forbidden) return forbidden;

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Validate: body.settings must be a non-null object with at least one key
    if (
      !body.settings ||
      typeof body.settings !== 'object' ||
      Array.isArray(body.settings) ||
      Object.keys(body.settings as object).length === 0
    ) {
      return errorResponse(
        'INVALID_BODY',
        'settings must be a non-empty object of key-value string pairs',
        400
      );
    }

    const settings = body.settings as Record<string, unknown>;

    // Validate: all values must be strings
    for (const [k, v] of Object.entries(settings)) {
      if (typeof v !== 'string') {
        return errorResponse(
          'INVALID_VALUE',
          `settings.${k} must be a string`,
          400
        );
      }
    }

    // Bulk update
    const { data, error } = await updateSettings(settings as Record<string, string>);

    if (error) {
      return errorResponse('INTERNAL_ERROR', 'Failed to update settings', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'settings.bulk_update',
      target_type: 'site_settings',
      description: 'Bulk updated admin settings via API',
      metadata: { keys: Object.keys(settings) },
    });

    return successResponse(data);
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
