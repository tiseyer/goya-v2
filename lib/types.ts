export type UserRole = 'student' | 'teacher' | 'wellness_practitioner' | 'moderator' | 'admin';
export type SubscriptionStatus = 'member' | 'guest';

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
