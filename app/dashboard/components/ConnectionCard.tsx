import Image from 'next/image'
import Link from 'next/link'
import Card from '@/app/components/ui/Card'
import type { AcceptedConnection } from '@/lib/dashboard/queries'

export interface ConnectionCardProps {
  connection: AcceptedConnection
}

function roleBadgeClass(role: string | null): string {
  switch (role) {
    case 'student':
      return 'bg-blue-100 text-blue-700'
    case 'teacher':
      return 'bg-emerald-100 text-emerald-700'
    case 'wellness_practitioner':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function roleLabel(role: string | null): string {
  if (!role) return 'Member'
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const { profile } = connection
  const initials = profile.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : '?'

  const href = `/directory/${profile.username ?? profile.id}`

  return (
    <Link href={href} className="block shrink-0 snap-start w-[280px]">
      <Card variant="default" padding="none" className="hover:shadow-md transition-shadow h-full">
        <div className="p-4 flex items-center gap-3">
          {/* Avatar */}
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? 'Connection'}
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
              {profile.full_name ?? 'Unknown'}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${roleBadgeClass(profile.role)}`}>
              {roleLabel(profile.role)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
