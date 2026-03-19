import Link from 'next/link';
import { members } from '@/lib/members-data';

const stats = [
  { value: '45+', label: 'Member Countries' },
  { value: '2,400+', label: 'Registered Teachers' },
  { value: '380+', label: 'Yoga Schools' },
  { value: '180K+', label: 'CE Hours Logged' },
];

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Global Community',
    description: 'Connect with yoga practitioners from 45+ countries. Find teachers, students, and schools that align with your path.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Verified Designations',
    description: 'Showcase your credentials — RYT 200, E-RYT 500, YACEP, and more — verified and recognized globally.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Credit Hour Tracking',
    description: 'Log CE, Community, Karma, and Practice hours. Build your portfolio and demonstrate your commitment to growth.',
  },
];

const featuredMembers = members.filter(m => m.featured).slice(0, 3);

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#F7F8FA] min-h-[90vh] flex items-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#4E87A0] opacity-[0.06] rounded-full blur-3xl translate-x-1/3" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#4E87A0] opacity-[0.04] rounded-full blur-3xl translate-y-1/3" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#4E87A0]/10 border border-[#4E87A0]/20 rounded-full px-4 py-1.5 text-[#4E87A0] text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-[#4E87A0] rounded-full animate-pulse" />
              Global Yoga Community Platform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1B3A5C] leading-[1.05] mb-6">
              Connect. Grow.
              <br />
              <span className="text-[#4E87A0]">Practice Together.</span>
            </h1>

            <p className="text-[#6B7280] text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl">
              GOYA brings together yoga teachers, students, schools, and wellness practitioners
              from around the world. Discover community, track your practice, and grow your credentials.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/members"
                className="bg-[#4E87A0] text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-[#3A7190] transition-colors inline-flex items-center gap-2"
              >
                Explore Members
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/register"
                className="border border-[#E5E7EB] text-[#374151] px-8 py-4 rounded-xl text-base font-semibold hover:bg-white hover:border-slate-300 transition-colors"
              >
                Join for Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-14 border-y border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#4E87A0] mb-1.5">{stat.value}</div>
                <div className="text-[#6B7280] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1B3A5C] mb-4">
              Everything your practice needs
            </h2>
            <p className="text-[#6B7280] text-lg max-w-2xl mx-auto">
              A modern platform built for the global yoga community — no matter where you are on your journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(feature => (
              <div key={feature.title} className="group p-8 rounded-2xl border border-slate-100 hover:border-[#4E87A0]/30 hover:shadow-lg transition-all duration-200">
                <div className="w-12 h-12 bg-[#4E87A0]/10 rounded-xl flex items-center justify-center text-[#4E87A0] mb-6 group-hover:bg-[#4E87A0] group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#1B3A5C] mb-3">{feature.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Members */}
      <section className="bg-[#F7F8FA] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1B3A5C] mb-3">Featured Members</h2>
              <p className="text-[#6B7280]">Inspiring practitioners from our global community.</p>
            </div>
            <Link
              href="/members"
              className="hidden sm:inline-flex items-center gap-1.5 text-[#4E87A0] hover:text-[#3A7190] text-sm font-semibold transition-colors"
            >
              View all members
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {featuredMembers.map(member => (
              <Link
                key={member.id}
                href={`/members/${member.id}`}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-slate-100 hover:border-[#4E87A0]/20 transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-[#1B3A5C] transition-colors">
                      {member.name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      member.role === 'Teacher' ? 'bg-teal-50 text-teal-700' :
                      member.role === 'School' ? 'bg-purple-50 text-purple-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>
                <p className="text-[#6B7280] text-sm leading-relaxed line-clamp-2 mb-4">{member.bio}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{member.city}, {member.country}</span>
                  <span className="text-xs font-medium text-[#4E87A0] group-hover:text-[#3A7190] flex items-center gap-1 transition-colors">
                    View
                    <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10 sm:hidden">
            <Link
              href="/members"
              className="inline-flex items-center gap-1.5 text-[#4E87A0] hover:text-[#3A7190] text-sm font-semibold transition-colors"
            >
              View all members
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B3A5C] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to join the community?</h2>
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
            Create your free GOYA profile today and connect with thousands of practitioners worldwide.
          </p>
          <Link
            href="/register"
            className="bg-[#4E87A0] text-white px-10 py-4 rounded-xl text-base font-semibold hover:bg-[#3A7190] transition-colors inline-flex items-center gap-2"
          >
            Get Started — It&apos;s Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
