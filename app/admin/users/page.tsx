import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import AdminUsersTable from './AdminUsersTable';
import AdminUsersFilters from './AdminUsersFilters';
import AdminUsersPagination from './AdminUsersPagination';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '');
}

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const search   = str(params.search);
  const role     = str(params.role);
  const verified = str(params.verified);
  const status   = str(params.status);
  const dateFrom = str(params.from);
  const dateTo   = str(params.to);
  const sort     = str(params.sort) || 'newest';
  const page     = Math.max(1, parseInt(str(params.page) || '1', 10));
  const pageSize = [25, 50, 100].includes(parseInt(str(params.pageSize), 10))
    ? parseInt(str(params.pageSize), 10)
    : 25;

  const supabase = await createSupabaseServerClient();

  // Build query
  let query = supabase
    .from('profiles')
    .select('id, email, full_name, username, role, subscription_status, is_verified, created_at, avatar_url', { count: 'exact' });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }
  if (verified === 'true')  query = query.eq('is_verified', true);
  if (verified === 'false') query = query.eq('is_verified', false);
  if (status)   query = query.eq('subscription_status', status);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z');

  switch (sort) {
    case 'name_asc':  query = query.order('full_name', { ascending: true });  break;
    case 'name_desc': query = query.order('full_name', { ascending: false }); break;
    case 'oldest':    query = query.order('created_at', { ascending: true });  break;
    default:          query = query.order('created_at', { ascending: false }); break;
  }

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;
  query = query.range(from, to);

  const { data: users, count } = await query;

  const totalCount  = count ?? 0;
  const totalPages  = Math.max(1, Math.ceil(totalCount / pageSize));
  const displayedCount = users?.length ?? 0;

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
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
            initialSort={sort}
          />
        </Suspense>
      </div>

      {/* Table */}
      <AdminUsersTable users={users ?? []} />

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
