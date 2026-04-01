import type { Database } from '@/types/supabase';

export type CourseCategory = Database['public']['Tables']['course_categories']['Row'];

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  parent_id: string | null;
}

/**
 * Converts a category name to a URL-safe slug.
 * Lowercases, trims, replaces non-alphanumeric sequences with hyphens,
 * and strips leading/trailing hyphens.
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
