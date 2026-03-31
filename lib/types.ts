export type UserRole = 'student' | 'teacher' | 'wellness_practitioner' | 'moderator' | 'admin';
export type SubscriptionStatus = 'member' | 'guest';
export type MemberType = 'student' | 'teacher' | 'wellness_practitioner';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type EventCategory = 'Workshop' | 'Teacher Training' | 'Dharma Talk' | 'Conference' | 'Yoga Sequence' | 'Music Playlist' | 'Research';
export type EventFormat = 'Online' | 'In Person' | 'Hybrid';
export type EventStatus = 'published' | 'draft' | 'pending_review' | 'rejected' | 'cancelled' | 'deleted';
export type CourseCategory = 'Workshop' | 'Yoga Sequence' | 'Dharma Talk' | 'Music Playlist' | 'Research';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type CourseAccess = 'members_only' | 'free';
export type CourseStatus = 'published' | 'draft' | 'deleted';
export type ProgressStatus = 'in_progress' | 'completed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  mrn: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  introduction: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  youtube_intro_url: string | null;
  phone: string | null;
  is_verified: boolean;
  subscription_status: SubscriptionStatus;
  // Onboarding
  onboarding_completed: boolean;
  onboarding_step: number;
  member_type: MemberType | null;
  verification_status: VerificationStatus;
  // Shared
  practice_format: 'online' | 'in_person' | 'hybrid' | null;
  languages: string[] | null;
  // Student
  practice_level: string | null;
  practice_styles: string[] | null;
  // Teacher
  teacher_status: string | null;
  teaching_styles: string[] | null;
  years_teaching: string | null;
  teaching_focus_arr: string[] | null;
  influences_arr: string[] | null;
  other_org_member: boolean | null;
  other_org_names: string[] | null;
  other_org_name_other: string | null;
  other_org_registration: string | null;
  other_org_designations: string | null;
  certificate_is_official: boolean | null;
  certificate_url: string | null;
  // Wellness
  wellness_designations: string[] | null;
  wellness_designation_other: string | null;
  wellness_org_name: string | null;
  wellness_regulatory_body: boolean | null;
  wellness_regulatory_designations: string | null;
  wellness_focus: string[] | null;
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
  event_type: 'goya' | 'member';
  created_by: string | null;
  rejection_reason: string | null;
  status: EventStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  category: CourseCategory;
  instructor: string | null;
  duration: string | null;
  level: CourseLevel | null;
  access: CourseAccess;
  vimeo_url: string | null;
  thumbnail_url: string | null;
  gradient_from: string;
  gradient_to: string;
  status: CourseStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  status: ProgressStatus;
  enrolled_at: string;
  completed_at: string | null;
}

// ── Messaging ──────────────────────────────────────────────────────────────────

export interface ConversationParticipant {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface ConversationRow {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  other_participant: ConversationParticipant | null;
  last_message: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  actor_id: string | null;
  created_at: string;
  actor?: ConversationParticipant | null;
}
