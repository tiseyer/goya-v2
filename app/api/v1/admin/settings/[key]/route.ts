import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSettingByKey, updateSettingByKey } from '@/lib/api/services/settings';

const SETTING_KEY_REGEX = /^[a-z0-9_]+$/;

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

    // Extract setting key from URL: last pathname segment
    const segments = ctx.url.pathname.split('/');
    const settingKey = segments[segments.length - 1];

    // Validate key format
    if (!settingKey || !SETTING_KEY_REGEX.test(settingKey)) {
      return errorResponse('INVALID_KEY', 'Setting key must be non-empty and contain only lowercase alphanumeric characters and underscores', 400);
    }

    // Query
    const { data, error } = await getSettingByKey(settingKey);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'Setting not found', 404);
    }

    return successResponse(data);
  },

  PATCH: async (ctx) => {
    // Auth
    const apiKeyData = await validateApiKey(ctx.req);
    if (apiKeyData instanceof Response) return apiKeyData;

    // Rate limit
    const limited = rateLimit(apiKeyData.id);
    if (limited) return limited;

    // Permission — admin only
    const forbidden = requirePermission(apiKeyData, 'admin');
    if (forbidden) return forbidden;

    // Extract setting key from URL: last pathname segment
    const segments = ctx.url.pathname.split('/');
    const settingKey = segments[segments.length - 1];

    // Validate key format
    if (!settingKey || !SETTING_KEY_REGEX.test(settingKey)) {
      return errorResponse('INVALID_KEY', 'Setting key must be non-empty and contain only lowercase alphanumeric characters and underscores', 400);
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Validate: body.value must be a string (can be empty)
    if (typeof body.value !== 'string') {
      return errorResponse('INVALID_VALUE', 'value must be a string', 400);
    }

    // Update
    const { data, error } = await updateSettingByKey(settingKey, body.value);

    if (error || !data) {
      return errorResponse('NOT_FOUND', 'Setting not found', 404);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'settings.update',
      target_type: 'site_settings',
      target_id: data.id,
      description: 'Updated admin setting via API',
      metadata: { key: settingKey },
    });

    return successResponse(data);
  },
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
