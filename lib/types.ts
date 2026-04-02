export type UserRole = 'student' | 'teacher' | 'wellness_practitioner' | 'moderator' | 'admin';
export type SubscriptionStatus = 'member' | 'guest';
export type MemberType = 'student' | 'teacher' | 'wellness_practitioner';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type EventCategory = 'Workshop' | 'Teacher Training' | 'Dharma Talk' | 'Conference' | 'Yoga Sequence' | 'Music Playlist' | 'Research';
export type EventFormat = 'Online' | 'In Person' | 'Hybrid';
export type EventStatus = 'published' | 'draft' | 'cancelled' | 'deleted' | 'pending_review' | 'rejected';
export type CourseCategory = 'Workshop' | 'Yoga Sequence' | 'Dharma Talk' | 'Music Playlist' | 'Research';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type CourseAccess = 'members_only' | 'free';
export type CourseStatus = 'published' | 'draft' | 'deleted' | 'pending_review' | 'rejected';
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
  cover_image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_place_id: string | null;
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
  lineage: string[] | null;
  other_org_member: boolean | null;
  other_org_names: string[] | null;
  other_org_name_other: string | null;
  other_org_registration: string | null;
  other_org_designations: string | null;
  certificate_is_official: boolean | null;
  certificate_url: string | null;
  principal_trainer_school_id: string | null;
  faculty_school_ids: string[] | null;
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
  end_date: string | null;
  all_day: boolean;
  event_type: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  online_platform_name: string | null;
  online_platform_url: string | null;
  registration_required: boolean;
  website_url: string | null;
  organizer_ids: string[];
  rejection_reason: string | null;
  instructor: string | null;
  price: number;
  is_free: boolean;
  spots_total: number | null;
  spots_remaining: number | null;
  featured_image_url: string | null;
  status: EventStatus;
  author_type: string | null;
  school_author_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  category: CourseCategory | null;
  category_id: string | null;
  instructor: string | null;
  duration: string | null;
  duration_minutes: number | null;
  level: CourseLevel | null;
  access: CourseAccess;
  vimeo_url: string | null;
  video_url: string | null;
  video_platform: string | null;
  thumbnail_url: string | null;
  gradient_from: string;
  gradient_to: string;
  rejection_reason: string | null;
  course_type: string | null;
  author_type: string | null;
  school_author_id: string | null;
  status: CourseStatus;
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

export interface EventCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
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
  created_at: string;
  actor?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ConversationRow {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  last_message: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
  other_participant: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string | null;
  sender_school_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  plan_name: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'paused' | 'unpaid';
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}
