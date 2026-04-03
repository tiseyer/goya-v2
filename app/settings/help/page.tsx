import Link from 'next/link'
import { getUserTickets, getUserRole } from './actions'
import { getAudiencesForRole } from '@/lib/docs/audiences'
import { getAllDocs } from '@/lib/docs'
import InlineChat from './InlineChat'

export const metadata = {
  title: 'Support — GOYA Settings',
}

const SECTION_INFO: Record<string, { label: string; description: string; color: string }> = {
  admin: { label: 'Admin', description: 'Platform administration guides', color: 'bg-purple-100 text-purple-700' },
  moderator: { label: 'Moderator', description: 'Content review and moderation', color: 'bg-blue-100 text-blue-700' },
  teacher: { label: 'Teacher', description: 'Teaching tools and course management', color: 'bg-emerald-100 text-emerald-700' },
  student: { label: 'Student', description: 'Getting started and platform guides', color: 'bg-amber-100 text-amber-700' },
  developer: { label: 'Developer', description: 'Technical documentation', color: 'bg-slate-100 text-slate-700' },
}

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: preloadedQuestion } = await searchParams;
  const [tickets, userRole] = await Promise.all([getUserTickets(), getUserRole()])
  const audiences = getAudiencesForRole(userRole)
  const allDocs = getAllDocs()

  // Filter docs to only those matching user's role
  const userDocs = allDocs.filter(doc =>
    doc.audience.some(a => audiences.includes(a))
  )

  // Group by section
  const sectionMap = new Map<string, typeof userDocs>()
  for (const doc of userDocs) {
    const pages = sectionMap.get(doc.section) || []
    pages.push(doc)
    sectionMap.set(doc.section, pages)
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-foreground">Support</h1>

      {/* Support Tickets Section */}
      <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">My Support Tickets</h2>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-[var(--goya-border)] p-8 flex items-center justify-center">
          <p className="text-sm text-foreground-secondary">No support tickets yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className="rounded-xl border border-[var(--goya-border)] p-4 bg-white flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {ticket.question_summary}
                </p>
                <p className="text-xs text-foreground-tertiary mt-1">
                  {new Date(ticket.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
          ))}
        </div>
      )}

      {/* Inline Chat Section */}
      <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Start a Conversation</h2>
      <InlineChat initialQuestion={preloadedQuestion} />

      {/* Help & Guides Section */}
      <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Help &amp; Guides</h2>
      <p className="text-sm text-foreground-secondary mb-4">
        Browse documentation relevant to your account.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from(sectionMap.entries()).map(([section, pages]) => {
          const info = SECTION_INFO[section]
          if (!info) return null
          const firstPage = pages[0]

          return (
            <Link
              key={section}
              href={`/settings/help/docs/${firstPage.slug}`}
              className="rounded-xl border border-[var(--goya-border)] p-5 bg-white hover:border-[var(--goya-primary)]/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${info.color}`}>
                  {info.label}
                </span>
                <span className="text-xs text-foreground-tertiary">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground group-hover:text-[var(--goya-primary)] transition-colors">
                {info.description}
              </p>
            </Link>
          )
        })}
      </div>

      {userDocs.length === 0 && (
        <div className="rounded-xl border border-[var(--goya-border)] p-8 flex items-center justify-center">
          <p className="text-sm text-foreground-secondary">No documentation available for your account type.</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: 'open' | 'in_progress' | 'resolved' }) {
  const config = {
    open: { label: 'Open', className: 'bg-amber-100 text-amber-700' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
    resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
  }

  const { label, className } = config[status]

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  )
}
