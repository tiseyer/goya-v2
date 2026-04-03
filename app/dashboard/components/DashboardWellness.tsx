'use client'

import PageContainer from '@/app/components/ui/PageContainer'
import Card from '@/app/components/ui/Card'
import PageHero from '@/app/components/PageHero'
import type { HeroContext } from '@/lib/hero-variables'
import { getTimeOfDay } from './utils'
import { ProfileCompletionCard } from './ProfileCompletionCard'
import { StatHero } from './StatHero'
import { PrimaryActionCard } from './PrimaryActionCard'
import { HorizontalCarousel } from './HorizontalCarousel'
import { ConnectionCard } from './ConnectionCard'
import { EventCard } from './EventCard'
import type { DashboardProps } from './types'
import Link from 'next/link'

export default function DashboardWellness({
  profile,
  events,
  connections,
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
        isAdmin={profile.role === 'admin' || profile.role === 'superuser'}
        heroContext={{ firstName, fullName: profile.full_name ?? '', role: profile.role ?? '' } as HeroContext}
      />
      <PageContainer>
        <div className="py-8 space-y-8">

          {/* 2. Profile completion nudge (hidden at 100%) */}
          <ProfileCompletionCard completion={completion} />

          {/* 3. Stat hero — profile views */}
          <Card variant="flat" padding="lg">
            <StatHero
              label="people viewed your profile this week"
              value={null}
            />
          </Card>

          {/* 4. Primary CTA cards — side by side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrimaryActionCard
              headline="Share your next event"
              description="Reach students looking for workshops and retreats"
              ctaLabel="Create event"
              ctaHref="/settings/my-events"
            />
            <PrimaryActionCard
              headline="Add a course or session"
              description="Share your teachings with the GOYA community"
              ctaLabel="Add course"
              ctaHref="/settings/my-courses"
            />
          </div>

          {/* 5. Suggested connections carousel */}
          <HorizontalCarousel
            title="Teachers and schools near you"
            showAllHref="/members"
            showAllLabel="Explore directory"
            emptyState={
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  Connect with teachers and schools in the GOYA community.{' '}
                  <Link href="/members" className="text-[var(--goya-primary)] hover:underline">
                    Browse the directory
                  </Link>
                </p>
              </Card>
            }
          >
            {connections.map((c) => (
              <ConnectionCard key={c.connectionId} connection={c} />
            ))}
          </HorizontalCarousel>

          {/* 6. Upcoming events carousel */}
          <HorizontalCarousel
            title="Upcoming events"
            showAllHref="/events"
            showAllLabel="Show all events"
            emptyState={
              <Card variant="flat" padding="lg">
                <p className="text-sm text-slate-500">
                  No upcoming events yet.{' '}
                  <Link href="/events" className="text-[var(--goya-primary)] hover:underline">
                    Browse all events
                  </Link>
                </p>
              </Card>
            }
          >
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </HorizontalCarousel>
        </div>
      </PageContainer>
    </div>
  )
}
