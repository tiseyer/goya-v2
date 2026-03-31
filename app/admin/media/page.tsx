// app/admin/media/page.tsx
// Server component — loads initial folder list and current user info,
// then renders MediaPageClient. Admin layout.tsx handles AdminShell wrapping.

import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getFolders } from './actions';
import MediaPageClient from './MediaPageClient';

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{
    folder?: string;
    view?: string;
    q?: string;
    type?: string;
    date?: string;
    by?: string;
    sort?: string;
  }>;
}) {
  const [initialFolders, sp, supabase] = await Promise.all([
    getFolders(),
    searchParams,
    createSupabaseServerClient(),
  ]);

  // Fetch current user + role for upload attribution and isAdmin check.
  // Admin layout already ensures only admin/moderator can reach this page.
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single();

  const currentUserId = user?.id ?? '';
  const currentUserRole = profile?.role ?? 'moderator';
  const isAdmin = currentUserRole === 'admin';

  return (
    <MediaPageClient
      initialFolders={initialFolders}
      folder={sp.folder}
      view={sp.view}
      q={sp.q}
      type={sp.type}
      date={sp.date}
      by={sp.by}
      sort={sp.sort}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  );
}
