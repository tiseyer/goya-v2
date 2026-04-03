import Image from 'next/image'
import Link from 'next/link'
import Card from '@/app/components/ui/Card'
import type { FacultyRow } from '@/lib/dashboard/queries'

export interface FacultyCardProps {
  faculty: FacultyRow
}

export function FacultyCard({ faculty }: FacultyCardProps) {
  const { profile } = faculty
  const initials = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : '?'

  const cardContent = (
    <Card variant="default" padding="none" className="hover:shadow-md transition-shadow h-full">
      <div className="p-4 flex items-center gap-3">
        {/* Avatar */}
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.full_name ?? 'Faculty member'}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover bg-slate-100 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-slate-400">{initials}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {profile?.full_name ?? 'Faculty Member'}
          </p>

          {profile ? (
            <>
              <p className="text-xs text-[var(--color-primary-muted)] mt-0.5 truncate">
                {faculty.position ?? 'Faculty Member'}
              </p>
              {faculty.is_principal_trainer && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                  Principal Trainer
                </span>
              )}
            </>
          ) : (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1 inline-block">
              Invited
            </span>
          )}
        </div>
      </div>
    </Card>
  )

  if (!profile) {
    return (
      <div className="shrink-0 snap-start w-[280px]">
        {cardContent}
      </div>
    )
  }

  return (
    <Link href={`/directory/${profile.id}`} className="block shrink-0 snap-start w-[280px]">
      {cardContent}
    </Link>
  )
}
