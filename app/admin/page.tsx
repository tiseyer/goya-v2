'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  mrn: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  avatar_url: string | null;
};

const ROLE_BADGE: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-teal-100 text-teal-700',
  wellness_practitioner: 'bg-emerald-100 text-emerald-700',
  school: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
  moderator: 'bg-orange-100 text-orange-700',
};

function getInitials(name: string, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (email?.[0] ?? 'U').toUpperCase();
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inbox' | 'members'>('inbox');
  const [unverified, setUnverified] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/sign-in'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile || !['admin', 'moderator'].includes(profile.role)) {
        router.push('/');
        return;
      }

      // Load data
      const [{ data: unv }, { data: all }] = await Promise.all([
        supabase.from('profiles').select('*').eq('is_verified', false).order('created_at'),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ]);

      setUnverified(unv ?? []);
      setAllProfiles(all ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function verifyUser(userId: string) {
    const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
    if (error) { showToast('Error: ' + error.message); return; }
    setUnverified(prev => prev.filter(p => p.id !== userId));
    setAllProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_verified: true } : p));
    showToast('User verified successfully');
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = allProfiles.filter(p =>
    !search ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn?.includes(search)
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">{allProfiles.length} total members &middot; {unverified.length} pending verification</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-6">
          {(['inbox', 'members'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-[#1a2744] shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'inbox' ? `Inbox ${unverified.length > 0 ? `(${unverified.length})` : ''}` : 'Members'}
            </button>
          ))}
        </div>

        {/* INBOX TAB */}
        {activeTab === 'inbox' && (
          <div className="space-y-3">
            {unverified.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-12 text-center">
                <p className="text-white font-semibold">No pending verifications</p>
                <p className="text-slate-400 text-sm mt-1">All members are verified</p>
              </div>
            ) : unverified.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a2744] text-white flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : getInitials(p.full_name, p.email)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{p.full_name || p.email}</div>
                    <div className="text-xs text-slate-400">
                      {p.email} &middot; MRN: {p.mrn} &middot;{' '}
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${ROLE_BADGE[p.role] ?? 'bg-slate-100 text-slate-600'}`}>
                        {p.role?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => verifyUser(p.id)} className="bg-[#2dd4bf] text-[#1a2744] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-[#14b8a6] transition-colors shrink-0">
                  Verify
                </button>
              </div>
            ))}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search by name, email, or MRN..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3 hidden sm:table-cell">MRN</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3 hidden md:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#1a2744] text-white flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
                            {p.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : getInitials(p.full_name, p.email)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 text-sm">{p.full_name || '\u2014'}</div>
                            <div className="text-xs text-slate-400">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">{p.mrn}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[p.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {p.role?.replace('_', ' ') ?? '\u2014'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.is_verified ? (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400">
                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">No members found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1a2744] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
