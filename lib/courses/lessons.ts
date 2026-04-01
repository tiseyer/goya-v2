import type { Database } from '@/types/supabase';

export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type LessonInsert = Database['public']['Tables']['lessons']['Insert'];
export type LessonUpdate = Database['public']['Tables']['lessons']['Update'];
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
