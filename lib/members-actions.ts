'use server';

import { getSupabaseService } from '@/lib/supabase/service';
import type { Member, MemberRole } from '@/lib/members-data';

function mapRole(memberType: string | null, role: string | null): MemberRole {
  const mt = memberType?.toLowerCase();
  if (mt === 'school') return 'School';
  if (mt === 'teacher') return 'Teacher';
  if (mt === 'student') return 'Student';
  if (mt === 'wellness_practitioner') return 'Wellness Practitioner';

  const r = role?.toLowerCase();
  if (r === 'teacher') return 'Teacher';
  if (r === 'student') return 'Student';
  if (r === 'wellness_practitioner') return 'Wellness Practitioner';

  return 'Student';
}

export async function fetchMembers(): Promise<{
  members: Member[];
  allDesignations: string[];
  allTeachingStyles: string[];
}> {
  const supabase = getSupabaseService();

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, first_name, last_name, avatar_url, bio, city, country, role, member_type, designations, teaching_styles, wellness_designations, is_verified, verification_status, website, instagram, youtube, youtube_intro_url, created_at, onboarding_completed'
    )
    .eq('onboarding_completed', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchMembers] Supabase error:', error);
    return { members: [], allDesignations: [], allTeachingStyles: [] };
  }

  const members: Member[] = (data ?? []).map((p) => {
    const name =
      p.full_name ||
      [p.first_name, p.last_name].filter(Boolean).join(' ') ||
      'Unknown Member';

    const designations = [
      ...((p.designations as string[] | null) ?? []),
      ...((p.wellness_designations as string[] | null) ?? []),
    ];

    return {
      id: p.id,
      name,
      role: mapRole(p.member_type ?? null, p.role ?? null),
      country: p.country ?? 'Unknown',
      city: p.city ?? '',
      coordinates: [0, 0],
      bio: p.bio ?? '',
      photo: p.avatar_url ?? '',
      designations,
      teachingStyles: (p.teaching_styles as string[] | null) ?? [],
      specialties: [],
      credits: { CE: 0, Community: 0, Karma: 0, Practice: 0 },
      social: {
        website: p.website ?? undefined,
        instagram: p.instagram ?? undefined,
        youtube: p.youtube ?? undefined,
      },
      memberSince: p.created_at
        ? String(new Date(p.created_at).getFullYear())
        : '',
      is_verified: p.verification_status === 'verified',
      videoIntroUrl: (p.youtube_intro_url as string | null) ?? undefined,
    };
  });

  const allDesignations = Array.from(
    new Set(members.flatMap((m) => m.designations))
  ).sort();

  const allTeachingStyles = Array.from(
    new Set(members.flatMap((m) => m.teachingStyles))
  ).sort();

  return { members, allDesignations, allTeachingStyles };
}
