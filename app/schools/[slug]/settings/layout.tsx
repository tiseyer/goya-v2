import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import SchoolSettingsShell from './components/SchoolSettingsShell';

export default async function SchoolSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const [profileResult, schoolResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('schools').select('*').eq('slug', slug).single(),
  ]);

  const profile = profileResult.data;
  const school = schoolResult.data;

  if (!school) redirect('/dashboard');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';
  const isOwner = school.owner_id === user.id;

  if (!isOwner && !isAdmin) redirect('/dashboard');

  return (
    <SchoolSettingsShell schoolSlug={slug} schoolStatus={school.status}>
      {children}
    </SchoolSettingsShell>
  );
}
