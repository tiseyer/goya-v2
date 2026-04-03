'use client'

import Link from 'next/link'
import PageContainer from '@/app/components/ui/PageContainer'
import Card from '@/app/components/ui/Card'
import PageHero from '@/app/components/PageHero'
import type { HeroContext } from '@/lib/hero-variables'
import { FacultyCard } from './FacultyCard'
import { ConnectionCard } from './ConnectionCard'
import { ProfileCompletionCard } from './ProfileCompletionCard'
import { StatHero } from './StatHero'
import { PrimaryActionCard } from './PrimaryActionCard'
import type { SchoolProps } from './types'

export default function DashboardSchool({
  profile,
  school,
  faculty,
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
        <div className="py-8 space-y-8">

          {/* 2. School profile completion card */}
          {completion.score < 100 && (
            <div>
              <p className="text-sm text-slate-500 -mb-4">
                Help students find and enroll in your school
              </p>
              <div className="mt-8">
                <ProfileCompletionCard completion={completion} />
              </div>
            </div>
          )}

          {/* 4. Stat hero — school discovery */}
          <Card variant="flat" padding="lg">
            <StatHero
              label="students discovered your school this week"
              value={null}
            />
          </Card>

          {/* 5. School CTAs */}
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

          {/* 6. Faculty list — max 5 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Faculty</h2>
              <Link
                href={facultySettingsHref}
                className="text-sm text-[var(--goya-primary)] hover:underline"
              >
                Manage faculty &rarr;
              </Link>
            </div>
            {faculty.length === 0 ? (
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  No faculty members yet.{' '}
                  <Link
                    href={facultySettingsHref}
                    className="text-[var(--goya-primary)] hover:underline"
                  >
                    Add faculty
                  </Link>
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {faculty.slice(0, 5).map((f) => (
                  <div
                    key={f.id}
                    className="w-full [&>a]:w-full [&>a]:block [&>div]:w-full"
                  >
                    <FacultyCard faculty={f} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Enrolled students / community list — max 5 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Students</h2>
              <Link
                href="/members"
                className="text-sm text-[var(--goya-primary)] hover:underline"
              >
                View all &rarr;
              </Link>
            </div>
            {connections.length === 0 ? (
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  No enrolled students yet.{' '}
                  <Link href="/members" className="text-[var(--goya-primary)] hover:underline">
                    Browse the directory
                  </Link>
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {connections.slice(0, 5).map((c) => (
                  <div
                    key={c.connectionId}
                    className="w-full [&>a]:w-full [&>a]:block [&>div]:w-full"
                  >
                    <ConnectionCard connection={c} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </PageContainer>
    </div>
  )
}
