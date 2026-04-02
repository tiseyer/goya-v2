'use client'

import { type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'

interface HorizontalCarouselProps {
  title: string
  showAllHref?: string
  showAllLabel?: string
  children?: ReactNode
  emptyState?: ReactNode
  loading?: boolean
  className?: string
}

export function HorizontalCarousel({
  title,
  showAllHref,
  showAllLabel = 'Show all',
  children,
  emptyState,
  loading = false,
  className,
}: HorizontalCarouselProps) {
  const [emblaRef] = useEmblaCarousel({ dragFree: true, containScroll: 'trimSnaps' })

  const hasChildren = Boolean(children) && (Array.isArray(children) ? children.length > 0 : true)

  return (
    <section className={`space-y-4 ${className ?? ''}`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {showAllHref && (
          <Link
            href={showAllHref}
            className="text-sm text-[var(--goya-primary)] hover:underline"
          >
            {showAllLabel} &rarr;
          </Link>
        )}
      </div>

      {/* Content area */}
      {loading ? (
        /* Skeleton state */
        <div className="flex gap-4 overflow-hidden pb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[280px] h-48 bg-slate-100 rounded-2xl animate-pulse shrink-0 snap-start"
            />
          ))}
        </div>
      ) : !hasChildren && emptyState ? (
        /* Empty state */
        <div className="w-full">{emptyState}</div>
      ) : (
        /* Carousel track */
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar scroll-smooth pb-2">
            {children}
          </div>
        </div>
      )}
    </section>
  )
}

export default HorizontalCarousel
