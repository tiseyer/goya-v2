import { notFound } from 'next/navigation';
import Link from 'next/link';
import { courses } from '@/lib/academy-data';

export async function generateStaticParams() {
  return courses.map(c => ({ id: c.id }));
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = courses.find(c => c.id === id);
  if (!course) notFound();

  const related = courses.filter(c => c.id !== course.id && c.category === course.category).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-[#1a2744] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/academy"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Academy
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold bg-white/10 text-slate-300 px-3 py-1 rounded-full border border-white/15">
              {course.category}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              course.access === 'Free' ? 'bg-emerald-400 text-white' : 'bg-[#2dd4bf] text-[#1a2744]'
            }`}>
              {course.access}
            </span>
            <span className="text-xs text-slate-400">{course.level}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{course.title}</h1>
          <p className="text-slate-300 text-base mb-5 max-w-2xl">{course.description}</p>
          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {course.instructor}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {course.lessons} lessons
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: video player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vimeo embed */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video">
              <iframe
                src="https://player.vimeo.com/video/76979871?autoplay=0&title=0&byline=0&portrait=0"
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={course.title}
              />
            </div>

            {/* Course info */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#2dd4bf] rounded-full" />
                About this Course
              </h2>
              <p className="text-slate-600 leading-relaxed text-[15px]">{course.description}</p>
              <p className="text-slate-500 text-sm leading-relaxed mt-3">
                This course is part of the GOYA Academy curriculum and may qualify for Continuing Education (CE) credit hours toward your GOYA registration renewal. Check your member dashboard for eligibility.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enroll CTA */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className={`w-full h-2 rounded-full mb-5 bg-gradient-to-r ${course.gradient}`} />
              {course.access === 'Free' ? (
                <>
                  <p className="text-2xl font-bold text-[#1a2744] mb-1">Free</p>
                  <p className="text-slate-500 text-xs mb-5">No login required to watch</p>
                  <button className="w-full bg-[#2dd4bf] text-[#1a2744] py-3 rounded-xl text-sm font-bold hover:bg-[#14b8a6] transition-colors">
                    Start Watching
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Members Only</p>
                  <p className="text-slate-500 text-xs mb-5">Available with a GOYA membership</p>
                  <Link
                    href="/register"
                    className="block w-full bg-[#2dd4bf] text-[#1a2744] py-3 rounded-xl text-sm font-bold hover:bg-[#14b8a6] transition-colors text-center"
                  >
                    Join GOYA to Watch
                  </Link>
                  <Link
                    href="/login"
                    className="block w-full mt-2 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors text-center"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Course details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Course Details</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Instructor', value: course.instructor },
                  { label: 'Duration', value: course.duration },
                  { label: 'Lessons', value: `${course.lessons} lessons` },
                  { label: 'Level', value: course.level },
                  { label: 'Category', value: course.category },
                  { label: 'Access', value: course.access },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-700 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related courses */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#1a2744] mb-6">More in {course.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map(c => (
                <Link
                  key={c.id}
                  href={`/academy/${c.id}`}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  <div className={`bg-gradient-to-br ${c.gradient} h-28`} />
                  <div className="p-4">
                    <h3 className="font-semibold text-[#1a2744] text-sm mb-1 group-hover:text-[#0e9f8a] transition-colors line-clamp-2">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400">{c.instructor} · {c.duration}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
