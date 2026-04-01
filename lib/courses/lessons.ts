export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  type: string;
  sort_order: number;
  short_description: string | null;
  description: string | null;
  video_platform: string | null;
  video_url: string | null;
  audio_url: string | null;
  featured_image_url: string | null;
  duration_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export type LessonType = 'video' | 'audio' | 'text';

export interface LessonFormData {
  title: string;
  type: LessonType;
  video_platform: 'vimeo' | 'youtube' | null;
  video_url: string | null;
  audio_url: string | null;
  featured_image_url: string | null;
  short_description: string | null;
  description: string | null;
  duration_minutes: number | null;
}
