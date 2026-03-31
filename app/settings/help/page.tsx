import { getUserTickets } from './actions'
import InlineChat from './InlineChat'

export const metadata = {
  title: 'Support — GOYA Settings',
}

export default async function HelpPage() {
  const tickets = await getUserTickets()

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
      <InlineChat />
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
