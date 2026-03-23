import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export default async function SettingsSubscriptionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role, member_type, mrn, created_at, full_name')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/sign-in');

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[#1B3A5C] mb-6">Subscriptions</h1>

      {/* Card 1: Current Plan */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-[#1B3A5C] mb-3">Current Plan</h2>
        {profile.subscription_status === 'member' ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            Active Member
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            Guest
          </span>
        )}
        <p className="text-sm text-[#6B7280] mt-3">
          Role:{' '}
          <span className="font-medium text-[#1B3A5C] capitalize">
            {profile.role.replace('_', ' ')}
          </span>
        </p>
        <p className="text-sm text-[#6B7280] mt-1">
          Member Number:{' '}
          <span className="font-mono font-medium text-[#1B3A5C]">
            {profile.mrn ?? '—'}
          </span>
        </p>
        <p className="text-sm text-[#6B7280] mt-1">
          Member since:{' '}
          <span className="font-medium text-[#1B3A5C]">{memberSince}</span>
        </p>
      </div>

      {/* Card 2: Manage Subscription */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1B3A5C] mb-3">Manage Subscription</h2>
        <p className="text-sm text-[#6B7280]">
          To change your subscription plan or manage billing, please contact support.
        </p>
        <p className="text-xs text-[#9CA3AF] mt-3">
          Subscription management features are coming in a future update.
        </p>
      </div>
    </div>
  );
}
