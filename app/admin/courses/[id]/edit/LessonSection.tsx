'use client';

import dynamic from 'next/dynamic';
import type { Lesson } from '@/lib/courses/lessons';

// Dynamic import with ssr: false prevents dnd-kit from running during SSR
// (dnd-kit uses browser APIs like window, which fail during server rendering)
const LessonList = dynamic(
  () => import('../../components/LessonList'),
  { ssr: false },
);

interface LessonSectionProps {
  courseId: string;
  initialLessons: Lesson[];
}

/**
 * Client wrapper for LessonList.
 * Uses next/dynamic ssr:false to keep the edit page as a server component
 * while preventing dnd-kit browser API errors during SSR.
 * LessonList manages add/edit/delete form state internally.
 */
export default function LessonSection({ courseId, initialLessons }: LessonSectionProps) {
  return (
    <LessonList
      courseId={courseId}
      initialLessons={initialLessons}
    />
  );
}
