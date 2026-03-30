import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { paginatedResponse, successResponse, errorResponse } from '@/lib/api/response';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/api/pagination';
import {
  listAddons,
  createAddon,
  ADDONS_SORT_FIELDS,
  VALID_ADDON_CATEGORIES,
} from '@/lib/api/services/addons';

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
    const pagination = parsePaginationParams(ctx.url, ADDONS_SORT_FIELDS);

    // Filters
    const rawCategory = ctx.url.searchParams.get('category');
    const category: string | undefined =
      rawCategory && (VALID_ADDON_CATEGORIES as readonly string[]).includes(rawCategory)
        ? rawCategory
        : undefined;

    if (rawCategory && !category) {
      return errorResponse(
        'INVALID_VALUE',
        `category must be one of: ${VALID_ADDON_CATEGORIES.join(', ')}`,
        400
      );
    }

    const search = ctx.url.searchParams.get('search') ?? undefined;

    // Query
    const { data, count, error } = await listAddons({ pagination, category, search });

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch add-ons', 500);
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

    // Validate required fields
    if (!body.slug || typeof body.slug !== 'string' || body.slug.trim() === '') {
      return errorResponse('MISSING_FIELD', 'slug is required', 400);
    }
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return errorResponse('MISSING_FIELD', 'name is required', 400);
    }
    if (!body.full_name || typeof body.full_name !== 'string' || body.full_name.trim() === '') {
      return errorResponse('MISSING_FIELD', 'full_name is required', 400);
    }
    if (!body.category || !(VALID_ADDON_CATEGORIES as readonly string[]).includes(body.category as string)) {
      return errorResponse(
        'INVALID_VALUE',
        `category must be one of: ${VALID_ADDON_CATEGORIES.join(', ')}`,
        400
      );
    }
    if (!body.price_display || typeof body.price_display !== 'string' || body.price_display.trim() === '') {
      return errorResponse('MISSING_FIELD', 'price_display is required', 400);
    }

    // Build params — only pass through known fields
    const params = {
      slug: body.slug as string,
      name: body.name as string,
      full_name: body.full_name as string,
      category: body.category as string,
      price_display: body.price_display as string,
      ...(body.price_cents !== undefined && { price_cents: body.price_cents as number }),
      ...(body.image_path !== undefined && { image_path: body.image_path as string | null }),
      ...(body.description !== undefined && { description: body.description as string | null }),
      ...(body.features !== undefined && { features: body.features }),
      ...(body.requires_any_of !== undefined && { requires_any_of: body.requires_any_of as string[] }),
      ...(body.hidden_if_has_any !== undefined && { hidden_if_has_any: body.hidden_if_has_any as string[] }),
      ...(body.has_variants !== undefined && { has_variants: body.has_variants as boolean }),
      ...(body.variants !== undefined && { variants: body.variants }),
      ...(body.priority !== undefined && { priority: body.priority as number }),
      ...(body.is_active !== undefined && { is_active: body.is_active as boolean }),
    };

    // Create add-on
    const { data, error } = await createAddon(params);

    if (error || !data) {
      return errorResponse('CREATE_ERROR', 'Failed to create add-on', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'addon.create',
      target_type: 'product',
      target_id: data.id,
      description: 'Created add-on via API',
      metadata: { name: data.name },
    });

    return successResponse(data, 201);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
