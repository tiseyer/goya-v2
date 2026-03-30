import { createSupabaseServerClient } from '@/lib/supabaseServer';
import VerificationActions from './VerificationActions';

export const dynamic = 'force-dynamic';

export default async function VerificationPage() {
  const supabase = await createSupabaseServerClient();

  const { data: pending } = await supabase
    .from('profiles')
    .select('id, full_name, email, member_type, avatar_url, created_at, certificate_url')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true });

  const users = pending ?? [];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Verification Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review teacher and wellness practitioner applications
        </p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700 mb-1">All caught up!</p>
          <p className="text-sm text-slate-400">No pending verifications.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {users.length} pending
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {users.map(user => (
              <div key={user.id} className="px-6 py-5 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#4E87A0]/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-[#4E87A0]">
                      {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1B3A5C] text-sm truncate">
                    {user.full_name ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 bg-blue-50 text-blue-700`}>
                    {user.member_type === 'teacher' ? 'Yoga Teacher' : 'Wellness Practitioner'}
                  </span>
                </div>

                {/* Date */}
                <div className="text-xs text-slate-400 shrink-0 hidden sm:block">
                  {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                {/* Actions */}
                <VerificationActions userId={user.id} certificateUrl={user.certificate_url} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
