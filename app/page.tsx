import Link from 'next/link';
import AnimatedCounter from './components/landing/AnimatedCounter';
import ScrollFadeIn from './components/landing/ScrollFadeIn';
import NewsletterForm from './components/landing/NewsletterForm';
import GlobeWireframe from './components/landing/GlobeWireframe';

// ─── Supabase REST fetch (no auth needed, public stats) ─────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function fetchStats() {
  try {
    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

    const [membersRes, teachersRes, countriesRes, hoursRes, schoolsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
        headers: { ...headers, Prefer: 'count=exact' },
        next: { revalidate: 3600 },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&member_type=eq.teacher&limit=1`, {
        headers: { ...headers, Prefer: 'count=exact' },
        next: { revalidate: 3600 },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/rpc/count_distinct_countries`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: '{}',
        next: { revalidate: 3600 },
      }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/rpc/sum_approved_hours`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: '{}',
        next: { revalidate: 3600 },
      }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/schools?select=id&limit=1`, {
        headers: { ...headers, Prefer: 'count=exact' },
        next: { revalidate: 3600 },
      }),
    ]);

    const members = parseInt(membersRes.headers.get('content-range')?.split('/')[1] ?? '0', 10);
    const teachers = parseInt(teachersRes.headers.get('content-range')?.split('/')[1] ?? '0', 10);
    const schools = parseInt(schoolsRes.headers.get('content-range')?.split('/')[1] ?? '0', 10);

    let countries = 0;
    if (countriesRes?.ok) {
      const data = await countriesRes.json();
      countries = typeof data === 'number' ? data : (data?.[0]?.count ?? 0);
    }

    let hours = 0;
    if (hoursRes?.ok) {
      const data = await hoursRes.json();
      hours = typeof data === 'number' ? data : Math.floor(Number(data?.[0]?.total ?? 0));
    }

    return { members, teachers, schools, countries, hours };
  } catch {
    return { members: 0, teachers: 0, schools: 0, countries: 0, hours: 0 };
  }
}

async function fetchFeaturedMembers() {
  try {
    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

    // Try featured members first, fall back to recent teachers
    let res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,avatar_url,bio,city,country,member_type&is_verified=eq.true&avatar_url=neq.null&bio=neq.null&limit=6&order=created_at.desc`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!res.ok) return [];
    let members = await res.json();

    // If not enough verified members, get recent ones with avatars
    if (members.length < 6) {
      res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,avatar_url,bio,city,country,member_type&avatar_url=neq.null&onboarding_completed=eq.true&limit=6&order=created_at.desc`,
        { headers, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const more = await res.json();
        const ids = new Set(members.map((m: any) => m.id));
        for (const m of more) {
          if (!ids.has(m.id) && members.length < 6) {
            members.push(m);
            ids.add(m.id);
          }
        }
      }
    }

    return members;
  } catch {
    return [];
  }
}

// ─── Role badge colors ──────────────────────────────────────────────────────

const MEMBER_TYPE_LABEL: Record<string, string> = {
  teacher: 'Teacher',
  student: 'Student',
  wellness_practitioner: 'Wellness Practitioner',
  school: 'School',
};

const MEMBER_TYPE_STYLE: Record<string, string> = {
  teacher: 'bg-primary-50 text-primary border-primary-100',
  student: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  wellness_practitioner: 'bg-amber-50 text-amber-700 border-amber-100',
  school: 'bg-violet-50 text-violet-700 border-violet-100',
};

// ─── Benefit cards data ──────────────────────────────────────────────────────

const benefits = [
  {
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'Be Found',
    description: 'Your profile puts you on the map. Students discover teachers. Teachers find students. Everyone grows.',
  },
  {
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    title: 'Globally Recognized',
    description: 'GOYA certifications and school licenses are unified and recognized worldwide.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'Your Community',
    description: 'Connect with like-minded practitioners from 45+ countries. Find your people.',
  },
  {
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    title: 'Free Academy',
    description: 'Hundreds of free courses. Learn at your own pace, from anywhere.',
  },
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: 'Never Miss a Thing',
    description: 'A global event calendar for workshops, trainings, and retreats.',
  },
  {
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Member Perks',
    description: 'Exclusive discounts on yoga insurance, equipment, and more. Benefits that pay for themselves.',
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function Home() {
  const [stats, featuredMembers] = await Promise.all([
    fetchStats(),
    fetchFeaturedMembers(),
  ]);

  // Use live data with sensible minimums for display
  const displayStats = [
    { value: Math.max(stats.members, 2), label: 'Members Registered', suffix: '+' },
    { value: Math.max(stats.schools, 0) || Math.max(stats.teachers, 0), label: stats.schools > 0 ? 'Yoga Schools' : 'Registered Teachers', suffix: '+' },
    { value: Math.max(stats.countries, 1), label: 'Countries Represented', suffix: '+' },
    { value: Math.max(stats.hours, 6), label: 'Hours Logged', suffix: '+' },
  ];

  return (
    <div className="overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-dvh flex items-center bg-surface-muted">
        <GlobeWireframe />

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary opacity-[0.06] rounded-full blur-3xl translate-x-1/4" />
          <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-primary-light opacity-[0.04] rounded-full blur-3xl -translate-x-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl animate-[fadeIn_0.8s_ease-out]">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary-dark leading-[1.05] tracking-tight mb-6">
              The Global Home
              <br />
              <span className="text-primary">for Yoga.</span>
            </h1>

            <p className="text-foreground-secondary text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
              Connect, learn, and grow with the worldwide yoga community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-primary-dark shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer"
              >
                Join Today
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/members"
                className="inline-flex items-center justify-center border border-slate-200 bg-white text-foreground px-8 py-4 rounded-xl text-base font-semibold hover:border-primary/30 hover:text-primary shadow-soft hover:shadow-card transition-all duration-200 cursor-pointer"
              >
                Explore Members
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS BAR ───────────────────────────────────────────────── */}
      <section className="bg-white py-14 border-y border-goya-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {displayStats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1.5">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-foreground-secondary text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="bg-background py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark tracking-tight mb-4">
                Why practitioners choose GOYA
              </h2>
              <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
                Everything you need to grow your practice and connect with the global community.
              </p>
            </div>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <ScrollFadeIn key={benefit.title} delay={i * 80}>
                <div className="group p-8 rounded-2xl border border-goya-border-muted bg-background shadow-soft hover:border-primary/20 hover:shadow-card transition-all duration-200 h-full">
                  <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={benefit.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-primary-dark mb-3">{benefit.title}</h3>
                  <p className="text-foreground-secondary text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED MEMBERS ─────────────────────────────────────────────── */}
      {featuredMembers.length > 0 && (
        <section className="bg-surface-muted py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollFadeIn>
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark tracking-tight mb-2">
                    Meet the Community
                  </h2>
                  <p className="text-foreground-secondary">Practitioners from around the world.</p>
                </div>
                <Link
                  href="/members"
                  className="hidden sm:inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-semibold transition-colors cursor-pointer"
                >
                  View all members
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollFadeIn>

            {/* Desktop: grid, Mobile: horizontal scroll */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-sm:flex max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory max-sm:-mx-4 max-sm:px-4 max-sm:gap-4 max-sm:grid-cols-none">
              {featuredMembers.map((member: any, i: number) => (
                <ScrollFadeIn key={member.id} delay={i * 60} className="max-sm:min-w-[280px] max-sm:snap-start">
                  <Link
                    href={`/members/${member.id}`}
                    className="group block bg-background rounded-2xl p-6 shadow-card hover:shadow-elevated border border-goya-border-muted hover:border-primary/15 transition-all duration-200 h-full"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {member.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={member.avatar_url}
                          alt={member.full_name ?? ''}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-50"
                          width={56}
                          height={56}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center ring-2 ring-primary-50">
                          <span className="text-white text-lg font-bold">
                            {(member.full_name ?? '?')[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-primary-dark group-hover:text-primary transition-colors leading-snug truncate">
                          {member.full_name ?? 'GOYA Member'}
                        </h3>
                        {member.member_type && (
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border mt-1 ${MEMBER_TYPE_STYLE[member.member_type] ?? 'bg-primary-50 text-primary border-primary-100'}`}>
                            {MEMBER_TYPE_LABEL[member.member_type] ?? member.member_type}
                          </span>
                        )}
                      </div>
                    </div>
                    {member.bio && (
                      <p className="text-foreground-secondary text-sm leading-relaxed line-clamp-2 mb-4">{member.bio}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {(member.city || member.country) && (
                        <span className="text-xs text-foreground-tertiary">
                          {[member.city, member.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-primary group-hover:text-primary-dark flex items-center gap-1 transition-colors ml-auto">
                        View profile
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </ScrollFadeIn>
              ))}
            </div>

            <div className="text-center mt-10 sm:hidden">
              <Link
                href="/members"
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-semibold transition-colors cursor-pointer"
              >
                View all members
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section className="bg-surface-muted py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFadeIn>
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight mb-3">
                Stay in the loop
              </h2>
              <p className="text-foreground-secondary text-base mb-8">
                Get updates on new features, events, and community highlights.
              </p>
              <NewsletterForm />
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-primary-dark py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary opacity-20 rounded-full blur-3xl -translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollFadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Ready to join the community?
            </h2>
            <p className="text-primary-200 text-lg mb-10 max-w-xl mx-auto">
              Create your free GOYA profile today and connect with practitioners worldwide.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-primary-dark px-10 py-4 rounded-xl text-base font-bold hover:bg-primary-50 shadow-elevated transition-all duration-200 cursor-pointer"
            >
              Join Today — It&apos;s Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </ScrollFadeIn>
        </div>
      </section>

    </div>
  );
}
