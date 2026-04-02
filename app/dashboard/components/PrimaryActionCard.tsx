import Card from '@/app/components/ui/Card'

interface PrimaryActionCardProps {
  headline: string
  description?: string
  ctaLabel: string
  ctaHref: string
  className?: string
}

export function PrimaryActionCard({
  headline,
  description,
  ctaLabel,
  ctaHref,
  className,
}: PrimaryActionCardProps) {
  return (
    <Card variant="default" padding="lg" className={className}>
      <h3 className="text-lg font-bold text-slate-900">{headline}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      )}
      <a
        href={ctaHref}
        className="block mt-4 text-center py-2.5 px-4 rounded-xl bg-[var(--goya-primary)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
      >
        {ctaLabel}
      </a>
    </Card>
  )
}

export default PrimaryActionCard
