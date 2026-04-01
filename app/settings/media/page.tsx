import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import MemberMediaClient from './MemberMediaClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media — GOYA Settings',
};

const ALLOWED_ROLES = ['teacher', 'wellness_practitioner', 'admin'];

interface PageProps {
  searchParams: Promise<{
    folder?: string;
    view?: string;
    q?: string;
    type?: string;
    date?: string;
    sort?: string;
  }>;
}

export default async function MemberMediaPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/settings');
  }

  const params = await searchParams;

  return (
    <MemberMediaClient
      currentUserId={user.id}
      folder={params.folder}
      view={params.view}
      q={params.q}
      type={params.type}
      date={params.date}
      sort={params.sort}
    />
  );
}
