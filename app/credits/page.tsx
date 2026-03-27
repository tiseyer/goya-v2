export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getUserCreditTotals, checkUserMeetsRequirements } from '@/lib/credits';
import CreditHistory from './components/CreditHistory';
import CreditSubmissionFormToggle from './components/CreditSubmissionFormToggle';

export default async function CreditsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const totals = await getUserCreditTotals(user.id, supabase);

  const isTeacher = profile?.member_type === 'teacher';
  const showRequirements = isTeacher || profile?.member_type === 'wellness_practitioner';

  const requirements = showRequirements ? await checkUserMeetsRequirements(user.id, supabase) : null;

  const cards = [
    {
      label: 'CE Credits',
      value: totals.ce,
      bg: 'bg-teal-500/10',
      text: 'text-teal-700',
      border: 'border-teal-200',
      iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      label: 'Community Credits',
      value: totals.community,
      bg: 'bg-violet-500/10',
      text: 'text-violet-700',
      border: 'border-violet-200',
      iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    {
      label: 'Karma Hours',
      value: totals.karma,
      bg: 'bg-orange-500/10',
      text: 'text-orange-700',
      border: 'border-orange-200',
      iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
    {
      label: 'Practice Hours',
      value: totals.practice,
      bg: 'bg-blue-500/10',
      text: 'text-blue-700',
      border: 'border-blue-200',
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    ...(isTeacher ? [{
      label: 'Teaching Hours',
      value: totals.teaching,
      bg: 'bg-purple-500/10',
      text: 'text-purple-700',
      border: 'border-purple-200',
      iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    }] : []),
  ];

  const TYPE_LABELS: Record<string, string> = {
    ce: 'CE Credits',
    karma: 'Karma Hours',
    practice: 'Practice Hours',
    teaching: 'Teaching Hours',
    community: 'Community Credits',
  };

  return (
    <main className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C]">My Credits & Hours</h1>
          <p className="text-slate-500 mt-1 text-sm">Track your continuing education, karma, practice, and community contributions.</p>
        </div>

        {/* Credit Summary Cards */}
        <div className={`grid gap-4 mb-8 ${isTeacher ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {cards.map(card => (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.bg} ${card.border}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white/60`}>
                <svg className={`w-5 h-5 ${card.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={card.iconPath} />
                </svg>
              </div>
              <p className={`text-3xl font-bold ${card.text} leading-none mb-1`}>{card.value}</p>
              <p className={`text-xs font-semibold ${card.text} opacity-80`}>{card.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">earned</p>
            </div>
          ))}
        </div>

        {/* Requirements Status */}
        {showRequirements && requirements && requirements.breakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-base font-semibold text-[#1B3A5C]">Membership Requirements</h2>
              {requirements.meets ? (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  All Met
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  In Progress
                </span>
              )}
            </div>
            <div className="space-y-4">
              {requirements.breakdown.map(req => {
                const pct = Math.min((req.actual / req.required) * 100, 100);
                return (
                  <div key={req.credit_type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[#374151]">
                        {req.actual} of {req.required} {TYPE_LABELS[req.credit_type] ?? req.credit_type} in the last {req.period_months} months
                      </span>
                      {req.meets ? (
                        <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4E87A0] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit New Credits */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-[#1B3A5C] mb-1">Submit New Credits</h2>
              <p className="text-sm text-slate-500">Log a new continuing education activity, karma service, or practice session.</p>
            </div>
            <Link
              href="/credits/learn"
              className="shrink-0 text-sm font-semibold text-[#4E87A0] border border-[#4E87A0] px-4 py-2 rounded-lg hover:bg-[#4E87A0]/5 transition-colors whitespace-nowrap"
            >
              Learn About Credits
            </Link>
          </div>

          <CreditSubmissionFormToggle isTeacher={isTeacher} />
        </div>

        {/* Credits History */}
        <CreditHistory />
      </div>
    </main>
  );
}
