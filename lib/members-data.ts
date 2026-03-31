// Member data now fetched via server action in lib/members-actions.ts

export type MemberRole = 'Teacher' | 'Student' | 'School' | 'Wellness Practitioner';

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  country: string;
  city: string;
  coordinates: [number, number]; // [lng, lat]
  bio: string;
  photo: string;
  designations: string[];
  teachingStyles: string[];
  specialties: string[];
  credits: {
    CE: number;
    Community: number;
    Karma: number;
    Practice: number;
  };
  social: {
    website?: string;
    instagram?: string;
    youtube?: string;
  };
  memberSince: string;
  featured?: boolean;
  is_verified?: boolean;
  introduction?: string;
  videoIntroUrl?: string;
}
