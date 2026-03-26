import { getSupabaseService } from '@/lib/supabase/service';
import { paginationToRange } from '@/lib/api/pagination';
import type { PaginationParams } from '@/lib/api/types';

export const ADDONS_SORT_FIELDS = ['created_at', 'updated_at', 'name', 'category', 'priority', 'price_cents'];

export const VALID_ADDON_CATEGORIES = [
  'teacher_designation',
  'experienced_teacher',
  'school_designation',
  'special',
] as const;

export type AddonCategory = typeof VALID_ADDON_CATEGORIES[number];

export interface ListAddonsParams {
  pagination: PaginationParams;
  category?: string;
  search?: string;
}

/**
 * List active add-ons (products) with optional filters and pagination.
 * Per ADON-01.
 */
export async function listAddons(params: ListAddonsParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { pagination, category, search } = params;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (category) {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,full_name.ilike.%${search}%,slug.ilike.%${search}%`
    );
  }

  query = query.order(pagination.sort, { ascending: pagination.order === 'asc' });

  const [from, to] = paginationToRange(pagination);
  query = query.range(from, to);

  const { data, count, error } = await query;
  return { data, count, error };
}

/**
 * Fetch a single add-on (product) by ID. Returns even inactive products.
 * Per ADON-02.
 */
export async function getAddonById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export interface CreateAddonParams {
  slug: string;
  name: string;
  full_name: string;
  category: string;
  price_display: string;
  price_cents?: number;
  image_path?: string | null;
  description?: string | null;
  features?: unknown;
  requires_any_of?: string[];
  hidden_if_has_any?: string[];
  has_variants?: boolean;
  variants?: unknown;
  priority?: number;
  is_active?: boolean;
}

/**
 * Create a new add-on (product).
 * Per ADON-03.
 */
export async function createAddon(params: CreateAddonParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('products')
    .insert(params)
    .select()
    .single();

  return { data, error };
}

export interface UpdateAddonParams {
  name?: string;
  full_name?: string;
  category?: string;
  price_display?: string;
  price_cents?: number;
  image_path?: string | null;
  description?: string | null;
  features?: unknown;
  requires_any_of?: string[];
  hidden_if_has_any?: string[];
  has_variants?: boolean;
  variants?: unknown;
  priority?: number;
  is_active?: boolean;
}

export const ALLOWED_ADDON_UPDATE_FIELDS: (keyof UpdateAddonParams)[] = [
  'name',
  'full_name',
  'category',
  'price_display',
  'price_cents',
  'image_path',
  'description',
  'features',
  'requires_any_of',
  'hidden_if_has_any',
  'has_variants',
  'variants',
  'priority',
  'is_active',
];

/**
 * Update allowed fields on an add-on (product). Slug is immutable.
 * Per ADON-04.
 */
export async function updateAddon(id: string, updates: UpdateAddonParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  // Validate: only allowed fields
  const keys = Object.keys(updates) as (keyof UpdateAddonParams)[];
  if (keys.length === 0) {
    return { data: null, error: new Error('No valid fields to update') };
  }
  for (const key of keys) {
    if (!ALLOWED_ADDON_UPDATE_FIELDS.includes(key)) {
      return { data: null, error: new Error(`Field '${key}' is not allowed`) };
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Soft-delete an add-on by setting is_active = false.
 * Per ADON-05.
 */
export async function deleteAddon(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
    .eq('is_active', true)
    .select()
    .single();

  return { data, error };
}
