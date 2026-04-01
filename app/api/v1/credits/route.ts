import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { paginatedResponse, successResponse, errorResponse } from '@/lib/api/response';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/api/pagination';
import { listCredits, createCredit, CREDITS_SORT_FIELDS } from '@/lib/api/services/credits';
import type { CreditType } from '@/lib/credits';

const VALID_CREDIT_TYPES: CreditType[] = ['ce', 'karma', 'practice', 'teaching', 'community'];
const VALID_STATUSES = ['pending', 'approved', 'rejected'];
const VALID_SOURCES = ['manual', 'automatic'];

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
    const pagination = parsePaginationParams(ctx.url, CREDITS_SORT_FIELDS);

    // Filters
    const rawStatus = ctx.url.searchParams.get('status');
    const status = rawStatus && VALID_STATUSES.includes(rawStatus)
      ? (rawStatus as 'pending' | 'approved' | 'rejected')
      : undefined;

    const user_id = ctx.url.searchParams.get('user_id') ?? undefined;

    const rawCreditType = ctx.url.searchParams.get('credit_type');
    const credit_type = rawCreditType && VALID_CREDIT_TYPES.includes(rawCreditType as CreditType)
      ? (rawCreditType as CreditType)
      : undefined;

    const date_from = ctx.url.searchParams.get('date_from') ?? undefined;
    const date_to = ctx.url.searchParams.get('date_to') ?? undefined;

    // Query
    const { data, count, error } = await listCredits({
      pagination,
      status,
      user_id,
      credit_type,
      date_from,
      date_to,
    });

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch credits', 500);
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
    if (!body.user_id || typeof body.user_id !== 'string' || body.user_id.trim() === '') {
      return errorResponse('MISSING_FIELD', 'user_id is required', 400);
    }
    if (!body.credit_type || !VALID_CREDIT_TYPES.includes(body.credit_type as CreditType)) {
      return errorResponse(
        'INVALID_VALUE',
        `credit_type must be one of: ${VALID_CREDIT_TYPES.join(', ')}`,
        400
      );
    }
    if (body.amount === undefined || typeof body.amount !== 'number' || body.amount <= 0) {
      return errorResponse('INVALID_VALUE', 'amount must be a number greater than 0', 400);
    }
    if (!body.activity_date || typeof body.activity_date !== 'string' || body.activity_date.trim() === '') {
      return errorResponse('MISSING_FIELD', 'activity_date is required', 400);
    }

    // Validate optional enum fields
    if (body.source !== undefined && !VALID_SOURCES.includes(body.source as string)) {
      return errorResponse(
        'INVALID_VALUE',
        `source must be one of: ${VALID_SOURCES.join(', ')}`,
        400
      );
    }
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status as string)) {
      return errorResponse(
        'INVALID_VALUE',
        `status must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    // Build params from validated body — only pass known fields
    const params = {
      user_id: body.user_id as string,
      credit_type: body.credit_type as CreditType,
      amount: body.amount as number,
      activity_date: body.activity_date as string,
      ...(body.description !== undefined && { description: body.description as string | null }),
      ...(body.source !== undefined && { source: body.source as 'manual' | 'automatic' }),
      ...(body.status !== undefined && { status: body.status as 'pending' | 'approved' | 'rejected' }),
    };

    // Create credit
    const { data, error } = await createCredit(params);

    if (error || !data) {
      return errorResponse('CREATE_ERROR', 'Failed to create credit entry', 500);
    }

    // Audit log
    await ctx.logAudit({
      category: 'admin',
      action: 'credit.create',
      target_type: 'credit',
      target_id: data.id,
      description: 'Created credit entry via API',
      metadata: { user_id: data.user_id, credit_type: data.credit_type, amount: data.amount },
    });

    return successResponse(data, 201);
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
