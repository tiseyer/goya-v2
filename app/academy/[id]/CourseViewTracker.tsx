'use client';

import { useEffect } from 'react';
import { Analytics } from '@/lib/analytics/events';

export default function CourseViewTracker({ courseId, courseName }: { courseId: string; courseName: string }) {
  useEffect(() => {
    Analytics.courseViewed(courseId, courseName);
  }, [courseId, courseName]);

  return null;
}
