import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import { getUserCreditStatus } from '@/lib/credits';
import type { CreditStatus } from '@/lib/credits';
import AdminUsersTable from './AdminUsersTable';
import AdminUsersFilters from './AdminUsersFilters';
import AdminUsersPagination from './AdminUsersPagination';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '');
}

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const search       = str(params.search);
  const role         = str(params.role);
  const verified     = str(params.verified);
  const status       = str(params.status);
  const creditStatus = str(params.creditStatus) as CreditStatus | '';
  const wpRole       = str(params.wpRole);
  const dateFrom     = str(params.from);
  const dateTo       = str(params.to);
  const sort         = str(params.sort) || 'newest';
  const page         = Math.max(1, parseInt(str(params.page) || '1', 10));
  const pageSize     = [25, 50, 100].includes(parseInt(str(params.pageSize), 10))
    ? parseInt(str(params.pageSize), 10)
    : 25;

  const supabase = await createSupabaseServerClient();

  // Fetch current admin's role
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: adminProfile } = authUser
    ? await supabase.from('profiles').select('role').eq('id', authUser.id).single()
    : { data: null };
  const adminRole = adminProfile?.role ?? undefined;

  // Build query — when credit status filter is active, fetch a larger pool then filter in-app
  const isCreditFiltered = creditStatus === 'green' || creditStatus === 'yellow' || creditStatus === 'red';

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, username, role, subscription_status, is_verified, created_at, avatar_url, member_type, wp_roles', { count: 'exact' });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%,mrn.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }
  if (verified === 'true')  query = query.eq('is_verified', true);
  if (verified === 'false') query = query.eq('is_verified', false);
  if (status)   query = query.eq('subscription_status', status);
  if (wpRole)   query = query.contains('wp_roles', [wpRole]);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z');

  switch (sort) {
    case 'name_asc':  query = query.order('full_name', { ascending: true });  break;
    case 'name_desc': query = query.order('full_name', { ascending: false }); break;
    case 'oldest':    query = query.order('created_at', { ascending: true });  break;
    default:          query = query.order('created_at', { ascending: false }); break;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let users: any[] = [];
  let totalCount = 0;
  let totalPages = 1;
  let displayedCount = 0;

  if (isCreditFiltered) {
    // Fetch a larger pool (up to 200), compute credit status, then paginate manually
    const poolQuery = query.range(0, 199);
    const { data: poolData } = await poolQuery;

    const serviceSupabase = getSupabaseService();
    const pool = poolData ?? [];

    // Compute credit status for each user in parallel
    const withStatus = await Promise.all(
      pool.map(async (user) => {
        const isTeacher = (user as { member_type?: string }).member_type === 'teacher';
        const cs = await getUserCreditStatus(user.id, serviceSupabase, isTeacher);
        return { user, overall: cs.overall };
      })
    );

    // Filter to matching status
    const filtered = withStatus
      .filter((item) => item.overall === creditStatus)
      .map((item) => item.user);

    totalCount = filtered.length;
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const from = (page - 1) * pageSize;
    users = filtered.slice(from, from + pageSize);
    displayedCount = users.length;
  } else {
    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;
    query = query.range(from, to);

    const { data: queryData, count } = await query;
    users = queryData ?? [];
    totalCount = count ?? 0;
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    displayedCount = users.length;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Users</h1>
        <p className="text-sm text-[#6B7280]">
          <span className="font-medium text-[#374151]">{displayedCount}</span>
          {' / '}
          <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span>
          {' users'}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <Suspense>
          <AdminUsersFilters
            initialSearch={search}
            initialRole={role}
            initialVerified={verified}
            initialStatus={status}
            initialCreditStatus={creditStatus}
            initialWpRole={wpRole}
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
            initialSort={sort}
          />
        </Suspense>
      </div>

      {/* Table */}
      <AdminUsersTable users={users ?? []} adminRole={adminRole} />

      {/* Pagination */}
      <Suspense>
        <AdminUsersPagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          displayedCount={displayedCount}
        />
      </Suspense>
    </div>
  );
}
