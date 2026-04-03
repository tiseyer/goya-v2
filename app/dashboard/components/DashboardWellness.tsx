'use client'

import PageContainer from '@/app/components/ui/PageContainer'
import Card from '@/app/components/ui/Card'
import PageHero from '@/app/components/PageHero'
import type { HeroContext } from '@/lib/hero-variables'
import { getTimeOfDay } from './utils'
import { ProfileCompletionCard } from './ProfileCompletionCard'
import { PrimaryActionCard } from './PrimaryActionCard'
import { HorizontalCarousel } from './HorizontalCarousel'
import { TeacherCard } from './TeacherCard'
import { CourseCard } from './CourseCard'
import { EventCard } from './EventCard'
import type { DashboardProps } from './types'
import Link from 'next/link'

export default function DashboardWellness({
  profile,
  teachers,
  events,
  courses,
  completion,
}: DashboardProps) {
  const firstName = profile.full_name?.trim().split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        variant="dark"
        pill="Wellness Practitioner"
        title={`Good ${getTimeOfDay()}, ${firstName}.`}
        subtitle="Ready to support your clients?"
        pageSlug="dashboard"
        isAdmin={profile.role === 'admin'}
        heroContext={{ firstName, fullName: profile.full_name ?? '', role: profile.role ?? '' } as HeroContext}
      />
      <PageContainer>
        <div className="py-10 space-y-16">

          {/* Profile completion nudge (hidden at 100%) */}
          <ProfileCompletionCard completion={completion} />

          {/* CTA cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrimaryActionCard
              headline="Share your next event"
              description="Reach clients looking for wellness sessions"
              ctaLabel="Create event"
              ctaHref="/settings/my-events"
            />
            <PrimaryActionCard
              headline="Add a course or session"
              description="Expand your wellness expertise"
              ctaLabel="Add course"
              ctaHref="/settings/my-courses"
            />
          </div>

          {/* Courses — growth */}
          <HorizontalCarousel
            title="Expand your wellness expertise"
            showAllHref="/academy"
            showAllLabel="Explore all courses"
            emptyState={
              <Card variant="flat" padding="lg" className="bg-[var(--color-surface-warm)]">
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

          {/* Events — wellness & healing */}
          <HorizontalCarousel
            className="bg-surface-warm rounded-2xl p-6 -mx-2"
            title="Wellness & healing events"
            showAllHref="/events"
            showAllLabel="Browse events"
            emptyState={
              <Card variant="flat" padding="lg" className="bg-[var(--color-surface-warm)]">
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
              ? events.map((e) => <EventCard key={e.id} event={e} />)
              : null}
          </HorizontalCarousel>

          {/* Teachers — community */}
          <HorizontalCarousel
            title="Connect with teachers"
            showAllHref="/members?role=teacher"
            showAllLabel="Browse teachers"
            emptyState={
              <Card variant="flat" padding="lg" className="bg-[var(--color-surface-warm)]">
                <p className="text-sm text-slate-500">
                  Discover yoga teachers in the community.{' '}
                  <Link href="/members?role=teacher" className="text-[var(--goya-primary)] hover:underline">
                    Browse teachers
                  </Link>
                </p>
              </Card>
            }
          >
            {teachers.length > 0
              ? teachers.map((t) => <TeacherCard key={t.id} teacher={t} />)
              : null}
          </HorizontalCarousel>
        </div>
      </PageContainer>
    </div>
  )
}
