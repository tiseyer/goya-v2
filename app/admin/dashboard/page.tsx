import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import MemberGrowthChart from './MemberGrowthChart';
import HealthAlertBanner from './HealthAlertBanner';
// AnalyticsSection removed — GA4 tracking is handled client-side via AnalyticsProvider

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent = false,
  muted = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow ${muted ? 'bg-slate-50 border-slate-200' : 'bg-white border-[#E5E7EB]'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        accent ? 'bg-[#00B5A3]/10 text-[#00B5A3]' : muted ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-[#6B7280]'
      }`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold leading-none ${muted ? 'text-slate-400' : 'text-[#1B3A5C]'}`}>{value}</p>
        <p className={`text-sm mt-1 ${muted ? 'text-slate-400' : 'text-[#6B7280]'}`}>{label}</p>
      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

const UsersIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AcademicCapIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);

const BookIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const HeartIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const BuildingIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const GuestIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BeakerIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01.45 2.295l-1.576 3.154a2.25 2.25 0 01-2.016 1.245H7.35a2.25 2.25 0 01-2.016-1.245L3.758 17.295A2.25 2.25 0 014.208 15H19.8z" />
  </svg>
);

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const svc = getSupabaseService();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  const [
    totalMembersRes,
    teachersRes,
    studentsRes,
    wellnessRes,
    schoolsRes,
    guestsRes,
    fakeUsersRes,
  ] = await Promise.allSettled([
    // Total real members (all profiles excluding faux/robot — includes NULL-role migrated users)
    svc
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('wp_roles', 'cs', '{"faux"}')
      .not('wp_roles', 'cs', '{"robot"}'),

    // Teachers
    svc
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher')
      .not('wp_roles', 'cs', '{"faux"}')
      .not('wp_roles', 'cs', '{"robot"}'),

    // Students
    svc
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .not('wp_roles', 'cs', '{"faux"}')
      .not('wp_roles', 'cs', '{"robot"}'),

    // Wellness practitioners
    svc
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'wellness_practitioner')
      .not('wp_roles', 'cs', '{"faux"}')
      .not('wp_roles', 'cs', '{"robot"}'),

    // Schools (approved/active)
    svc
      .from('schools')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'approved']),

    // Guests
    svc
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'guest')
      .not('wp_roles', 'cs', '{"faux"}')
      .not('wp_roles', 'cs', '{"robot"}'),

    // Fake/Test users
    svc
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('wp_roles.cs.{"faux"},wp_roles.cs.{"robot"}'),
  ]);

  const totalMembers = totalMembersRes.status === 'fulfilled' ? (totalMembersRes.value.count ?? '—') : '—';
  const teachers     = teachersRes.status     === 'fulfilled' ? (teachersRes.value.count     ?? '—') : '—';
  const students     = studentsRes.status     === 'fulfilled' ? (studentsRes.value.count     ?? '—') : '—';
  const wellness     = wellnessRes.status     === 'fulfilled' ? (wellnessRes.value.count     ?? '—') : '—';
  const schools      = schoolsRes.status      === 'fulfilled' ? (schoolsRes.value.count      ?? '—') : '—';
  const guests       = guestsRes.status       === 'fulfilled' ? (guestsRes.value.count       ?? '—') : '—';
  const fakeUsers    = fakeUsersRes.status    === 'fulfilled' ? (fakeUsersRes.value.count    ?? '—') : '—';

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Welcome back, {firstName}</h1>
        <p className="text-sm text-[#6B7280] mt-1">{today}</p>
      </div>

      {/* Health alert banner — hidden if all green */}
      <HealthAlertBanner />

      {/* Row 1 — User stats */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">User Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Members"          value={totalMembers} icon={UsersIcon}       accent />
          <StatCard label="Teachers"               value={teachers}     icon={AcademicCapIcon} />
          <StatCard label="Students"               value={students}     icon={BookIcon}        />
          <StatCard label="Wellness Practitioners" value={wellness}     icon={HeartIcon}       />
          <StatCard label="Schools"                value={schools}      icon={BuildingIcon}    />
          <StatCard label="Guests"                 value={guests}       icon={GuestIcon}       />
          <StatCard label="Fake/Test Users"        value={fakeUsers}    icon={BeakerIcon}      muted />
        </div>
      </div>

      {/* Row 2 — Member growth chart */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">Member Growth</h2>
        <MemberGrowthChart />
      </div>


    </div>
  );
}
