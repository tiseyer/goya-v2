'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { members } from '@/lib/members-data';
import { events } from '@/lib/events-data';
import { supabase } from '@/lib/supabase';

// ─── Profile completion logic ────────────────────────────────────────────────

function getProfileCompletion(profile: any) {
  const fields = [
    { key: 'bio', label: 'Add a bio' },
    { key: 'avatar_url', label: 'Upload profile photo' },
    { key: 'location', label: 'Add your location' },
    { key: 'website', label: 'Add your website' },
    { key: 'instagram', label: 'Add Instagram handle' },
  ];
  const complete = fields.filter(f => profile?.[f.key]);
  const pct = Math.round((complete.length / fields.length) * 100);
  return { pct, fields, complete: complete.map(f => f.key) };
}

// ─── Activity feed ───────────────────────────────────────────────────────────

const FEED = [
  { type: 'course', text: 'Advanced Pranayama Mastery was added to the Academy', time: '2h ago', icon: '\u{1F4DA}' },
  { type: 'achievement', text: 'Sophia Chen earned the E-RYT 500 designation', time: '5h ago', icon: '\u2B50' },
  { type: 'community', text: 'Lauren Hayes shared a reflection on teaching alignment', time: 'Yesterday', icon: '\u{1F4AC}' },
  { type: 'event', text: 'New event: Yin Yoga Immersion in Vancouver on April 12', time: 'Yesterday', icon: '\u{1F4C5}' },
  { type: 'achievement', text: 'Ravi Krishnan completed 400 CE hours this year', time: '2 days ago', icon: '\u{1F3C6}' },
  { type: 'community', text: 'Naledi Dlamini posted about Ubuntu yoga philosophy', time: '3 days ago', icon: '\u{1F4AC}' },
  { type: 'course', text: 'Yoga for Athletes: Complete Guide was updated', time: '4 days ago', icon: '\u{1F4DA}' },
];

// ─── Dashboard page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/sign-in'); return; }
      setUser(user);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const { pct: completionPct, fields: completionFields, complete: completedFields } = getProfileCompletion(profile);
  const showBanner = completionPct < 80;

  // Upcoming events
  const today = new Date();
  const upcomingEvents = [...events]
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Dummy connections: first 5 members
  const connections = members.slice(0, 5);
  // Recently active: 9 random members
  const recentlyActive = members.slice(5, 14);
  // Online now: 6 members with green dot
  const onlineNow = members.slice(14, 20);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero greeting strip */}
      <div className="bg-[#1a2744] pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Welcome back, {firstName} {'\u{1F44B}'}</h1>
          <p className="text-slate-300 text-sm mt-1">Here&apos;s what&apos;s happening in your yoga community.</p>
        </div>
      </div>

      {/* Profile completion banner */}
      {showBanner && (
        <div className="bg-[#2dd4bf]/10 border-b border-[#2dd4bf]/20 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-sm text-slate-200 font-medium shrink-0">Profile {completionPct}% complete</div>
              <div className="flex-1 max-w-xs bg-white/10 rounded-full h-2">
                <div className="bg-[#2dd4bf] h-2 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
            <Link href="/profile/settings" className="text-xs font-semibold text-[#2dd4bf] hover:underline shrink-0">
              Complete profile &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Main 3-column grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">

          {/* LEFT SIDEBAR */}
          <div className="space-y-4">

            {/* Profile completion card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#1a2744] mb-4">Profile Completion</h3>
              <div className="flex items-center gap-4 mb-4">
                <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#2dd4bf" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionPct / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                  <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1a2744">{completionPct}%</text>
                </svg>
                <div className="flex-1 space-y-1.5">
                  {completionFields.map(f => (
                    <div key={f.key} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${completedFields.includes(f.key) ? 'bg-teal-500' : 'bg-slate-200'}`}>
                        {completedFields.includes(f.key) && (
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${completedFields.includes(f.key) ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/profile/settings" className="block w-full text-center py-2 bg-[#1a2744] text-white text-xs font-semibold rounded-lg hover:bg-[#243560] transition-colors">
                Edit Profile
              </Link>
            </div>

            {/* Credit hours tiles */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#1a2744] mb-3">Credit Hours</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'CE', value: profile?.credits?.CE ?? 0, color: 'bg-teal-50 text-teal-700 border-teal-100' },
                  { label: 'Community', value: profile?.credits?.Community ?? 0, color: 'bg-purple-50 text-purple-700 border-purple-100' },
                  { label: 'Karma', value: profile?.credits?.Karma ?? 0, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { label: 'Practice', value: profile?.credits?.Practice ?? 0, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                ].map(c => (
                  <div key={c.label} className={`rounded-xl p-3 border ${c.color}`}>
                    <div className="text-xl font-bold">{c.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{c.label}</div>
                  </div>
                ))}
              </div>
              <Link href="/profile/settings" className="block text-center text-xs text-[#2dd4bf] font-semibold mt-3 hover:underline">
                Submit CE Credits &rarr;
              </Link>
            </div>

            {/* My Connections */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#1a2744] mb-3">My Connections</h3>
              <div className="flex items-center gap-1 mb-3">
                {connections.slice(0, 5).map((m, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={m.id} src={m.photo} alt={m.name}
                    className="w-9 h-9 rounded-full border-2 border-white object-cover"
                    style={{ marginLeft: i > 0 ? '-10px' : 0, zIndex: 5 - i }}
                  />
                ))}
                <span className="ml-2 text-xs text-slate-500 font-medium">+{members.length - 5} more</span>
              </div>
              <Link href="/members" className="block w-full text-center py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                Find a Teacher &rarr;
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#1a2744] mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/profile/settings" className="flex items-center gap-2 p-3 rounded-xl bg-[#2dd4bf]/5 hover:bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 transition-colors">
                  <span className="text-lg">{'\u{1F4CB}'}</span>
                  <span className="text-sm font-medium text-[#1a2744]">Submit CE Credits</span>
                </Link>
                <Link href="/members?role=Teacher" className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
                  <span className="text-lg">{'\u{1F50D}'}</span>
                  <span className="text-sm font-medium text-slate-700">Find a Teacher</span>
                </Link>
              </div>
            </div>
          </div>

          {/* CENTER FEED */}
          <div className="space-y-4">

            {/* Continue Learning card (static fallback) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-base font-bold text-[#1a2744] mb-3">Continue Learning</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 shrink-0 flex items-center justify-center text-2xl">{'\u{1F9D8}'}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">Advanced Pranayama Mastery</p>
                  <div className="mt-1.5 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-[#2dd4bf] h-1.5 rounded-full" style={{ width: '42%' }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">42% complete</p>
                </div>
                <Link href="/academy" className="px-3 py-2 bg-[#2dd4bf] text-[#1a2744] text-xs font-bold rounded-lg hover:bg-[#14b8a6] transition-colors">
                  Continue
                </Link>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-base font-bold text-[#1a2744] mb-4">Community Activity</h3>
              <div className="space-y-4">
                {FEED.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-base shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">{item.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4">

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1a2744]">Upcoming Events</h3>
                <Link href="/events" className="text-xs text-[#2dd4bf] font-semibold hover:underline">See all</Link>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map(ev => {
                  const d = new Date(ev.date);
                  return (
                    <Link href={`/events/${ev.id}`} key={ev.id} className="flex items-start gap-3 group hover:bg-slate-50 rounded-xl p-2 -mx-2 transition-colors">
                      <div className="w-10 shrink-0 text-center">
                        <div className="text-xl font-bold text-[#2dd4bf] leading-tight">{d.getDate()}</div>
                        <div className="text-[9px] font-semibold text-slate-400 uppercase">{d.toLocaleString('en', { month: 'short' })}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 group-hover:text-[#1a2744]">{ev.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{ev.location || 'Online'}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recently Active */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#1a2744] mb-3">Recently Active</h3>
              <div className="grid grid-cols-3 gap-2">
                {recentlyActive.map((m, i) => (
                  <div key={m.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.photo} alt={m.name} className="w-full aspect-square rounded-xl object-cover" />
                    {i < 4 && (
                      <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white" />
                    )}
                  </div>
                ))}
              </div>
              <Link href="/members" className="block text-center text-xs text-[#2dd4bf] font-semibold mt-3 hover:underline">
                View all members &rarr;
              </Link>
            </div>

            {/* Who's Online Now */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <h3 className="text-sm font-bold text-[#1a2744]">Who&apos;s Online Now</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {onlineNow.map(m => (
                  <div key={m.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.photo} alt={m.name} title={m.name} className="w-9 h-9 rounded-full object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">{onlineNow.length} members online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
