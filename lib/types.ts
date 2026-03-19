export type UserRole = 'student' | 'teacher' | 'wellness_practitioner' | 'moderator' | 'admin';
export type SubscriptionStatus = 'member' | 'guest';
export type EventCategory = 'Workshop' | 'Teacher Training' | 'Dharma Talk' | 'Conference' | 'Yoga Sequence' | 'Music Playlist' | 'Research';
export type EventFormat = 'Online' | 'In Person' | 'Hybrid';
export type EventStatus = 'published' | 'draft' | 'cancelled' | 'deleted';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  mrn: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  youtube: string | null;
  is_verified: boolean;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  format: EventFormat;
  description: string | null;
  date: string;
  time_start: string;
  time_end: string;
  location: string | null;
  instructor: string | null;
  price: number;
  is_free: boolean;
  spots_total: number | null;
  spots_remaining: number | null;
  featured_image_url: string | null;
  status: EventStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
