'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { EventCategoryRow } from '@/lib/types';

export async function getCategories(): Promise<EventCategoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('[getCategories] error:', error.message);
    return [];
  }
  return (data ?? []) as EventCategoryRow[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createCategory(formData: FormData): Promise<{ success: boolean; error?: string; data?: EventCategoryRow }> {
  const supabase = await createSupabaseServerClient();

  const name = (formData.get('name') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim() || generateSlug(name);
  const description = (formData.get('description') as string)?.trim() || null;
  const color = (formData.get('color') as string)?.trim() || '#345c83';
  const parent_id = (formData.get('parent_id') as string) || null;
  const sort_order = parseInt(formData.get('sort_order') as string) || 0;

  if (!name) return { success: false, error: 'Name is required.' };
  if (!slug) return { success: false, error: 'Slug is required.' };

  const { data, error } = await supabase
    .from('event_categories')
    .insert({ name, slug, description, color, parent_id, sort_order })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A category with this slug already exists.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/events');
  return { success: true, data: data as EventCategoryRow };
}

export async function updateCategory(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const name = (formData.get('name') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const color = (formData.get('color') as string)?.trim() || '#345c83';
  const parent_id = (formData.get('parent_id') as string) || null;
  const sort_order = parseInt(formData.get('sort_order') as string) || 0;

  if (!name) return { success: false, error: 'Name is required.' };
  if (!slug) return { success: false, error: 'Slug is required.' };

  const { error } = await supabase
    .from('event_categories')
    .update({ name, slug, description, color, parent_id, sort_order, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A category with this slug already exists.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/events');
  return { success: true };
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  // Check if any events use this category
  const { data: catData, error: catError } = await supabase
    .from('event_categories')
    .select('name')
    .eq('id', id)
    .single();

  if (catError || !catData) {
    return { success: false, error: 'Category not found.' };
  }

  const { count, error: countError } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('category', catData.name);

  if (countError) {
    return { success: false, error: countError.message };
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `Category is in use by ${count} event${count !== 1 ? 's' : ''}. Remove or reassign those events first.`,
    };
  }

  const { error: deleteError } = await supabase
    .from('event_categories')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath('/admin/events');
  return { success: true };
}
