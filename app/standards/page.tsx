export default function StandardsPage() {
  const designations = [
    {
      code: 'RYT 200',
      name: 'Registered Yoga Teacher 200',
      hours: '200',
      color: 'bg-teal-50 border-teal-200',
      badge: 'bg-teal-100 text-teal-700',
      requirements: [
        '200 hours of GOYA-accredited teacher training',
        'Minimum 30 contact hours of teaching practice',
        'Completion of anatomy & physiology module',
        'Agreement to GOYA Code of Ethics',
        'Current CPR/First Aid certification',
      ],
    },
    {
      code: 'RYT 500',
      name: 'Registered Yoga Teacher 500',
      hours: '500',
      color: 'bg-blue-50 border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      requirements: [
        'Active RYT 200 in good standing',
        'Additional 300 hours of advanced training',
        'Minimum 1 year of active teaching',
        'Completion of mentorship module',
        '100 hours of documented teaching',
      ],
    },
    {
      code: 'E-RYT 200',
      name: 'Experienced Registered Yoga Teacher 200',
      hours: '1,000+',
      color: 'bg-purple-50 border-purple-200',
      badge: 'bg-purple-100 text-purple-700',
      requirements: [
        'Active RYT 200 for minimum 3 years',
        '1,000 hours of documented teaching',
        '30 CE hours completed post-certification',
        'Peer review and evaluation',
        'Annual recertification in good standing',
      ],
    },
    {
      code: 'E-RYT 500',
      name: 'Experienced Registered Yoga Teacher 500',
      hours: '2,000+',
      color: 'bg-indigo-50 border-indigo-200',
      badge: 'bg-indigo-100 text-indigo-700',
      requirements: [
        'Active RYT 500 for minimum 4 years',
        '2,000 hours of documented teaching',
        '75 CE hours completed post-certification',
        'Advanced mentorship or faculty experience',
        'Leadership role in yoga community',
      ],
    },
    {
      code: 'YACEP',
      name: 'Yoga Alliance Continuing Education Provider',
      hours: 'Ongoing',
      color: 'bg-amber-50 border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      requirements: [
        'Active E-RYT 200 or E-RYT 500',
        'Approved CE curriculum submitted to GOYA',
        'Minimum 10 contact teaching hours per offering',
        'Annual curriculum review and renewal',
        'Student feedback reporting requirements',
      ],
    },
    {
      code: 'RYS 200 / 300 / 500',
      name: 'Registered Yoga School',
      hours: 'School',
      color: 'bg-emerald-50 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      requirements: [
        'Lead trainer holds E-RYT 500 or equivalent',
        'Curriculum meets GOYA hour requirements',
        'On-site or online facility standards met',
        'Graduate tracking and reporting system',
        'Annual school audit and renewal',
      ],
    },
  ];

  const principles = [
    { title: 'Non-Harm (Ahimsa)', description: 'All GOYA members commit to the principle of non-harm — in their teaching, their conduct with students, and their presence in the wider community.' },
    { title: 'Truthfulness (Satya)', description: 'Members represent their credentials, experience, and lineage accurately and do not misrepresent their qualifications or training background.' },
    { title: 'Professional Boundaries', description: 'Clear boundaries between teacher and student are maintained at all times. Exploitation of the teacher-student relationship is grounds for decertification.' },
    { title: 'Inclusivity', description: 'GOYA members actively work to create accessible, welcoming spaces for all students regardless of ability, background, age, gender, or identity.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-[#1a2744] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-20 top-0 w-96 h-96 bg-[#2dd4bf] opacity-[0.04] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 rounded-full px-4 py-1.5 text-[#2dd4bf] text-sm font-medium mb-8">
            GOYA Certification Framework
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Standards &amp; Ethics
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
            GOYA certification standards define the professional requirements for yoga teachers, schools,
            and continuing education providers worldwide. These standards protect students and elevate
            the profession.
          </p>
        </div>
      </div>

      {/* Designations */}
      <div className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1a2744] mb-4">Certification Designations</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Each designation represents a specific level of training, experience, and professional commitment.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {designations.map(d => (
              <div key={d.code} className={`rounded-2xl border-2 p-6 ${d.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.badge}`}>{d.code}</span>
                  <span className="text-xs text-slate-500 font-medium">{d.hours} hrs</span>
                </div>
                <h3 className="font-semibold text-[#1a2744] text-sm mb-4">{d.name}</h3>
                <ul className="space-y-2">
                  {d.requirements.map(req => (
                    <li key={req} className="flex items-start gap-2 text-xs text-slate-600">
                      <svg className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ethics */}
      <div className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1a2744] mb-4">Code of Ethics</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              All GOYA members agree to uphold the following ethical principles as a condition of their registration.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {principles.map(p => (
              <div key={p.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-[#2dd4bf] rounded-full" />
                  <h3 className="font-semibold text-[#1a2744]">{p.title}</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed pl-5">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Violations */}
      <div className="bg-[#1a2744] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Reporting an Ethics Violation</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            GOYA takes all reports of ethical violations seriously. If you have concerns about a registered member,
            school, or training program, our Ethics Committee will investigate confidentially and take appropriate action,
            up to and including revocation of certification.
          </p>
          <button className="bg-[#2dd4bf] text-[#1a2744] px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-[#14b8a6] transition-colors">
            Submit a Report
          </button>
        </div>
      </div>
    </div>
  );
}
