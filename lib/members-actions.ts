'use server';

import { createSupabaseServerClient } from './supabaseServer';
import { type Member, type MemberRole } from './members-data';

/**
 * Fetches approved schools from Supabase and maps them to the Member format
 * for display in the member directory.
 */
export async function fetchSchoolMembers(): Promise<Member[]> {
  const supabase = await createSupabaseServerClient();

  // Fetch approved schools
  const { data: schoolRows, error: schoolError } = await supabase
    .from('schools')
    .select('id, name, slug, logo_url, bio, short_bio, city, country, location_city, location_country, course_delivery_format, created_at, owner_id')
    .eq('status', 'approved');

  if (schoolError || !schoolRows?.length) {
    return [];
  }

  // Fetch school designations for all approved schools
  const schoolIds = schoolRows.map(s => s.id);
  const { data: schoolDesRows } = schoolIds.length > 0
    ? await supabase
        .from('school_designations')
        .select('school_id, designation_type')
        .in('school_id', schoolIds)
    : { data: [] };

  // Group designations by school_id
  const desBySchool: Record<string, string[]> = {};
  for (const d of schoolDesRows ?? []) {
    if (!desBySchool[d.school_id]) desBySchool[d.school_id] = [];
    desBySchool[d.school_id].push(d.designation_type);
  }

  // Map schools to Member format
  const schoolMembers: Member[] = schoolRows.map(s => ({
    id: s.owner_id ?? s.id,
    name: s.name,
    role: 'School' as MemberRole,
    country: s.location_country ?? s.country ?? 'Unknown',
    city: s.location_city ?? s.city ?? '',
    coordinates: [0, 0] as [number, number],
    bio: s.short_bio ?? s.bio ?? '',
    photo: s.logo_url ?? '',
    designations: desBySchool[s.id] ?? [],
    teachingStyles: [],
    specialties: [],
    credits: { CE: 0, Community: 0, Karma: 0, Practice: 0 },
    social: {},
    memberSince: s.created_at
      ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : '',
    slug: s.slug ?? undefined,
    schoolDesignations: desBySchool[s.id] ?? [],
  }));

  return schoolMembers;
}
