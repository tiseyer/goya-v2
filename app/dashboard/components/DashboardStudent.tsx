'use client'

import Link from 'next/link'
import PageContainer from '@/app/components/ui/PageContainer'
import Card from '@/app/components/ui/Card'
import PageHero from '@/app/components/PageHero'
import type { HeroContext } from '@/lib/hero-variables'
import { getTimeOfDay } from './utils'
import { HorizontalCarousel } from './HorizontalCarousel'
import { TeacherCard } from './TeacherCard'
import { CourseCard } from './CourseCard'
import { EventCard } from './EventCard'
import type { DashboardProps } from './types'

export default function DashboardStudent({
  profile,
  events,
  courses,
  connections,
}: DashboardProps) {
  const firstName = profile.full_name?.trim().split(' ')[0] || 'there'

  const teacherConnections = connections.filter(
    (c) => c.profile.role === 'teacher'
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        variant="dark"
        pill="Student"
        title={`Good ${getTimeOfDay()}, ${firstName}.`}
        subtitle="Ready to practice today?"
        pageSlug="dashboard"
        isAdmin={profile.role === 'admin'}
        heroContext={{ firstName, fullName: profile.full_name ?? '', role: profile.role ?? '' } as HeroContext}
      />
      <PageContainer>
        <div className="py-8 space-y-8">

          {/* 2. Teachers carousel */}
          <HorizontalCarousel
            title="Teachers that might suit you"
            showAllHref="/members?role=teacher"
            showAllLabel="Show all teachers"
            emptyState={
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  Discover yoga teachers in the GOYA community.{' '}
                  <Link href="/members?role=teacher" className="text-[var(--goya-primary)] hover:underline">
                    Browse teachers
                  </Link>
                </p>
              </Card>
            }
          >
            {teacherConnections.length > 0
              ? teacherConnections.map((c) => (
                  <TeacherCard
                    key={c.connectionId}
                    teacher={{
                      id: c.profile.id,
                      full_name: c.profile.full_name,
                      avatar_url: c.profile.avatar_url,
                      teaching_styles: null,
                      location: null,
                      username: c.profile.username,
                    }}
                  />
                ))
              : null}
          </HorizontalCarousel>

          {/* 3. Courses carousel */}
          <HorizontalCarousel
            title="Courses you might enjoy"
            showAllHref="/academy"
            showAllLabel="Show all courses"
            emptyState={
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  Browse courses from GOYA teachers.{' '}
                  <Link href="/academy" className="text-[var(--goya-primary)] hover:underline">
                    Explore courses
                  </Link>
                </p>
              </Card>
            }
          >
            {courses.length > 0
              ? courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              : null}
          </HorizontalCarousel>

          {/* 4. Events carousel */}
          <HorizontalCarousel
            title="Upcoming events"
            showAllHref="/events"
            showAllLabel="Show all events"
            emptyState={
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  No upcoming events yet — check back soon.{' '}
                  <Link href="/events" className="text-[var(--goya-primary)] hover:underline">
                    Browse events
                  </Link>
                </p>
              </Card>
            }
          >
            {events.length > 0
              ? events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              : null}
          </HorizontalCarousel>
        </div>
      </PageContainer>
    </div>
  )
}
