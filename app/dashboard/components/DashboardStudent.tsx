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
  teachers,
  events,
  courses,
}: DashboardProps) {
  const firstName = profile.full_name?.trim().split(' ')[0] || 'there'

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
        <div className="py-10 space-y-16">

          {/* Teachers — discovery */}
          <HorizontalCarousel
            title="Find your perfect yoga guide"
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
            {teachers.length > 0
              ? teachers.map((t) => (
                  <TeacherCard
                    key={t.id}
                    teacher={t}
                  />
                ))
              : null}
          </HorizontalCarousel>

          {/* Courses — growth */}
          <HorizontalCarousel
            title="Keep practicing, keep growing"
            showAllHref="/academy"
            showAllLabel="Explore all courses"
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

          {/* Events — community */}
          <HorizontalCarousel
            title="Join the community"
            showAllHref="/events"
            showAllLabel="Browse events"
            emptyState={
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  No events yet — check back soon.{' '}
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
