'use client'

import Link from 'next/link'
import PageContainer from '@/app/components/ui/PageContainer'
import Card from '@/app/components/ui/Card'
import PageHero from '@/app/components/PageHero'
import type { HeroContext } from '@/lib/hero-variables'
import { getTimeOfDay } from './utils'
import { ProfileCompletionCard } from './ProfileCompletionCard'
import { PrimaryActionCard } from './PrimaryActionCard'
import { HorizontalCarousel } from './HorizontalCarousel'
import { CourseCard } from './CourseCard'
import { EventCard } from './EventCard'
import { ConnectionCard } from './ConnectionCard'
import type { TeacherProps } from './types'

export default function DashboardTeacher({
  profile,
  courses,
  events,
  connections,
  completion,
  isSchoolOwner,
}: TeacherProps) {
  const firstName = profile.full_name?.trim().split(' ')[0] || 'there'
  const recentConnections = connections.slice(0, 6)

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        variant="dark"
        pill="Teacher"
        title={`Good ${getTimeOfDay()}, ${firstName}.`}
        subtitle="What will you teach today?"
        pageSlug="dashboard"
        isAdmin={profile.role === 'admin'}
        heroContext={{ firstName, fullName: profile.full_name ?? '', role: profile.role ?? '' } as HeroContext}
      />
      <PageContainer>
        <div className="py-10 space-y-16">

          {/* Profile completion nudge (auto-hides at 100%) */}
          <ProfileCompletionCard completion={completion} />

          {/* CTA cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrimaryActionCard
              headline="Share your next event"
              description="Reach students looking for workshops and retreats"
              ctaLabel="Create event"
              ctaHref="/settings/my-events"
            />
            <PrimaryActionCard
              headline={isSchoolOwner ? "Add a school course" : "Add a course"}
              description="Level up your craft and grow your business"
              ctaLabel="Add course"
              ctaHref="/settings/my-courses"
            />
          </div>

          {/* Courses — growth */}
          <HorizontalCarousel
            title="Level up your craft"
            showAllHref="/academy"
            showAllLabel="Explore all courses"
            emptyState={
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  Courses from the GOYA community.{' '}
                  <Link href="/academy" className="text-[var(--goya-primary)] hover:underline">
                    Explore courses
                  </Link>
                </p>
              </Card>
            }
          >
            {courses.length > 0
              ? courses.map((course) => <CourseCard key={course.id} course={course} />)
              : null}
          </HorizontalCarousel>

          {/* Events — connect */}
          <HorizontalCarousel
            title="Connect, collaborate, grow"
            showAllHref="/events"
            showAllLabel="Browse events"
            emptyState={
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  No events yet.{' '}
                  <Link href="/events" className="text-[var(--goya-primary)] hover:underline">
                    Browse events
                  </Link>
                </p>
              </Card>
            }
          >
            {events.length > 0
              ? events.map((event) => <EventCard key={event.id} event={event} />)
              : null}
          </HorizontalCarousel>

          {/* Community — connections */}
          {recentConnections.length > 0 && (
            <HorizontalCarousel
              title="Your community"
              showAllHref="/settings/connections"
              showAllLabel="View all connections"
            >
              {recentConnections.map((c) => (
                <ConnectionCard key={c.connectionId} connection={c} />
              ))}
            </HorizontalCarousel>
          )}
        </div>
      </PageContainer>
    </div>
  )
}
