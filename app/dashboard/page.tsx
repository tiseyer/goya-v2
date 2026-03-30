'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useImpersonation } from '@/app/context/ImpersonationContext';
import FeedView from './FeedView';
import PageHero from '@/app/components/PageHero';

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

interface ProfileData {
  full_name?: string | null
  username?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  instagram?: string | null
  youtube?: string | null
  avatar_url?: string | null
  role?: string | null
}

function getCompletion(profile: ProfileData | null) {
  const done = COMPLETION_FIELDS.filter(f => profile?.[f.key as keyof ProfileData]);
  const pct = Math.round((done.length / COMPLETION_FIELDS.length) * 100);
  return { pct, done: done.map(f => f.key) };
}

// ─── Static placeholder data ──────────────────────────────────────────────────

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
  const { isImpersonating, targetUserId, targetProfile } = useImpersonation();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (isImpersonating && targetUserId) {
        // When impersonating, fetch via /api/me which uses the service client server-side
        const res = await fetch('/api/me');
        if (!res.ok) { router.push('/sign-in'); return; }
        const data = await res.json();
        setUser({ id: data.userId });
        setProfile(data.profile as ProfileData | null);
        setLoading(false);
        return;
      }
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/sign-in'); return; }
      setUser(authUser);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      setProfile(p as ProfileData | null);
      setLoading(false);
    }
    load();
  }, [router, isImpersonating, targetUserId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const userInitials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '?');
  const currentUserId = user?.id ?? '';
  const currentUserRole = profile?.role ?? 'student';
  const { pct, done } = getCompletion(profile);

  // Circular SVG progress
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        pill="GOYA Dashboard"
        title={`Welcome back, ${firstName}`}
        subtitle="Your yoga community hub."
      />

      {/* 3-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-5">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Complete Your Profile */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-primary-dark mb-4">Complete Your Profile</h3>
              <div className="flex items-center gap-4 mb-4">
                {/* Circular progress */}
                <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0">
                  <circle cx="34" cy="34" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
                  <circle
                    cx="34" cy="34" r={r}
                    fill="none"
                    stroke={pct === 100 ? '#059669' : 'var(--goya-primary-light)'}
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
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${complete ? 'bg-primary-light' : 'bg-slate-200'}`}>
                          {complete && (
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs ${complete ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Link
                href="/profile/settings"
                className="block w-full text-center py-2 bg-primary-dark text-white text-xs font-semibold rounded-lg hover:bg-primary transition-colors"
              >
                Edit Profile
              </Link>
            </div>

            {/* Membership Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-primary-dark mb-3">Membership Activity</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'CE Hours',        value: 0, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', bg: 'bg-primary-50', text: 'text-primary', border: 'border-primary-100' },
                  { label: 'Community',       value: 0, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', bg: 'bg-primary-100', text: 'text-primary-dark', border: 'border-primary-200' },
                  { label: 'Karma',           value: 0, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', bg: 'bg-primary-light/10', text: 'text-primary-light', border: 'border-primary-light/20' },
                  { label: 'Practice',        value: 0, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/15' },
                ].map(c => (
                  <div key={c.label} className={`rounded-xl p-3 border ${c.bg} ${c.border}`}>
                    <div className={`flex items-center gap-1.5 mb-1`}>
                      <svg className={`w-3.5 h-3.5 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                      </svg>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${c.text}`}>{c.label}</span>
                    </div>
                    <div className={`text-xl font-bold ${c.text}`}>{c.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Link href="/credits" className="flex-1 text-center py-1.5 bg-primary-light text-white text-xs font-semibold rounded-lg hover:bg-primary transition-colors">
                  Submit
                </Link>
                <Link href="/credits" className="flex-1 text-center py-1.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                  View
                </Link>
                <Link href="/credits" className="flex-1 text-center py-1.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                  Learn More
                </Link>
              </div>
            </div>

          </div>

          {/* ── MAIN FEED ────────────────────────────────────────────────── */}
          <div>
            {currentUserId && (
              <FeedView
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                currentUserFirstName={firstName}
              />
            )}
          </div>

          {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-primary-dark">Upcoming Events</h3>
                <Link href="/events" className="text-xs text-primary-light font-semibold hover:underline">See all</Link>
              </div>
              {/* TODO: replace with real events from DB */}
              <div className="space-y-3">
                {PLACEHOLDER_EVENTS.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="w-10 shrink-0 text-center">
                      <div className="text-xl font-bold text-primary-light leading-tight">{ev.day}</div>
                      <div className="text-[9px] font-semibold text-slate-400 uppercase">{ev.month}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary-dark leading-snug line-clamp-2">{ev.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ev.location}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/events" className="block w-full text-center py-2 mt-4 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-wide">
                View Calendar
              </Link>
            </div>

            {/* I'm Following */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-primary-dark">I&apos;m Following</h3>
                <Link href="/members" className="text-xs text-primary-light font-semibold hover:underline">Browse</Link>
              </div>
              {/* TODO: replace with real connections from DB */}
              <div className="space-y-2">
                {FOLLOWING_PLACEHOLDERS.map(p => (
                  <div key={p.name} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ backgroundColor: p.color }}>
                      {p.initials}
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Active */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-primary-dark">Recently Active</h3>
                <Link href="/members" className="text-xs text-primary-light font-semibold hover:underline">View all</Link>
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
