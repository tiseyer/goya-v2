'use client'

import Link from 'next/link'
import PageContainer from '@/app/components/ui/PageContainer'
import Card from '@/app/components/ui/Card'
import PageHero from '@/app/components/PageHero'
import type { HeroContext } from '@/lib/hero-variables'
import { FacultyCard } from './FacultyCard'
import { ProfileCompletionCard } from './ProfileCompletionCard'
import { PrimaryActionCard } from './PrimaryActionCard'
import { HorizontalCarousel } from './HorizontalCarousel'
import { CourseCard } from './CourseCard'
import { EventCard } from './EventCard'
import type { SchoolProps } from './types'

function KpiCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-[var(--color-primary-muted)] mt-1">{label}</p>
    </div>
  )
}

export default function DashboardSchool({
  profile,
  school,
  faculty,
  courses,
  events,
  connections,
  completion,
}: SchoolProps) {
  const schoolName = school.name || 'Your School'
  const facultySlug = school.slug ?? null
  const designationsHref = school.slug
    ? `/schools/${school.slug}/settings?section=designations`
    : '/dashboard'
  const facultySettingsHref = facultySlug
    ? `/schools/${facultySlug}/settings?section=faculty`
    : '/dashboard'

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        variant="dark"
        pill="School Owner"
        title={`Welcome, ${schoolName}.`}
        subtitle="Manage your school and students."
        pageSlug="dashboard"
        isAdmin={profile?.role === 'admin'}
        heroContext={{ firstName: schoolName, fullName: profile?.full_name ?? '', role: profile?.role ?? '' } as HeroContext}
      />
      <PageContainer>
        <div className="py-10 space-y-16">

          {/* School profile completion card */}
          {completion.score < 100 && (
            <div>
              <p className="text-sm text-slate-500 mb-4">
                Help students find and enroll in your school
              </p>
              <ProfileCompletionCard completion={completion} />
            </div>
          )}

          {/* KPI cards — school overview */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">School overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard value={faculty.length} label="Active Teachers" />
              <KpiCard value={connections.length} label="Connected Students" />
              <KpiCard value={courses.filter(c => c.created_by === profile?.id).length} label="Active Courses" />
              <KpiCard value="Soon" label="Monthly Revenue" />
            </div>
          </div>

          {/* School CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrimaryActionCard
              headline="Add workshops & courses"
              description="Help students discover your school's offerings"
              ctaLabel="Manage courses"
              ctaHref="/settings/my-courses"
            />
            <PrimaryActionCard
              headline="Manage your designations"
              description="Keep your school's certifications up to date"
              ctaLabel="View designations"
              ctaHref={designationsHref}
            />
          </div>

          {/* Faculty — horizontal list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Your faculty</h2>
              <Link
                href={facultySettingsHref}
                className="text-sm text-[var(--goya-primary)] hover:underline"
              >
                Manage faculty &rarr;
              </Link>
            </div>
            {faculty.length === 0 ? (
              <Card variant="flat" padding="lg" className="bg-[var(--color-surface-warm)]">
                <p className="text-sm text-slate-500">
                  No faculty members yet.{' '}
                  <Link href={facultySettingsHref} className="text-[var(--goya-primary)] hover:underline">
                    Add faculty
                  </Link>
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {faculty.slice(0, 8).map((f) => (
                  <div key={f.id} className="w-full [&>a]:w-full [&>a]:block [&>div]:w-full">
                    <FacultyCard faculty={f} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Courses carousel */}
          <HorizontalCarousel
            title="Active courses"
            showAllHref="/academy"
            showAllLabel="View all courses"
            emptyState={
              <Card variant="flat" padding="lg" className="bg-[var(--color-surface-warm)]">
                <p className="text-sm text-slate-500">
                  No courses yet.{' '}
                  <Link href="/settings/my-courses" className="text-[var(--goya-primary)] hover:underline">
                    Add your first course
                  </Link>
                </p>
              </Card>
            }
          >
            {courses.length > 0
              ? courses.map((course) => <CourseCard key={course.id} course={course} />)
              : null}
          </HorizontalCarousel>

          {/* Events carousel */}
          <HorizontalCarousel
            className="bg-surface-warm rounded-2xl p-6 -mx-2"
            title="Upcoming events"
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
              ? events.map((event) => <EventCard key={event.id} event={event} />)
              : null}
          </HorizontalCarousel>
        </div>
      </PageContainer>
    </div>
  )
}
