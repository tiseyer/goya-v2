export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import type { CreditRequirement, CreditType, CreditStatus, CreditTypeStatus } from '@/lib/credits';
import { getUserCreditStatus } from '@/lib/credits';
import RequirementRow from './RequirementRow';

const CREDIT_TYPE_ORDER: CreditType[] = ['ce', 'karma', 'practice', 'teaching', 'community'];

const STATUS_BADGE: Record<CreditStatus, string> = {
  red: 'bg-rose-100 text-rose-700',
  yellow: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-100 text-emerald-700',
  grey: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<CreditStatus, string> = {
  red: 'Needs Attention',
  yellow: 'Expiring Soon',
  green: 'On Track',
  grey: 'No Requirements',
};

const CREDIT_TYPE_LABEL: Record<CreditType, string> = {
  ce: 'CE',
  karma: 'Karma',
  practice: 'Practice',
  teaching: 'Teaching',
  community: 'Community',
};

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
  return (email?.[0] ?? 'U').toUpperCase();
}

export default async function AdminCreditsPage() {
  const supabase = await createSupabaseServerClient();
  const serviceSupabase = getSupabaseService();

  // Fetch credit requirements
  const { data: requirementsData } = await supabase
    .from('credit_requirements')
    .select('*');

  const requirements = (requirementsData as CreditRequirement[]) ?? [];

  // Build a map for easy lookup; fill in defaults for any missing types
  const reqMap: Record<CreditType, CreditRequirement> = {} as Record<CreditType, CreditRequirement>;
  for (const req of requirements) {
    reqMap[req.credit_type as CreditType] = req;
  }

  // Fetch credit entry statistics
  const [{ count: totalCount }, { count: pendingCount }, { count: approvedCount }] =
    await Promise.all([
      supabase.from('credit_entries').select('*', { count: 'exact', head: true }),
      supabase
        .from('credit_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('credit_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved'),
    ]);

  const total = totalCount ?? 0;
  const pending = pendingCount ?? 0;
  const approved = approvedCount ?? 0;

  // ── Members Needing Attention ─────────────────────────────────────────────
  // Fetch members with credit-applicable member types (service role to bypass RLS)
  const { data: memberProfiles } = await serviceSupabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, member_type')
    .in('member_type', ['teacher', 'student', 'wellness_practitioner'])
    .limit(200);

  type AttentionUser = {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    member_type: string | null;
    overall: CreditStatus;
    issueTypes: CreditTypeStatus[];
  };

  const attentionUsers: AttentionUser[] = [];

  if (memberProfiles && memberProfiles.length > 0) {
    // Process in batches to avoid overwhelming the DB — cap at 50
    const profilesToCheck = memberProfiles.slice(0, 50);

    const statusResults = await Promise.all(
      profilesToCheck.map(async (profile) => {
        const isTeacher = profile.member_type === 'teacher';
        const creditStatus = await getUserCreditStatus(
          profile.id,
          serviceSupabase,
          isTeacher,
        );
        return { profile, creditStatus };
      })
    );

    for (const { profile, creditStatus } of statusResults) {
      if (creditStatus.overall === 'red' || creditStatus.overall === 'yellow') {
        attentionUsers.push({
          id: profile.id,
          email: profile.email ?? '',
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          member_type: profile.member_type,
          overall: creditStatus.overall,
          issueTypes: creditStatus.types.filter(
            (t) => t.status === 'red' || t.status === 'yellow'
          ),
        });
      }
    }

    // Sort: red first, then yellow
    attentionUsers.sort((a, b) => {
      if (a.overall === 'red' && b.overall !== 'red') return -1;
      if (a.overall !== 'red' && b.overall === 'red') return 1;
      return 0;
    });
  }

  return (
    <div className="p-6 lg:p-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1B3A5C]">Credits & Hours</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Configure the credit requirements members must meet to maintain their membership status.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Membership Requirements */}
          <section>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-base font-semibold text-[#1B3A5C]">Membership Requirements</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Set the minimum credits members must earn within a given period to maintain their
                  active status. These requirements apply to Teachers and Wellness Practitioners.
                </p>
              </div>

              <div className="px-6 divide-y divide-slate-100">
                {CREDIT_TYPE_ORDER.map(creditType => {
                  const req = reqMap[creditType];
                  if (!req) return null;
                  return <RequirementRow key={creditType} requirement={req} />;
                })}
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Set &quot;Required Amount&quot; to 0 to disable the requirement for a particular credit type.
                </p>
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-base font-semibold text-[#1B3A5C]">Credit Entry Statistics</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Overview of all credit entries submitted by members.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {/* Total */}
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Total Entries
                  </p>
                  <p className="text-3xl font-bold text-[#1B3A5C]">{total.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">All credit entries submitted</p>
                </div>

                {/* Pending */}
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Pending Review
                  </p>
                  <p className="text-3xl font-bold text-amber-600">{pending.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">Awaiting admin approval</p>
                </div>

                {/* Approved */}
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Approved
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">{approved.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {total > 0
                      ? `${Math.round((approved / total) * 100)}% approval rate`
                      : 'No entries yet'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Members Needing Attention */}
          <section>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-base font-semibold text-[#1B3A5C]">
                  Members Needing Attention{' '}
                  {attentionUsers.length > 0 && (
                    <span className="text-sm font-normal text-slate-500">
                      ({attentionUsers.length})
                    </span>
                  )}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Users who don&apos;t meet credit requirements or have credits expiring soon.
                </p>
              </div>

              {attentionUsers.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 mb-3">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-emerald-700">
                    All members are on track with their credit requirements.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Credit Issues</th>
                        <th className="px-6 py-3">Overall Status</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attentionUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          {/* User */}
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#00B5A3] flex items-center justify-center text-white text-[10px] font-black shrink-0 overflow-hidden">
                                {user.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  getInitials(user.full_name, user.email)
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#1B3A5C] truncate max-w-[180px]">
                                  {user.full_name || '\u2014'}
                                </p>
                                <p className="text-xs text-[#6B7280] truncate max-w-[180px]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Credit Issues */}
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {user.issueTypes.map((t) => (
                                <span
                                  key={t.credit_type}
                                  className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status]}`}
                                >
                                  {CREDIT_TYPE_LABEL[t.credit_type]}: {t.current}/{t.required}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Overall Status */}
                          <td className="px-6 py-3">
                            <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[user.overall]}`}>
                              {STATUS_LABEL[user.overall]}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="px-6 py-3">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#374151] hover:text-[#1B3A5C] hover:border-[#1B3A5C] transition-colors"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
  );
}
