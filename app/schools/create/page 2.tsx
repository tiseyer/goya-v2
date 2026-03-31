import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export default async function SchoolCreateLandingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#1B3A5C] py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Register Your School on GOYA
          </h1>
          <p className="text-blue-200 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
            Bring your yoga school to a global community of teachers and students.
          </p>
          <Link
            href="/schools/create/onboarding"
            className="inline-block bg-white text-[#1B3A5C] font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors"
          >
            Register Your School →
          </Link>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Pricing */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-[#1B3A5C] text-center mb-10">
            Simple, Transparent Pricing
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8">
              <p className="text-sm font-medium text-[#6B7280] mb-3">One-Time Registration Fee</p>
              <p className="text-4xl font-bold text-[#1B3A5C] mb-4">$99 <span className="text-base font-normal text-[#6B7280]">USD</span></p>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                Pay once to register and list your school on GOYA
              </p>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8">
              <p className="text-sm font-medium text-[#6B7280] mb-3">Annual Renewal</p>
              <p className="text-4xl font-bold text-[#1B3A5C] mb-4">
                $40 <span className="text-base font-normal text-[#6B7280]">USD/year</span>
              </p>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                Keep your school listing active and verified
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-[#9CA3AF] mt-6">
            Payment is not required during registration. Our team will contact you after approval.
          </p>
        </section>

        {/* Benefits */}
        <section className="py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-[#F7F8FA]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1B3A5C] text-center mb-10">
              What You Get
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { emoji: '🌍', title: 'Global Visibility', desc: 'Your school appears in the GOYA directory and on the member map' },
                { emoji: '✓', title: 'GOYA Verified Badge', desc: 'Approved schools receive a verified badge on their profile' },
                { emoji: '👩‍🏫', title: 'Teacher Profiles Linked', desc: 'Connect your teachers to your school listing' },
                { emoji: '📅', title: 'Event Listings', desc: 'Post workshops and trainings directly from your school profile' },
                { emoji: '🎓', title: 'Course Hosting', desc: 'List your teacher training programs in the GOYA Academy' },
                { emoji: '📊', title: 'School Dashboard', desc: "Track your school's engagement and member connections" },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl p-5 border border-[#E5E7EB]">
                  <div
                    className="flex items-center justify-center rounded-full mb-4 text-xl"
                    style={{ width: 40, height: 40, background: 'rgba(78,135,160,0.10)' }}
                  >
                    {item.emoji}
                  </div>
                  <p className="font-semibold text-[#1B3A5C] text-sm mb-1">{item.title}</p>
                  <p className="text-[#6B7280] text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Warning */}
        <section className="py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-2xl mx-auto flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-amber-800 text-sm leading-relaxed">
              Only register a school if you are the owner or have been authorized to act on behalf of the school. Misrepresentation may result in removal from the GOYA platform.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 text-center">
          <h2 className="text-3xl font-bold text-[#1B3A5C] mb-6">Ready to Register?</h2>
          <Link
            href="/schools/create/onboarding"
            className="inline-block bg-[#1B3A5C] text-white font-semibold rounded-xl px-8 py-4 text-lg hover:bg-[#16304f] transition-colors"
          >
            Register Your School →
          </Link>
        </section>

      </div>
    </div>
  );
}
