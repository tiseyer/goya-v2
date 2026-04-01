import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import Badge from '@/app/components/ui/Badge';
import RemoveConnectionButton from './RemoveConnectionButton';
import UserFlowsSection from './UserFlowsSection';
import UserDetailClient from './UserDetailClient';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string }>;

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const supabase = await createSupabaseServerClient();

  // Get the current admin user's role
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser!.id)
    .single();

  const currentUserIsAdmin = adminProfile?.role === 'admin';

  // Fetch the target user's profile (service role bypasses RLS for reliable admin access)
  const serviceClient = getSupabaseService();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id, email, full_name, first_name, last_name, username, role, member_type, subscription_status, is_verified, verification_status, onboarding_completed, created_at, avatar_url, mrn, last_login_at, wp_user_id, wp_roles')
    .eq('id', id)
    .single();

  if (!profile) {
    notFound();
  }

  const displayName = profile.full_name || profile.username || profile.email || 'Unknown User';

  // Fetch connections when on the connections tab (service role bypasses RLS)
  let connections: any[] = [];
  if (tab === 'connections') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (getSupabaseService() as any)
      .from('connections')
      .select(`
        id, type, status, created_at,
        requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url),
        recipient:profiles!connections_recipient_id_fkey(id, full_name, avatar_url)
      `)
      .or(`requester_id.eq.${id},recipient_id.eq.${id}`)
      .order('created_at', { ascending: false });
    connections = data || [];
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-[#6B7280] hover:text-[#1B3A5C] flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">{displayName}</h1>
          <p className="text-sm text-[#6B7280]">{profile.email}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#E5E7EB] mb-6">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'connections', label: 'Connections' },
          { key: 'flows', label: 'Flows' },
        ].map(t => (
          <Link
            key={t.key}
            href={`/admin/users/${id}?tab=${t.key}`}
            className={[
              'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              tab === t.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-slate-500 hover:text-primary-dark',
            ].join(' ')}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'overview' && (
        <UserDetailClient
          profile={{
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name ?? null,
            first_name: profile.first_name ?? null,
            last_name: profile.last_name ?? null,
            username: profile.username ?? null,
            role: profile.role,
            member_type: profile.member_type ?? null,
            mrn: profile.mrn ?? null,
            subscription_status: profile.subscription_status ?? null,
            verification_status: profile.verification_status ?? null,
            onboarding_completed: profile.onboarding_completed ?? null,
            created_at: profile.created_at,
            last_login_at: profile.last_login_at ?? null,
            wp_user_id: profile.wp_user_id ?? null,
            wp_roles: profile.wp_roles ?? null,
          }}
          isAdmin={currentUserIsAdmin}
        />
      )}

      {tab === 'flows' && (
        <UserFlowsSection userId={id} />
      )}

      {tab === 'connections' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          {connections.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-slate-500">No connections</p>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            connections.map((conn: any) => {
              const otherParty = conn.requester?.id === id ? conn.recipient : conn.requester;
              return (
                <div
                  key={conn.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {otherParty?.avatar_url ? (
                      <img
                        src={otherParty.avatar_url}
                        alt={otherParty.full_name || 'User'}
                        className="w-10 h-10 rounded-full object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400">
                        {(otherParty?.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#1B3A5C]">
                        {otherParty?.full_name || 'Unknown User'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={conn.status === 'accepted' ? 'subtle' : 'muted'} size="sm">
                          {conn.status}
                        </Badge>
                        <span className="text-xs text-slate-400">{conn.type}</span>
                      </div>
                    </div>
                  </div>
                  <RemoveConnectionButton connectionId={conn.id} userId={id} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
