'use client'
import Link from 'next/link'
import PageContainer from '@/app/components/ui/PageContainer'
import { getTimeOfDay, StubSection } from './utils'
import type { SchoolProps } from './types'

export default function DashboardSchool({
  profile,
  school,
  faculty,
  events,
  courses,
  connections,
  completion,
}: SchoolProps) {
  const firstName = profile.full_name?.trim().split(' ')[0] || 'there'
  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Good {getTimeOfDay()}, {firstName}
              </h1>
              <p className="text-slate-500">{school.name} — School Dashboard</p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-primary-light hover:underline"
            >
              &larr; Back to Teacher View
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StubSection title="Upcoming Events" count={events.length} />
            <StubSection title="Courses" count={courses.length} />
            <StubSection title="Faculty Members" count={faculty.length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StubSection title="Connections" count={connections.length} />
            {completion.score < 100 && (
              <StubSection title="Profile Completion" count={completion.score} suffix="%" />
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
