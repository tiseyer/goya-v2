import Image from 'next/image'
import Link from 'next/link'
import Card from '@/app/components/ui/Card'

export interface TeacherCardProps {
  teacher: {
    id: string
    full_name: string | null
    avatar_url: string | null
    teaching_styles: string[] | null
    location: string | null
    username: string | null
  }
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const initials = teacher.full_name
    ? teacher.full_name.charAt(0).toUpperCase()
    : '?'

  const styles = teacher.teaching_styles ?? []
  const visibleStyles = styles.slice(0, 3)
  const extraCount = styles.length - 3

  return (
    <Link href={`/directory/${teacher.username ?? teacher.id}`} className="block shrink-0 snap-start w-[280px]">
      <Card variant="default" padding="none" className="hover:shadow-md transition-shadow h-full">
        <div className="p-4">
          {teacher.avatar_url ? (
            <Image
              src={teacher.avatar_url}
              alt={teacher.full_name ?? 'Teacher'}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover bg-slate-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-400">{initials}</span>
            </div>
          )}

          <p className="text-sm font-semibold text-slate-900 mt-3 truncate">
            {teacher.full_name ?? 'Unknown Teacher'}
          </p>

          {visibleStyles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {visibleStyles.map((style) => (
                <span
                  key={style}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {style}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  +{extraCount} more
                </span>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-2">
            {teacher.location ?? 'Online'}
          </p>
        </div>
      </Card>
    </Link>
  )
}
