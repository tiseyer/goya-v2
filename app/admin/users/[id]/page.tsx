import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import ResetOnboardingButton from './ResetOnboardingButton';

type Params = Promise<{ id: string }>;

export default async function AdminUserDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Get the current admin user's role
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser!.id)
    .single();

  const currentUserIsAdmin = adminProfile?.role === 'admin';

  // Fetch the target user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, username, role, member_type, subscription_status, is_verified, verification_status, onboarding_completed, created_at, avatar_url')
    .eq('id', id)
    .single();

  if (!profile) {
    notFound();
  }

  const displayName = profile.full_name || profile.username || profile.email || 'Unknown User';

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
      <div className="flex items-center gap-4 mb-8">
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

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-bold text-[#1B3A5C] mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Username</p>
            <p className="text-sm text-[#1B3A5C]">{profile.username || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Role</p>
            <p className="text-sm text-[#1B3A5C] capitalize">{profile.role || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Member Type</p>
            <p className="text-sm text-[#1B3A5C] capitalize">{profile.member_type?.replace('_', ' ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Subscription Status</p>
            <p className="text-sm text-[#1B3A5C] capitalize">{profile.subscription_status || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Verification Status</p>
            <p className="text-sm text-[#1B3A5C] capitalize">{profile.verification_status || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Member Since</p>
            <p className="text-sm text-[#1B3A5C]">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Onboarding section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-[#1B3A5C] mb-1">Onboarding</h2>
        <p className="text-sm text-[#6B7280] mb-4">
          Status:{' '}
          <span className={`font-semibold ${profile.onboarding_completed ? 'text-green-600' : 'text-orange-500'}`}>
            {profile.onboarding_completed ? 'Completed' : 'Not completed'}
          </span>
        </p>
        <ResetOnboardingButton
          userId={profile.id}
          userName={displayName}
          isAdmin={currentUserIsAdmin}
        />
        {!currentUserIsAdmin && (
          <p className="text-xs text-[#6B7280] mt-2">Only admins can reset onboarding.</p>
        )}
      </div>
    </div>
  );
}
