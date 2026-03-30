import { createSupabaseServerClient } from '@/lib/supabaseServer';
import AnalyticsSection from './AnalyticsSection';
import DeploymentsSection from './DeploymentsSection';

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent ? 'bg-[#00B5A3]/10 text-[#00B5A3]' : 'bg-slate-100 text-[#6B7280]'}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1B3A5C] leading-none">{value}</p>
        <p className="text-sm text-[#6B7280] mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

const UsersIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const MemberIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
const GuestIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const VerifiedIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const VersionIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);
const EnvIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);
const DeployIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const StatusIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  const [totalRes, membersRes, guestsRes, verifiedRes] = await Promise.allSettled([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'member'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'guest'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
  ]);

  const total     = totalRes.status    === 'fulfilled' ? (totalRes.value.count    ?? '—') : '—';
  const members   = membersRes.status  === 'fulfilled' ? (membersRes.value.count  ?? '—') : '—';
  const guests    = guestsRes.status   === 'fulfilled' ? (guestsRes.value.count   ?? '—') : '—';
  const verified  = verifiedRes.status === 'fulfilled' ? (verifiedRes.value.count ?? '—') : '—';

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const environment = process.env.NODE_ENV === 'production' ? 'Production' : 'Development';

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Welcome back, {firstName}</h1>
        <p className="text-sm text-[#6B7280] mt-1">{today}</p>
      </div>

      {/* Row 1 — User stats */}
      <div className="mb-3">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">User Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Users"    value={total}    icon={UsersIcon}    accent />
          <StatCard label="Members"        value={members}  icon={MemberIcon}   accent />
          <StatCard label="Guests"         value={guests}   icon={GuestIcon} />
          <StatCard label="Verified Users" value={verified} icon={VerifiedIcon} />
        </div>
      </div>

      {/* Row 2 — Web Analytics */}
      <div className="mt-8">
        <AnalyticsSection />
      </div>

      {/* Row 3 — Platform info */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">Platform</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="App Version"     value="v2.0.0-alpha" icon={VersionIcon} />
          <StatCard label="Environment"     value={environment}  icon={EnvIcon} />
          <StatCard label="Last Deployment" value="—"            icon={DeployIcon} />
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-500">
              {StatusIcon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-2xl font-bold text-[#1B3A5C] leading-none">OK</p>
              </div>
              <p className="text-sm text-[#6B7280] mt-1">Platform Status</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5 — Deployments */}
      <div className="mt-8">
        <DeploymentsSection />
      </div>
    </div>
  );
}
