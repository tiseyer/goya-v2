'use client'

import Link from 'next/link'
import PageContainer from '@/app/components/ui/PageContainer'
import Card from '@/app/components/ui/Card'
import { DashboardGreeting } from './DashboardGreeting'
import { ProfileCompletionCard } from './ProfileCompletionCard'
import { StatHero } from './StatHero'
import { PrimaryActionCard } from './PrimaryActionCard'
import { ConnectionCard } from './ConnectionCard'
import type { TeacherProps } from './types'

export default function DashboardTeacher({
  profile,
  connections,
  completion,
  isSchoolOwner,
}: TeacherProps) {
  const firstName = profile.full_name?.trim().split(' ')[0] || 'there'
  const recentConnections = connections.slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="py-8 space-y-8">
          {/* 1. Greeting with Teacher badge */}
          <DashboardGreeting
            firstName={firstName}
            role="teacher"
            subtitle="Welcome back."
          />

          {/* 2. Profile completion nudge (auto-hides at 100%) */}
          <ProfileCompletionCard completion={completion} />

          {/* 4. Stat hero — profile views (placeholder) */}
          <Card variant="flat" padding="lg">
            <StatHero
              label="people viewed your profile this week"
              value={null}
            />
          </Card>

          {/* 5. Primary CTA cards — side by side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrimaryActionCard
              headline="Share your next event"
              description="Reach students looking for workshops and retreats"
              ctaLabel="Create event"
              ctaHref="/settings/my-events"
            />
            <PrimaryActionCard
              headline="Add a course link"
              description="Share your teachings with the GOYA community"
              ctaLabel="Add course"
              ctaHref="/settings/my-courses"
            />
          </div>

          {/* 6. Recent connections list — max 3 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent connections</h2>
              <Link
                href="/settings/connections"
                className="text-sm text-[var(--goya-primary)] hover:underline"
              >
                View all connections
              </Link>
            </div>

            {recentConnections.length === 0 ? (
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  No connections yet.{' '}
                  <Link href="/members" className="text-[var(--goya-primary)] hover:underline">
                    Find teachers and students
                  </Link>
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {recentConnections.map((c) => (
                  <div key={c.connectionId} className="w-full [&>a]:w-full [&>a]:block">
                    <ConnectionCard connection={c} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </PageContainer>
    </div>
  )
}
