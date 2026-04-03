import Link from 'next/link'
import Image from 'next/image'
import Card from '@/app/components/ui/Card'
import type { CourseRow } from '@/lib/dashboard/queries'

export interface CourseCardProps {
  course: CourseRow
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function CourseCard({ course }: CourseCardProps) {
  const duration = formatDuration(course.duration_minutes)
  const category = course.course_categories
  const href = `/academy/${course.id}`

  return (
    <Link href={href} className="block shrink-0 snap-start w-[280px]">
      <Card
        variant="default"
        padding="none"
        className="hover:shadow-md transition-shadow overflow-hidden"
      >
        {/* Image area */}
        <div className="relative h-36 w-full bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
          {course.image_url ? (
            <Image
              src={course.image_url}
              alt={course.title}
              fill
              sizes="280px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--goya-primary-100,#d6e7f1)] to-[var(--goya-primary-200,#b0cfe8)]">
              {/* Placeholder icon */}
              <svg
                className="w-10 h-10 text-[var(--goya-primary,#6E88B0)] opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          {/* Category badge */}
          {category && (
            <span
              className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: category.color ? `${category.color}22` : '#e2e8f0',
                color: category.color ?? '#475569',
              }}
            >
              {category.name}
            </span>
          )}

          {/* Title */}
          <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
            {course.title}
          </p>

          {/* Duration */}
          {duration && (
            <p className="text-xs text-slate-400">{duration}</p>
          )}
        </div>
      </Card>
    </Link>
  )
}

export default CourseCard
