import Link from 'next/link';

interface SchoolAffiliationProps {
  school: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
  };
  faculty: Array<{
    id: string;
    position: string | null;
    is_principal_trainer: boolean | null;
    profile: { id: string; full_name: string; avatar_url: string | null } | null;
  }>;
}

export default function SchoolAffiliation({ school, faculty }: SchoolAffiliationProps) {
  const schoolHref = `/schools/${school.slug ?? school.id}`;
  const displayFaculty = faculty.filter((f) => f.profile !== null).slice(0, 4);
  const extraCount = faculty.filter((f) => f.profile !== null).length - displayFaculty.length;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
        School Affiliation
      </h2>

      {/* School card */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#4E87A0]/10 flex items-center justify-center overflow-hidden shrink-0">
          {school.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-[#4E87A0]">
              {school.name[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        <p className="font-semibold text-slate-800 text-sm leading-tight">{school.name}</p>
      </div>

      {/* Visit school profile link */}
      <Link
        href={schoolHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#4E87A0] hover:text-[#3d6f87] transition-colors"
      >
        Visit school profile
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Faculty sub-section */}
      {displayFaculty.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-700 mb-3">Faculty</p>
          <div className="flex items-center gap-2">
            {displayFaculty.map((member) => {
              const p = member.profile!;
              const initial = p.full_name[0]?.toUpperCase() ?? '?';
              return (
                <Link
                  key={p.id}
                  href={`/members/${p.id}`}
                  title={p.full_name}
                  className="block w-8 h-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 shrink-0 hover:ring-[#4E87A0] transition-all"
                >
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-[#345c83]">
                      {initial}
                    </span>
                  )}
                </Link>
              );
            })}
            {extraCount > 0 && (
              <Link
                href={schoolHref}
                className="text-xs text-slate-500 hover:text-[#4E87A0] transition-colors ml-1"
              >
                +{extraCount} more
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
