'use server';

import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import type { CourseCategory, CategoryFormData } from '@/lib/courses/categories';

/**
 * Fetch all course categories ordered by sort_order then name.
 */
export async function fetchCategories(): Promise<{ data: CourseCategory[]; error: string | null }> {
  const supabase = await createSupabaseServerActionClient();
  const { data, error } = await supabase
    .from('course_categories')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: data as CourseCategory[], error: null };
}

/**
 * Create a new course category.
 * Validates name is non-empty and slug is unique before inserting.
 */
export async function createCategory(
  formData: CategoryFormData,
): Promise<{ success: boolean; category?: CourseCategory; error?: string }> {
  if (!formData.name.trim()) {
    return { success: false, error: 'Category name is required.' };
  }

  const supabase = await createSupabaseServerActionClient();

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('course_categories')
    .select('id')
    .eq('slug', formData.slug)
    .maybeSingle();
  if (existing) return { success: false, error: 'A category with this slug already exists.' };

  const { data, error } = await supabase
    .from('course_categories')
    .insert({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || null,
      color: formData.color || '#345c83',
      parent_id: formData.parent_id || null,
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, category: data as CourseCategory };
}

/**
 * Update an existing course category.
 * Validates slug uniqueness excluding the current record.
 */
export async function updateCategory(
  id: string,
  formData: CategoryFormData,
): Promise<{ success: boolean; category?: CourseCategory; error?: string }> {
  if (!formData.name.trim()) {
    return { success: false, error: 'Category name is required.' };
  }

  const supabase = await createSupabaseServerActionClient();

  // Check slug uniqueness excluding self
  const { data: existing } = await supabase
    .from('course_categories')
    .select('id')
    .eq('slug', formData.slug)
    .neq('id', id)
    .maybeSingle();
  if (existing) return { success: false, error: 'A category with this slug already exists.' };

  const { data, error } = await supabase
    .from('course_categories')
    .update({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || null,
      color: formData.color || '#345c83',
      parent_id: formData.parent_id || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, category: data as CourseCategory };
}

/**
 * Delete a course category.
 * Blocked if any courses reference this category via category_id.
 * Returns courseCount in all cases for caller awareness.
 */
export async function deleteCategory(
  id: string,
): Promise<{ success: boolean; error?: string; courseCount: number }> {
  const supabase = await createSupabaseServerActionClient();

  // Count courses referencing this category
  const { count, error: countErr } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (countErr) return { success: false, error: countErr.message, courseCount: 0 };

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: `This category is used by ${count} course${count !== 1 ? 's' : ''} and cannot be deleted.`,
      courseCount: count ?? 0,
    };
  }

  const { error } = await supabase.from('course_categories').delete().eq('id', id);
  if (error) return { success: false, error: error.message, courseCount: 0 };
  return { success: true, courseCount: 0 };
}
