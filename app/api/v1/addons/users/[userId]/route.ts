import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getUserAddons, assignAddonToUser } from '@/lib/api/services/addons';

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

    // Extract userId from URL: /api/v1/addons/users/:userId
    const segments = ctx.url.pathname.split('/');
    const userId = segments[segments.indexOf('users') + 1];

    // Validate UUID format
    if (!userId || !UUID_REGEX.test(userId)) {
      return errorResponse('INVALID_ID', 'Invalid user ID format', 400);
    }

    const { data, error } = await getUserAddons(userId);

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch user add-ons', 500);
    }

    return successResponse(data);
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

    // Extract userId from URL: /api/v1/addons/users/:userId
    const segments = ctx.url.pathname.split('/');
    const userId = segments[segments.indexOf('users') + 1];

    // Validate UUID format
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

    // Validate required fields
    const stripe_product_id = body.stripe_product_id as string | undefined;
    const stripe_price_id = body.stripe_price_id as string | undefined;

    if (!stripe_product_id || typeof stripe_product_id !== 'string' || stripe_product_id.trim() === '') {
      return errorResponse('MISSING_FIELD', 'stripe_product_id is required', 400);
    }
    if (!stripe_price_id || typeof stripe_price_id !== 'string' || stripe_price_id.trim() === '') {
      return errorResponse('MISSING_FIELD', 'stripe_price_id is required', 400);
    }

    const { data, error } = await assignAddonToUser(userId, { stripe_product_id, stripe_price_id });

    if (error === 'ALREADY_ASSIGNED') {
      return errorResponse('ALREADY_ASSIGNED', 'User already has this add-on', 409);
    }
    if (error) {
      return errorResponse('ASSIGN_ERROR', 'Failed to assign add-on to user', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'addon.assign',
      target_type: 'user_designation',
      target_id: data.id,
      description: 'Assigned add-on to user via API',
      metadata: { user_id: userId, stripe_product_id },
    });

    return successResponse(data, 201);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
