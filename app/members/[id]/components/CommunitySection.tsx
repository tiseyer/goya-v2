interface CommunitySectionProps {
  studentCount: number;
  students: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
  }>;
}

export default function CommunitySection({ studentCount, students }: CommunitySectionProps) {
  if (studentCount === 0) return null;

  const displayStudents = students.slice(0, 5);
  const label = studentCount === 1 ? '1 enrolled student' : `${studentCount} enrolled students`;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
        Our Community
      </h2>

      <p className="text-sm text-slate-600 mb-4">{label}</p>

      {displayStudents.length > 0 && (
        <div className="flex items-center">
          {displayStudents.map((student, index) => {
            const initial = student.full_name[0]?.toUpperCase() ?? '?';
            return (
              <div
                key={student.id}
                title={student.full_name}
                className={`w-8 h-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 shrink-0 ${index > 0 ? '-ml-2' : ''}`}
              >
                {student.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.avatar_url}
                    alt={student.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-[var(--goya-primary)]">
                    {initial}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
