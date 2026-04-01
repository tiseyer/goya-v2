import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import MyCoursesClient from './MyCoursesClient';
import type { Metadata } from 'next';
import type { Course } from '@/lib/types';

export const metadata: Metadata = {
  title: 'My Courses — GOYA Settings',
};

const ALLOWED_ROLES = ['teacher', 'wellness_practitioner', 'admin'];

export default async function MyCoursesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/settings');
  }

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('created_by', user.id)
    .eq('course_type', 'member')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  return <MyCoursesClient initialCourses={(courses ?? []) as Course[]} />;
}
