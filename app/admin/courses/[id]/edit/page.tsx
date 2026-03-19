import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Course } from '@/lib/types';
import CourseForm from '../../components/CourseForm';

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Edit Course</h1>
        <p className="text-sm text-[#6B7280] mt-0.5 truncate max-w-md">{(data as Course).title}</p>
      </div>
      <CourseForm course={data as Course} />
    </div>
  );
}
