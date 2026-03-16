import { notFound } from 'next/navigation';
import Link from 'next/link';
import { members } from '@/lib/members-data';

const ROLE_HERO: Record<string, { badge: string }> = {
  Teacher: { badge: 'bg-teal-500/20 text-teal-300 border border-teal-500/30' },
  Student: { badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  School: { badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
  'Wellness Practitioner': { badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
};

const CREDIT_CONFIG = [
  {
    key: 'CE' as const,
    label: 'Continuing Education',
    short: 'CE Hours',
    bg: 'bg-[#2dd4bf]',
    text: 'text-[#1a2744]',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    key: 'Community' as const,
    label: 'Community Service',
    short: 'Community',
    bg: 'bg-purple-500',
    text: 'text-white',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'Karma' as const,
    label: 'Karma Yoga',
    short: 'Karma',
    bg: 'bg-amber-500',
    text: 'text-white',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    key: 'Practice' as const,
    label: 'Personal Practice',
    short: 'Practice',
    bg: 'bg-blue-500',
    text: 'text-white',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export async function generateStaticParams() {
  return members.map(m => ({ id: m.id }));
}

export default async function MemberProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = members.find(m => m.id === id);
  if (!member) notFound();

  const heroStyle = ROLE_HERO[member.role];
  const totalCredits = Object.values(member.credits).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#1a2744] via-[#1a2744] to-[#1e2e56] pt-10 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2dd4bf] opacity-[0.03] rounded-full blur-3xl translate-x-1/2 -translate-y-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Back link */}
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-10 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.photo}
                alt={member.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover ring-4 ring-white/10 shadow-2xl"
              />
              {member.featured && (
                <div className="absolute -top-2 -right-2 bg-[#2dd4bf] text-[#1a2744] text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                  Featured
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${heroStyle.badge}`}
                >
                  {member.role}
                </span>
                {member.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs font-semibold border border-blue-400/30">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                {member.name}
              </h1>
              {member.introduction && (
                <p className="text-slate-300 text-sm mt-1 italic">{member.introduction}</p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-sm mb-4">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {member.city}, {member.country}
              </div>

              {/* Designation badges */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {member.designations.map(d => (
                  <span
                    key={d}
                    className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/15 backdrop-blur-sm"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content — pulled up to overlap hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#2dd4bf] rounded-full" />
                About
              </h2>
              <p className="text-slate-600 leading-relaxed text-[15px]">{member.bio}</p>

              {member.videoIntroUrl && (
                <div className="mt-6">
                  <h3 className="text-base font-bold text-[#1a2744] mb-3">Video Introduction</h3>
                  <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={member.videoIntroUrl.replace('watch?v=', 'embed/')}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Teaching styles */}
            {member.teachingStyles.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#2dd4bf] rounded-full" />
                  {member.role === 'School' ? 'Programs Offered' : 'Teaching Styles'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {member.teachingStyles.map(style => (
                    <span
                      key={style}
                      className="bg-[#2dd4bf]/10 text-[#0e9f8a] border border-[#2dd4bf]/20 text-sm font-medium px-4 py-1.5 rounded-full"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            {member.specialties.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#2dd4bf] rounded-full" />
                  Specialties
                </h2>
                <div className="flex flex-wrap gap-2">
                  {member.specialties.map(s => (
                    <span
                      key={s}
                      className="bg-slate-100 text-slate-600 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Credit hours */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-900">Credit Hours</h2>
                <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
                  {totalCredits} total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CREDIT_CONFIG.map(({ key, short, bg, text, icon }) => (
                  <div
                    key={key}
                    className={`${bg} ${text} rounded-xl p-4 flex flex-col justify-between min-h-[96px]`}
                  >
                    <div className="opacity-80">{icon}</div>
                    <div>
                      <div className="text-2xl font-bold leading-none mb-0.5">
                        {member.credits[key]}
                      </div>
                      <div className="text-[11px] font-semibold opacity-75 uppercase tracking-wide">
                        {short}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social links */}
            {(member.social.website || member.social.instagram || member.social.youtube) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Connect</h2>
                <div className="space-y-2.5">
                  {member.social.website && (
                    <a
                      href={member.social.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#2dd4bf] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#2dd4bf]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <span className="truncate">Website</span>
                    </a>
                  )}
                  {member.social.instagram && (
                    <a
                      href="#"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#2dd4bf] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#2dd4bf]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>
                      <span className="truncate">{member.social.instagram}</span>
                    </a>
                  )}
                  {member.social.youtube && (
                    <a
                      href="#"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#2dd4bf] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#2dd4bf]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                        </svg>
                      </div>
                      <span className="truncate">{member.social.youtube}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Member card */}
            <div className="bg-[#1a2744] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2dd4bf] opacity-[0.06] rounded-full blur-2xl translate-x-8 -translate-y-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">GOYA Member</span>
                  <span className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-pulse" />
                </div>
                <p className="text-white font-bold text-lg mb-4">Since {member.memberSince}</p>
                <div className="pt-4 border-t border-white/10">
                  <button className="w-full bg-[#2dd4bf] text-[#1a2744] py-2.5 rounded-xl text-sm font-bold hover:bg-[#14b8a6] transition-colors">
                    Connect with {member.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
