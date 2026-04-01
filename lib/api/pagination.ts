import type { PaginationParams, PaginationMeta } from './types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_SORT = 'created_at';
const DEFAULT_ORDER = 'desc' as const;

/**
 * Parse pagination/sort query params from a URL.
 * Returns validated, safe defaults for missing or invalid values.
 */
export function parsePaginationParams(url: URL, allowedSortFields?: string[]): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '', 10) || DEFAULT_PAGE);
  const rawLimit = parseInt(url.searchParams.get('limit') ?? '', 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

  const sortParam = url.searchParams.get('sort') ?? DEFAULT_SORT;
  const sort = allowedSortFields && !allowedSortFields.includes(sortParam) ? DEFAULT_SORT : sortParam;

  const orderParam = url.searchParams.get('order')?.toLowerCase();
  const order = orderParam === 'asc' ? 'asc' : DEFAULT_ORDER;

  return { page, limit, sort, order };
}

/**
 * Build PaginationMeta from total count and current params.
 */
export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  const total_pages = Math.ceil(total / params.limit) || 1;
  return {
    page: params.page,
    limit: params.limit,
    total,
    total_pages,
    has_next: params.page < total_pages,
    has_prev: params.page > 1,
  };
}

/**
 * Compute Supabase .range() args from pagination params.
 * Returns [from, to] inclusive indexes for Supabase queries.
 */
export function paginationToRange(params: PaginationParams): [number, number] {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;
  return [from, to];
}
