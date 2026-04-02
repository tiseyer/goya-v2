import Link from 'next/link';

interface FacultyGridProps {
  faculty: Array<{
    id: string;
    position: string | null;
    is_principal_trainer: boolean | null;
    profile: { id: string; full_name: string; avatar_url: string | null } | null;
  }>;
  schoolSlug: string | null;
  schoolId: string;
}

export default function FacultyGrid({ faculty, schoolSlug, schoolId }: FacultyGridProps) {
  const validFaculty = faculty.filter((f) => f.profile !== null);
  if (validFaculty.length === 0) return null;

  const displayFaculty = validFaculty.slice(0, 6);
  const hasMore = validFaculty.length > 6;
  const schoolHref = `/schools/${schoolSlug ?? schoolId}`;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
        Our Faculty
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {displayFaculty.map((member) => {
          const p = member.profile!;
          const initial = p.full_name[0]?.toUpperCase() ?? '?';

          return (
            <Link
              key={p.id}
              href={`/members/${p.id}`}
              className="flex flex-col items-center text-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 shrink-0 shadow-sm">
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-[#345c83]">
                    {initial}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{p.full_name}</p>
                {member.position && (
                  <p className="text-xs text-slate-500 mt-0.5">{member.position}</p>
                )}
                {member.is_principal_trainer && (
                  <span className="inline-block mt-1 rounded-full bg-[#4E87A0]/10 text-[#4E87A0] px-2 py-0.5 text-[10px] font-semibold">
                    Principal Trainer
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Link
            href={schoolHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#4E87A0] hover:text-[#3d6f87] transition-colors"
          >
            View all faculty
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
