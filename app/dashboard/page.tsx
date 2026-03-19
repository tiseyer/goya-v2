'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ─── Profile completion ───────────────────────────────────────────────────────

const COMPLETION_FIELDS = [
  { key: 'full_name',  label: 'Full name'         },
  { key: 'username',   label: 'Username'           },
  { key: 'bio',        label: 'Bio'                },
  { key: 'location',   label: 'Location'           },
  { key: 'website',    label: 'Website'            },
  { key: 'instagram',  label: 'Instagram'          },
  { key: 'youtube',    label: 'YouTube'            },
  { key: 'avatar_url', label: 'Profile photo'      },
];

function getCompletion(profile: any) {
  const done = COMPLETION_FIELDS.filter(f => profile?.[f.key]);
  const pct = Math.round((done.length / COMPLETION_FIELDS.length) * 100);
  return { pct, done: done.map(f => f.key) };
}

// ─── Static placeholder data ──────────────────────────────────────────────────

const PLACEHOLDER_POSTS = [
  {
    id: 1,
    name: 'Sophia Chen',
    role: 'Teacher',
    initials: 'SC',
    color: '#4E87A0',
    time: '2h ago',
    text: 'Just finished a beautiful sunrise flow with my students in Vancouver. There\'s something magical about practicing as the city wakes up. Grateful for this community! 🌅',
    likes: 24,
    comments: 6,
  },
  {
    id: 2,
    name: 'Ravi Krishnan',
    role: 'Wellness Practitioner',
    initials: 'RK',
    color: '#00B5A3',
    time: '5h ago',
    text: 'Sharing my notes from last week\'s pranayama workshop. The section on nadi shodhana was particularly transformative. DM me if you\'d like the PDF — happy to share with fellow practitioners.',
    likes: 41,
    comments: 12,
  },
  {
    id: 3,
    name: 'Lauren Hayes',
    role: 'Teacher',
    initials: 'LH',
    color: '#7C5CBF',
    time: 'Yesterday',
    text: 'Reminder: my online Yin & Restore workshop starts this Saturday at 9am PST. Open to all levels. Registration link in profile.',
    likes: 18,
    comments: 4,
  },
];

const PLACEHOLDER_EVENTS = [
  { id: 1, day: '22', month: 'Mar', title: 'Spring Equinox Flow — Online', location: 'Zoom' },
  { id: 2, day: '05', month: 'Apr', title: 'Yin Yoga Immersion — Vancouver', location: 'Vancouver, BC' },
  { id: 3, day: '12', month: 'Apr', title: 'Pranayama Masterclass', location: 'Online' },
];

const FOLLOWING_PLACEHOLDERS = [
  { initials: 'SC', color: '#4E87A0', name: 'Sophia Chen' },
  { initials: 'RK', color: '#00B5A3', name: 'Ravi Krishnan' },
  { initials: 'LH', color: '#7C5CBF', name: 'Lauren Hayes' },
  { initials: 'ND', color: '#D97706', name: 'Naledi Dlamini' },
  { initials: 'MJ', color: '#059669', name: 'Marco Jiménez' },
];

const RECENT_PLACEHOLDERS = [
  { initials: 'AT', color: '#4E87A0' },
  { initials: 'BW', color: '#00B5A3' },
  { initials: 'CK', color: '#7C5CBF' },
  { initials: 'DM', color: '#D97706' },
  { initials: 'EL', color: '#DC2626' },
  { initials: 'FP', color: '#059669' },
  { initials: 'GR', color: '#0891B2' },
  { initials: 'HS', color: '#9333EA' },
];

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedSort, setFeedSort] = useState<'recent' | 'popular'>('recent');

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const userInitials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '?');
  const { pct, done } = getCompletion(profile);

  // Circular SVG progress
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Greeting bar */}
      <div className="bg-white border-b border-[#E5E7EB] pt-20 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Welcome back, {firstName}</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Here&apos;s what&apos;s happening in your yoga community.</p>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-5">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Complete Your Profile */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#1B3A5C] mb-4">Complete Your Profile</h3>
              <div className="flex items-center gap-4 mb-4">
                {/* Circular progress */}
                <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0">
                  <circle cx="34" cy="34" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
                  <circle
                    cx="34" cy="34" r={r}
                    fill="none"
                    stroke={pct === 100 ? '#059669' : '#4E87A0'}
                    strokeWidth="6"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 34 34)"
                  />
                  <text x="34" y="39" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1B3A5C">{pct}%</text>
                </svg>
                <div className="flex-1 space-y-1.5">
                  {COMPLETION_FIELDS.map(f => {
                    const complete = done.includes(f.key);
                    return (
                      <div key={f.key} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${complete ? 'bg-[#4E87A0]' : 'bg-[#E5E7EB]'}`}>
                          {complete && (
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs ${complete ? 'text-[#9CA3AF] line-through' : 'text-[#374151]'}`}>{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Link
                href="/profile/settings"
                className="block w-full text-center py-2 bg-[#1B3A5C] text-white text-xs font-semibold rounded-lg hover:bg-[#243560] transition-colors"
              >
                Edit Profile
              </Link>
            </div>

            {/* Membership Activity */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#1B3A5C] mb-3">Membership Activity</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'CE Hours',        value: 0, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
                  { label: 'Community',       value: 0, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
                  { label: 'Karma',           value: 0, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
                  { label: 'Practice',        value: 0, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
                ].map(c => (
                  <div key={c.label} className={`rounded-xl p-3 border ${c.bg} ${c.border}`}>
                    <div className={`flex items-center gap-1.5 mb-1`}>
                      <svg className={`w-3.5 h-3.5 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                      </svg>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${c.text}`}>{c.label}</span>
                    </div>
                    <div className={`text-xl font-bold ${c.text}`}>{/* TODO: fetch from DB */}{c.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Link href="/credits" className="flex-1 text-center py-1.5 bg-[#4E87A0] text-white text-xs font-semibold rounded-lg hover:bg-[#3A7190] transition-colors">
                  Submit
                </Link>
                <Link href="/credits" className="flex-1 text-center py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                  View
                </Link>
                <Link href="/credits" className="flex-1 text-center py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                  Learn More
                </Link>
              </div>
            </div>

          </div>

          {/* ── MAIN FEED ────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Post composer */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#4E87A0] flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-black">{userInitials}</span>
                </div>
                <div className="flex-1">
                  <div className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#9CA3AF] bg-slate-50 cursor-text hover:border-[#4E87A0]/40 transition-colors">
                    Share something with the GOYA community…
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[
                      { label: 'Photo', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                      { label: 'Video', d: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                      { label: 'Link', d: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
                    ].map(btn => (
                      <button key={btn.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#6B7280] hover:text-[#4E87A0] hover:bg-slate-100 text-xs font-medium transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={btn.d} />
                        </svg>
                        {btn.label}
                      </button>
                    ))}
                    <button className="ml-auto px-4 py-1.5 bg-[#4E87A0] text-white text-xs font-semibold rounded-lg hover:bg-[#3A7190] transition-colors">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
              {/* Sort header */}
              <div className="flex items-center gap-1 px-5 py-3 border-b border-[#E5E7EB]">
                <span className="text-xs text-[#6B7280] font-medium mr-2">Sort:</span>
                {(['recent', 'popular'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFeedSort(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${
                      feedSort === s ? 'bg-[#4E87A0] text-white' : 'text-[#6B7280] hover:bg-slate-100'
                    }`}
                  >
                    {s === 'recent' ? 'Most Recent' : 'Most Popular'}
                  </button>
                ))}
              </div>

              {/* Posts — TODO: replace with real data from DB */}
              <div className="divide-y divide-[#E5E7EB]">
                {PLACEHOLDER_POSTS.map(post => (
                  <div key={post.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-black" style={{ backgroundColor: post.color }}>
                        {post.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#1B3A5C]">{post.name}</span>
                          <span className="text-xs text-[#9CA3AF]">{post.role}</span>
                          <span className="text-xs text-[#9CA3AF] ml-auto">{post.time}</span>
                        </div>
                        <p className="text-sm text-[#374151] leading-relaxed mt-1.5">{post.text}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#4E87A0] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {post.likes}
                          </button>
                          <button className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#4E87A0] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.comments}
                          </button>
                          <button className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#4E87A0] transition-colors ml-auto">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1B3A5C]">Upcoming Events</h3>
                <Link href="/events" className="text-xs text-[#4E87A0] font-semibold hover:underline">See all</Link>
              </div>
              {/* TODO: replace with real events from DB */}
              <div className="space-y-3">
                {PLACEHOLDER_EVENTS.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="w-10 shrink-0 text-center">
                      <div className="text-xl font-bold text-[#4E87A0] leading-tight">{ev.day}</div>
                      <div className="text-[9px] font-semibold text-[#9CA3AF] uppercase">{ev.month}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1B3A5C] leading-snug line-clamp-2">{ev.title}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">{ev.location}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/events" className="block w-full text-center py-2 mt-4 border border-[#E5E7EB] text-[#374151] text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-wide">
                View Calendar
              </Link>
            </div>

            {/* I'm Following */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1B3A5C]">I&apos;m Following</h3>
                <Link href="/members" className="text-xs text-[#4E87A0] font-semibold hover:underline">Browse</Link>
              </div>
              {/* TODO: replace with real connections from DB */}
              <div className="space-y-2">
                {FOLLOWING_PLACEHOLDERS.map(p => (
                  <div key={p.name} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ backgroundColor: p.color }}>
                      {p.initials}
                    </div>
                    <span className="text-xs font-medium text-[#374151] truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Active */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1B3A5C]">Recently Active</h3>
                <Link href="/members" className="text-xs text-[#4E87A0] font-semibold hover:underline">View all</Link>
              </div>
              {/* TODO: replace with real recently active members from DB */}
              <div className="flex flex-wrap gap-2">
                {RECENT_PLACEHOLDERS.map(p => (
                  <div key={p.initials} className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: p.color }}>
                      {p.initials}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
