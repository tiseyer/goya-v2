import { createSupabaseServerClient } from '@/lib/supabaseServer';
import SchoolRegistrationsTab from './SchoolRegistrationsTab';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch all schools with owner profile info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schoolsData } = await (supabase as any)
    .from('schools')
    .select(`
      id, name, logo_url, city, country, status, rejection_reason, created_at,
      owner:owner_id (id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  const schools = schoolsData ?? [];
  const pendingSchoolCount = schools.filter(
    (s: { status: string }) => s.status === 'pending'
  ).length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Inbox</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review school registrations and other pending requests
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        {/* Tab bar */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-0">
            <button className="relative px-5 py-3 text-sm font-semibold text-[#00B5A3] border-b-2 border-[#00B5A3] -mb-px transition-colors">
              School Registrations
              {pendingSchoolCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {pendingSchoolCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* School Registrations Tab Content */}
      <SchoolRegistrationsTab initialSchools={schools} />
    </div>
  );
}
