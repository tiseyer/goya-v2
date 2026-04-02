'use client'
import Link from 'next/link'
import PageContainer from '@/app/components/ui/PageContainer'
import { getTimeOfDay, StubSection } from './utils'
import type { TeacherProps } from './types'

export default function DashboardTeacher({
  profile,
  events,
  courses,
  connections,
  completion,
  isSchoolOwner,
}: TeacherProps) {
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
              <p className="text-slate-500">Your teacher dashboard</p>
            </div>
            {isSchoolOwner && (
              <Link
                href="/dashboard?view=school"
                className="text-sm font-semibold text-primary-light hover:underline"
              >
                View as School &rarr;
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StubSection title="Upcoming Events" count={events.length} />
            <StubSection title="Courses" count={courses.length} />
            <StubSection title="Connections" count={connections.length} />
          </div>
          {completion.score < 100 && (
            <StubSection title="Profile Completion" count={completion.score} suffix="%" />
          )}
        </div>
      </PageContainer>
    </div>
  )
}
