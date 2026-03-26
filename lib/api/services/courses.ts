import { getSupabaseService } from '@/lib/supabase/service';
import { paginationToRange } from '@/lib/api/pagination';
import type { PaginationParams } from '@/lib/api/types';
import type { CourseCategory, CourseLevel, CourseAccess, CourseStatus } from '@/lib/types';

export const COURSES_SORT_FIELDS = ['created_at', 'updated_at', 'title', 'category', 'level', 'status'];

export interface ListCoursesParams {
  pagination: PaginationParams;
  category?: CourseCategory;
  level?: CourseLevel;
  access?: CourseAccess;
  status?: CourseStatus;
  search?: string;
}

/**
 * List courses with optional filters and pagination.
 * Per CRSE-01.
 */
export async function listCourses(params: ListCoursesParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { pagination, category, level, access, status, search } = params;

  let query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  if (category) {
    query = query.eq('category', category);
  }
  if (level) {
    query = query.eq('level', level);
  }
  if (access) {
    query = query.eq('access', access);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%`);
  }

  query = query.order(pagination.sort, { ascending: pagination.order === 'asc' });

  const [from, to] = paginationToRange(pagination);
  query = query.range(from, to);

  const { data, count, error } = await query;
  return { data, count, error };
}

/**
 * Fetch a single course by ID. Excludes soft-deleted courses.
 * Per CRSE-02.
 */
export async function getCourseById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  return { data, error };
}

export interface CreateCourseParams {
  title: string;
  category: CourseCategory;
  short_description?: string | null;
  description?: string | null;
  instructor?: string | null;
  duration?: string | null;
  level?: CourseLevel | null;
  access?: CourseAccess;
  vimeo_url?: string | null;
  thumbnail_url?: string | null;
  gradient_from?: string;
  gradient_to?: string;
  status?: CourseStatus;
}

/**
 * Create a new course.
 * Per CRSE-03.
 */
export async function createCourse(params: CreateCourseParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('courses')
    .insert(params)
    .select()
    .single();

  return { data, error };
}

export interface UpdateCourseParams {
  title?: string;
  category?: CourseCategory;
  short_description?: string | null;
  description?: string | null;
  instructor?: string | null;
  duration?: string | null;
  level?: CourseLevel | null;
  access?: CourseAccess;
  vimeo_url?: string | null;
  thumbnail_url?: string | null;
  gradient_from?: string;
  gradient_to?: string;
  status?: CourseStatus;
}

export const ALLOWED_COURSE_UPDATE_FIELDS: (keyof UpdateCourseParams)[] = [
  'title',
  'category',
  'short_description',
  'description',
  'instructor',
  'duration',
  'level',
  'access',
  'vimeo_url',
  'thumbnail_url',
  'gradient_from',
  'gradient_to',
  'status',
];

/**
 * Update allowed fields on a course.
 * Per CRSE-04.
 */
export async function updateCourse(id: string, updates: UpdateCourseParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  // Validate: only allowed fields
  const keys = Object.keys(updates) as (keyof UpdateCourseParams)[];
  if (keys.length === 0) {
    return { data: null, error: new Error('No valid fields to update') };
  }
  for (const key of keys) {
    if (!ALLOWED_COURSE_UPDATE_FIELDS.includes(key)) {
      return { data: null, error: new Error(`Field '${key}' is not allowed`) };
    }
  }

  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  return { data, error };
}

/**
 * Soft-delete a course by setting deleted_at and status='deleted'.
 * Per CRSE-05.
 */
export async function deleteCourse(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('courses')
    .update({ deleted_at: new Date().toISOString(), status: 'deleted' })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  return { data, error };
}
