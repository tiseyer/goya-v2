import Link from 'next/link';
import SwitchToButton from './SwitchToButton';

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  role: string;
  subscription_status: string | null;
  is_verified: boolean;
  created_at: string;
  avatar_url: string | null;
  wp_roles?: string[];
};

const ROLE_BADGE: Record<string, string> = {
  student:               'bg-slate-100 text-slate-600',
  teacher:               'bg-blue-100 text-blue-700',
  wellness_practitioner: 'bg-emerald-100 text-emerald-700',
  moderator:             'bg-orange-100 text-orange-700',
  admin:                 'bg-red-100 text-red-700',
};

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
  return (email[0] ?? 'U').toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminUsersTable({ users, adminRole }: { users: UserRow[]; adminRole?: string }) {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
        <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-sm font-medium text-[#374151]">No users found</p>
        <p className="text-xs text-[#6B7280] mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                {/* User */}
                <td className="px-4 py-3">
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
                      <p className="text-sm font-medium text-[#1B3A5C] truncate max-w-[160px]">
                        {user.full_name || '—'}
                      </p>
                      {user.username && (
                        <p className="text-xs text-[#6B7280] truncate max-w-[160px]">@{user.username}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-3">
                  <span className="text-sm text-[#374151] truncate max-w-[200px] block">{user.email}</span>
                </td>

                {/* Role */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                      {user.role?.replace(/_/g, ' ') ?? '—'}
                    </span>
                    {user.wp_roles && user.wp_roles.length > 0 && user.wp_roles.map((wr: string) => (
                      <span key={wr} className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                        {wr.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {user.subscription_status === 'member' ? (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#00B5A3] text-white">
                      Member
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#E5E7EB] text-[#6B7280]">
                      Guest
                    </span>
                  )}
                </td>

                {/* Verified */}
                <td className="px-4 py-3">
                  {user.is_verified ? (
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                    </svg>
                  )}
                </td>

                {/* Registered */}
                <td className="px-4 py-3">
                  <span className="text-sm text-[#6B7280]">{formatDate(user.created_at)}</span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#374151] hover:text-[#1B3A5C] hover:border-[#1B3A5C] transition-colors"
                    >
                      Edit
                    </Link>
                    {adminRole === 'admin' && user.role !== 'admin' && user.role !== 'moderator' && (
                      <SwitchToButton userId={user.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
