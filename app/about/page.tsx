export default function AboutPage() {
  const pillars = [
    {
      title: 'Global Standards',
      description: 'GOYA establishes and maintains internationally recognized certification standards for yoga teachers, schools, and wellness practitioners — ensuring consistency, quality, and integrity across the global yoga community.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
      ),
    },
    {
      title: 'Verified Credentials',
      description: 'Every GOYA designation — RYT 200, E-RYT 500, YACEP, and beyond — is backed by rigorous training requirements, ethical standards, and ongoing education commitments, giving practitioners and students confidence in who they practice with.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      title: 'Continuing Education',
      description: 'GOYA drives lifelong learning through a structured credit-hour system, approved continuing education providers, and a growing library of courses, workshops, and training programs available through the GOYA Academy.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      title: 'Ethical Integrity',
      description: 'Our Code of Ethics and Code of Conduct set the professional and personal standards expected of all GOYA members — protecting students, supporting teachers, and upholding the dignity of yoga as a discipline.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-[#1a2744] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-20 top-0 w-96 h-96 bg-[#2dd4bf] opacity-[0.04] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#2dd4bf] opacity-[0.04] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 rounded-full px-4 py-1.5 text-[#2dd4bf] text-sm font-medium mb-8">
            Est. 2015
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            The Global Standard for<br />
            <span className="text-[#2dd4bf]">Yoga Certification</span>
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto">
            GOYA is to yoga what EASA is to aviation — an independent, internationally recognized body
            that sets the professional standards, certification frameworks, and ethical guidelines that
            govern the global yoga industry.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1a2744] mb-6">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                The Global Online Yoga Association exists to bring professional clarity, credentialing
                integrity, and community cohesion to the worldwide yoga ecosystem. We believe every
                student deserves to practice with qualified, ethical, and continuously developing teachers
                — and every teacher deserves a globally respected credential.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                Just as aviation relies on EASA or FAA to certify pilots and regulate flight schools,
                the yoga world needs a trusted, independent body that transcends national borders and
                commercial interests. That is GOYA.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We do not teach yoga. We set the standards by which yoga is taught — and we connect
                the global community of practitioners who meet those standards.
              </p>
            </div>
            <div className="bg-[#1a2744] rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#2dd4bf] opacity-[0.06] rounded-full blur-2xl" />
              <div className="relative space-y-6">
                {[
                  { value: '45+', label: 'Member Countries' },
                  { value: '2,400+', label: 'Registered Teachers' },
                  { value: '380+', label: 'Accredited Schools' },
                  { value: '180K+', label: 'CE Hours Logged' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <span className="text-slate-300 text-sm">{stat.label}</span>
                    <span className="text-[#2dd4bf] font-bold text-xl">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1a2744] mb-4">What GOYA Stands For</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Four core commitments that shape everything we do.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pillars.map(pillar => (
              <div key={pillar.title} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-[#2dd4bf]/10 rounded-xl flex items-center justify-center text-[#2dd4bf] mb-5">
                  {pillar.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#1a2744] mb-3">{pillar.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#1a2744] py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Join the global standard</h2>
        <p className="text-slate-300 mb-8 max-w-xl mx-auto">
          Become a GOYA member and be part of the professional community shaping the future of yoga worldwide.
        </p>
        <a
          href="/register"
          className="bg-[#2dd4bf] text-[#1a2744] px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-[#14b8a6] transition-colors inline-block"
        >
          Become a Member
        </a>
      </div>
    </div>
  );
}
