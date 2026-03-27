export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getUserCreditStatus, type CreditTypeStatus, type CreditStatus } from '@/lib/credits';
import { GraduationCap, Heart, Flower2, Users, Award, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import CreditHistory from './components/CreditHistory';
import CreditSubmissionFormToggle from './components/CreditSubmissionFormToggle';

const TYPE_LABELS: Record<string, string> = {
  ce: 'CE Credits',
  karma: 'Karma Hours',
  practice: 'Practice Hours',
  teaching: 'Teaching Hours',
  community: 'Community Credits',
};

const TYPE_ICONS: Record<string, typeof GraduationCap> = {
  ce: GraduationCap,
  karma: Heart,
  practice: Flower2,
  teaching: Users,
  community: Award,
};

const STATUS_CARD_STYLES: Record<CreditStatus, string> = {
  green: 'border-emerald-200 bg-emerald-50',
  yellow: 'border-amber-200 bg-amber-50',
  red: 'border-rose-200 bg-rose-50',
  grey: 'border-slate-200 bg-slate-50',
};

const STATUS_DOT_STYLES: Record<CreditStatus, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
  grey: 'bg-slate-400',
};

const STATUS_TEXT_STYLES: Record<CreditStatus, string> = {
  green: 'text-emerald-700',
  yellow: 'text-amber-700',
  red: 'text-rose-700',
  grey: 'text-slate-600',
};

const BANNER_STYLES: Record<CreditStatus, { bg: string; icon: typeof CheckCircle2 }> = {
  green: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle2 },
  yellow: { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle },
  red: { bg: 'bg-rose-50 border-rose-200 text-rose-800', icon: AlertCircle },
  grey: { bg: 'bg-slate-50 border-slate-200 text-slate-700', icon: Info },
};

export default async function CreditsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isTeacher = profile?.member_type === 'teacher';

  const creditStatus = await getUserCreditStatus(user.id, supabase, isTeacher);

  const banner = BANNER_STYLES[creditStatus.overall];
  const BannerIcon = banner.icon;

  return (
    <main className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C]">My Credits & Hours</h1>
          <p className="text-slate-500 mt-1 text-sm">Track your continuing education, karma, practice, and community contributions.</p>
        </div>

        {/* Overall Status Banner */}
        <div className={`rounded-xl border px-4 py-3 mb-6 flex items-center gap-3 ${banner.bg}`}>
          <BannerIcon className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{creditStatus.overallMessage}</p>
        </div>

        {/* Credit Status Cards */}
        <div className={`grid gap-4 mb-8 ${isTeacher ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {creditStatus.types.map((ct: CreditTypeStatus) => {
            const Icon = TYPE_ICONS[ct.credit_type] ?? GraduationCap;
            const cardStyle = STATUS_CARD_STYLES[ct.status];
            const dotStyle = STATUS_DOT_STYLES[ct.status];
            const textStyle = STATUS_TEXT_STYLES[ct.status];

            return (
              <div key={ct.credit_type} className={`rounded-2xl border shadow-soft p-5 ${cardStyle}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white/60">
                  <Icon className={`w-5 h-5 ${textStyle}`} />
                </div>
                <p className={`text-3xl font-bold ${textStyle} leading-none mb-1`}>{ct.current}</p>
                <p className={`text-xs font-semibold ${textStyle} opacity-80`}>{TYPE_LABELS[ct.credit_type] ?? ct.credit_type}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotStyle}`} />
                  <p className="text-[11px] text-slate-600 leading-tight">{ct.message}</p>
                </div>
              </div>
            );
          })}
        </div>

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
