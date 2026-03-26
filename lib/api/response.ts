// API data access: import { getSupabaseService } from '@/lib/supabase/service'

import { NextResponse } from 'next/server';
import type { ApiResponse, ApiErrorDetail, ApiMeta, PaginationMeta } from './types';

const API_VERSION = '1.0.0';

function buildMeta(pagination?: PaginationMeta): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    ...(pagination ? { pagination } : {}),
  };
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, error: null, meta: buildMeta() },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T,
  pagination: PaginationMeta,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, error: null, meta: buildMeta(pagination) },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiResponse<null>> {
  const error: ApiErrorDetail = { code, message, ...(details ? { details } : {}) };
  return NextResponse.json(
    { success: false, data: null, error, meta: buildMeta() },
    { status }
  );
}
