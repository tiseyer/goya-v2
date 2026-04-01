import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import MyEventsClient from './MyEventsClient';
import type { Metadata } from 'next';
import type { Event } from '@/lib/types';

export const metadata: Metadata = {
  title: 'My Events — GOYA Settings',
};

const ALLOWED_ROLES = ['teacher', 'wellness_practitioner', 'admin'];

export default async function MyEventsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/settings');
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', user.id)
    .eq('event_type', 'member')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  return (
    <MyEventsClient
      initialEvents={(events ?? []) as Event[]}
      currentUserId={user.id}
      currentUserName={profile.full_name ?? user.email ?? 'You'}
      currentUserAvatar={(profile as Record<string, unknown>).avatar_url as string | null}
      currentUserRole={profile.role}
    />
  );
}
