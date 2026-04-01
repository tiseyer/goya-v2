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
 * Handles add/edit state for Plan 01 — placeholder handlers will be replaced
 * by a full lesson form modal in Plan 02.
 */
export default function LessonSection({ courseId, initialLessons }: LessonSectionProps) {
  function handleAddLesson() {
    // Plan 02 will open the LessonFormModal here
  }

  function handleEditLesson(_lesson: Lesson) {
    // Plan 02 will open the LessonFormModal with the lesson data here
  }

  return (
    <LessonList
      courseId={courseId}
      initialLessons={initialLessons}
      onAddLesson={handleAddLesson}
      onEditLesson={handleEditLesson}
    />
  );
}
