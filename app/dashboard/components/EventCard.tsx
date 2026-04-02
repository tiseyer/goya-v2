import Link from 'next/link'
import Card from '@/app/components/ui/Card'
import type { EventRow } from '@/lib/dashboard/queries'

export interface EventCardProps {
  event: EventRow
}

export function EventCard({ event }: EventCardProps) {
  const dateObj = new Date(event.date)
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = dateObj.getDate()

  let formatBadge: { label: string; className: string }
  if (event.is_online) {
    formatBadge = { label: 'Online', className: 'bg-blue-50 text-blue-600' }
  } else if (event.format === 'hybrid') {
    formatBadge = { label: 'Hybrid', className: 'bg-purple-50 text-purple-600' }
  } else {
    formatBadge = { label: 'In Person', className: 'bg-green-50 text-green-600' }
  }

  const href = `/events/${event.slug ?? event.id}`

  return (
    <Link href={href} className="block shrink-0 snap-start w-[280px]">
      <Card variant="default" padding="none" className="hover:shadow-md transition-shadow flex flex-row overflow-hidden h-full">
        {/* Date badge */}
        <div className="flex flex-col items-center justify-center w-16 shrink-0 bg-slate-50 rounded-l-2xl p-3">
          <span className="text-xs font-bold text-[var(--goya-primary)]">{month}</span>
          <span className="text-2xl font-bold text-slate-900 leading-none mt-0.5">{day}</span>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 p-4">
          {/* Title */}
          <p className="text-sm font-semibold text-slate-900 line-clamp-2">
            {event.title}
          </p>

          {/* Format badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${formatBadge.className}`}>
            {formatBadge.label}
          </span>

          {/* Location (if not online) */}
          {!event.is_online && event.location && (
            <p className="text-xs text-slate-400 mt-1 truncate">{event.location}</p>
          )}
        </div>
      </Card>
    </Link>
  )
}
