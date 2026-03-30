import { createSupabaseServerClient } from '@/lib/supabaseServer';
import DeploymentsSection from './DeploymentsSection';
// AnalyticsSection removed — GA4 tracking is handled client-side via AnalyticsProvider

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  const [membersRes, guestsRes] = await Promise.allSettled([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'member'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'guest'),
  ]);

  const members   = membersRes.status  === 'fulfilled' ? (membersRes.value.count  ?? '—') : '—';
  const guests    = guestsRes.status   === 'fulfilled' ? (guestsRes.value.count   ?? '—') : '—';

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
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">User Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Total Members" value={members} icon={MemberIcon} accent />
          <StatCard label="Guests"        value={guests}  icon={GuestIcon} />
        </div>
      </div>

      {/* Row 2 — Platform info */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">Platform</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
          <div className="flex items-center divide-x divide-[#E5E7EB]">
            <div className="flex-1 text-center px-4">
              <div className="text-2xl font-bold text-[#1B3A5C]">v2.0.0</div>
              <div className="text-xs text-[#6B7280] mt-0.5">App Version</div>
            </div>
            <div className="flex-1 text-center px-4">
              <div className="text-2xl font-bold text-[#1B3A5C]">{environment}</div>
              <div className="text-xs text-[#6B7280] mt-0.5">Environment</div>
            </div>
            <div className="flex-1 text-center px-4">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-2xl font-bold text-[#1B3A5C]">OK</span>
              </div>
              <div className="text-xs text-[#6B7280] mt-0.5">Status</div>
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
