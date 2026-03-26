export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { CreditRequirement, CreditType } from '@/lib/credits';
import RequirementRow from './RequirementRow';

const CREDIT_TYPE_ORDER: CreditType[] = ['ce', 'karma', 'practice', 'teaching', 'community'];

export default async function AdminCreditsPage() {
  const supabase = await createSupabaseServerClient();

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

  return (
    <div className="min-h-full">
        {/* Page header */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-white">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Credits & Hours</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Configure the credit requirements members must meet to maintain their membership status.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
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
                  Set "Required Amount" to 0 to disable the requirement for a particular credit type.
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
        </div>
      </div>
  );
}
