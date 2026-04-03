import Link from 'next/link'

interface SchoolRegistrationCTAProps {
  variant: 'sidebar' | 'callout' | 'banner'
}

export default function SchoolRegistrationCTA({ variant }: SchoolRegistrationCTAProps) {
  if (variant === 'sidebar') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-primary-dark mb-2">Own a Yoga School?</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          List your school on GOYA, manage designations, and connect with students.
        </p>
        <Link
          href="/schools/create"
          className="block w-full text-center py-2 bg-primary-dark text-white text-xs font-semibold rounded-lg hover:bg-primary transition-colors"
        >
          Register Your School
        </Link>
      </div>
    )
  }

  if (variant === 'callout') {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--goya-primary)]">Register Your School on GOYA</p>
          <p className="text-sm text-[#6B7280] mt-1">
            List your school, manage designations, and connect with students.
          </p>
        </div>
        <Link
          href="/schools/create"
          className="flex items-center gap-1.5 whitespace-nowrap bg-[var(--goya-primary)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#2a4d6e] transition-colors"
        >
          Register Your School
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    )
  }

  // banner
  return (
    <div className="bg-[var(--goya-primary)] rounded-xl p-6 text-white">
      <h3 className="text-lg font-bold mb-1">Own a Yoga School?</h3>
      <p className="text-sm opacity-90 mb-4">
        List your school on GOYA, manage designations, and connect with students.
      </p>
      <Link
        href="/schools/create"
        className="inline-flex items-center gap-1.5 bg-white text-primary-dark font-semibold text-sm px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        Register Your School
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
      </Link>
    </div>
  )
}
