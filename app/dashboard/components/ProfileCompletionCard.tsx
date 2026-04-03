import { Circle } from 'lucide-react'
import Card from '@/app/components/ui/Card'
import type { ProfileCompletionResult } from '@/lib/dashboard/profileCompletion'

interface ProfileCompletionCardProps {
  completion: ProfileCompletionResult
  className?: string
}

export function ProfileCompletionCard({ completion, className }: ProfileCompletionCardProps) {
  // Hidden at 100% completion
  if (completion.score >= 100) return null

  return (
    <Card variant="outlined" padding="lg" className={className}>
      <h3 className="text-lg font-bold text-slate-900">Complete your profile</h3>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-100 mt-3">
        <div
          className="h-1.5 rounded-full bg-[var(--goya-primary)] transition-[width] duration-500 ease-out"
          style={{ width: `${completion.score}%` }}
        />
      </div>
      <p className="text-sm font-medium text-[var(--color-primary-muted)] mt-1">{completion.score}% complete</p>

      {/* Checklist of missing fields */}
      {completion.missing.length > 0 && (
        <ul className="mt-4 space-y-2">
          {completion.missing.map((item) => (
            <li key={item.key}>
              <a
                href={item.href}
                className="flex items-center gap-2 text-sm text-[var(--goya-primary)] hover:underline"
              >
                <Circle size={14} className="text-slate-300 shrink-0" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default ProfileCompletionCard
