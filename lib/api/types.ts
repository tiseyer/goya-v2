// API key permissions
export type ApiKeyPermission = 'read' | 'write' | 'admin';

// Standard response envelope (AUTH-04)
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiErrorDetail | null;
  meta: ApiMeta | null;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  pagination?: PaginationMeta;
  timestamp: string;
  version: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Pagination query params
export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

// API key row shape (mirrors migration)
export interface ApiKeyRow {
  id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  permissions: ApiKeyPermission[];
  created_by: string | null;
  last_used_at: string | null;
  request_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}
