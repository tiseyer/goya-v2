export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getUserCreditTotals, checkUserMeetsRequirements } from '@/lib/credits';
import CreditHistory from '@/app/credits/components/CreditHistory';
import CreditSubmissionFormToggle from '@/app/credits/components/CreditSubmissionFormToggle';

export default async function TeachingHoursPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.member_type !== 'teacher') {
    redirect('/credits');
  }

  const totals = await getUserCreditTotals(user.id, supabase);
  const requirements = await checkUserMeetsRequirements(user.id, supabase);

  // Only show the teaching requirement row if one exists
  const teachingReq = requirements.breakdown.find(b => b.credit_type === 'teaching');

  return (
    <main className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/credits"
            className="inline-flex items-center gap-1.5 text-sm text-[#4E87A0] hover:text-[#3A7190] font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Credits
          </Link>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C]">My Teaching Hours</h1>
          <p className="text-slate-500 mt-1 text-sm">Log the hours you spend teaching yoga classes, workshops, and private sessions.</p>
        </div>

        {/* Teaching Hours Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-purple-200 bg-purple-500/10 p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white/60">
              <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-purple-700 leading-none mb-1">{totals.teaching}</p>
            <p className="text-xs font-semibold text-purple-700 opacity-80">Teaching Hours</p>
            <p className="text-[11px] text-slate-500 mt-0.5">earned</p>
          </div>
        </div>

        {/* Teaching Requirement Progress */}
        {teachingReq && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-[#1B3A5C]">Teaching Requirement</h2>
              {teachingReq.meets ? (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Met
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-[#374151]">
                  {teachingReq.actual} of {teachingReq.required} Teaching Hours in the last {teachingReq.period_months} months
                </span>
                {teachingReq.meets ? (
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
                  style={{ width: `${Math.min((teachingReq.actual / teachingReq.required) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Log Teaching Hours */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-base font-semibold text-[#1B3A5C] mb-1">Log Teaching Hours</h2>
          <p className="text-sm text-slate-500 mb-5">Record classes, workshops, or private sessions you have taught.</p>

          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-5">
            Please allow up to 5 business days for these hours to appear on your profile.
          </p>

          <CreditSubmissionFormToggle teachingOnly={true} />
        </div>

        {/* Teaching Hours History */}
        <CreditHistory filterType="teaching" />
      </div>
    </main>
  );
}
