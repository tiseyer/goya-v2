import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { paginatedResponse, errorResponse } from '@/lib/api/response';
import { parsePaginationParams, buildPaginationMeta } from '@/lib/api/pagination';
import { listUsers, USERS_SORT_FIELDS } from '@/lib/api/services/users';
import type { UserRole, SubscriptionStatus } from '@/lib/types';

const VALID_ROLES: UserRole[] = ['student', 'teacher', 'wellness_practitioner', 'moderator', 'admin'];
const VALID_STATUSES: SubscriptionStatus[] = ['member', 'guest'];

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
    const pagination = parsePaginationParams(ctx.url, USERS_SORT_FIELDS);

    // Filters
    const rawRole = ctx.url.searchParams.get('role');
    const role: UserRole | undefined =
      rawRole && VALID_ROLES.includes(rawRole as UserRole)
        ? (rawRole as UserRole)
        : undefined;

    const rawStatus = ctx.url.searchParams.get('status');
    const subscription_status: SubscriptionStatus | undefined =
      rawStatus && VALID_STATUSES.includes(rawStatus as SubscriptionStatus)
        ? (rawStatus as SubscriptionStatus)
        : undefined;

    const search = ctx.url.searchParams.get('search') ?? undefined;
    const date_from = ctx.url.searchParams.get('date_from') ?? undefined;
    const date_to = ctx.url.searchParams.get('date_to') ?? undefined;

    // Query
    const { data, count, error } = await listUsers({
      pagination,
      role,
      subscription_status,
      search,
      date_from,
      date_to,
    });

    if (error) {
      return errorResponse('QUERY_ERROR', 'Failed to fetch users', 500);
    }

    const meta = buildPaginationMeta(count ?? 0, pagination);
    return paginatedResponse(data, meta);
  },
});

export const GET = handlers.GET;
