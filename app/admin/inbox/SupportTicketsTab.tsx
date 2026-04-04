'use client'

import { useState } from 'react'
import { Ticket, Bot } from 'lucide-react'
import type { SupportTicket, TicketStatus, ChatMessage } from '@/lib/chatbot/types'
import { listSupportTickets, updateTicketStatus } from './actions'
import { getConversationMessages } from '../chatbot/chatbot-actions'
import TicketViewer from './TicketViewer'

interface Props {
  initialTickets: SupportTicket[]
  adminUserId: string
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-amber-50 text-amber-700 border border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  resolved: 'bg-green-50 text-green-700 border border-green-200',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

const NEXT_STATUS: Record<TicketStatus, TicketStatus> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'open',
}

type FilterOption = TicketStatus | 'all'
type SourceFilter = 'all' | 'human_escalation' | 'unanswered_question'

export default function SupportTicketsTab({ initialTickets, adminUserId }: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets)
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  async function refreshTickets(newStatusFilter: FilterOption, newSourceFilter: SourceFilter) {
    setLoading(true)
    const result = await listSupportTickets(
      newStatusFilter === 'all' ? undefined : newStatusFilter,
      newSourceFilter === 'all' ? undefined : newSourceFilter,
    )
    if (result.success) {
      setTickets(result.tickets)
    }
    setLoading(false)
  }

  async function handleStatusFilterChange(newFilter: FilterOption) {
    setStatusFilter(newFilter)
    await refreshTickets(newFilter, sourceFilter)
  }

  async function handleSourceFilterChange(newSource: SourceFilter) {
    setSourceFilter(newSource)
    await refreshTickets(statusFilter, newSource)
  }

  async function handleView(ticket: SupportTicket) {
    setLoading(true)
    if (ticket.session_id) {
      const result = await getConversationMessages(ticket.session_id)
      if (result.success) {
        setMessages(result.messages)
      } else {
        setMessages([])
      }
    } else {
      setMessages([])
    }
    setSelectedTicket(ticket)
    setLoading(false)
  }

  async function handleStatusCycle(ticket: SupportTicket) {
    setBusy(ticket.id)
    const nextStatus = NEXT_STATUS[ticket.status]
    const result = await updateTicketStatus(ticket.id, nextStatus, adminUserId)
    if (result.success) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: nextStatus } : t))
      )
      // Update selectedTicket if it's the one being changed
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket((prev) => prev ? { ...prev, status: nextStatus } : null)
      }
    }
    setBusy(null)
  }

  function handleBack() {
    setSelectedTicket(null)
    setMessages([])
  }

  function handleStatusChange(updated: SupportTicket) {
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    )
    setSelectedTicket(updated)
  }

  if (selectedTicket) {
    return (
      <TicketViewer
        ticket={selectedTicket}
        messages={messages}
        adminUserId={adminUserId}
        onBack={handleBack}
        onStatusChange={handleStatusChange}
      />
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as FilterOption)}
          className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B5A3] bg-white text-[#374151]"
        >
          <option value="all">All Tickets</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => handleSourceFilterChange(e.target.value as SourceFilter)}
          className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B5A3] bg-white text-[#374151]"
        >
          <option value="all">All Sources</option>
          <option value="human_escalation">User submitted</option>
          <option value="unanswered_question">Chatbot escalated</option>
        </select>
        {loading && <span className="text-sm text-slate-400">Loading...</span>}
      </div>

      {/* Empty state */}
      {tickets.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ticket size={40} className="text-[#9CA3AF]" />
          <h3 className="text-base font-semibold text-[#1B3A5C] mt-4">No support tickets</h3>
          <p className="text-sm text-[#6B7280] mt-2">
            Escalated conversations will create tickets that appear here.
          </p>
        </div>
      )}

      {/* Table */}
      {tickets.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-widest text-[#6B7280] border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Issue</th>
                  <th className="text-left px-5 py-3">Created</th>
                  <th className="text-left px-5 py-3">Source</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {tickets.map((ticket) => {
                  const displayName = ticket.user_name
                    ? ticket.user_name
                    : ticket.anonymous_id
                    ? `Guest #${ticket.anonymous_id.slice(0, 8)}`
                    : 'Unknown'
                  const isBusy = busy === ticket.id

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-[#1B3A5C]">{displayName}</div>
                        {ticket.user_email && (
                          <div className="text-xs text-slate-400 mt-0.5">{ticket.user_email}</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-slate-600">
                          {ticket.question_summary.length > 80
                            ? `${ticket.question_summary.slice(0, 80)}…`
                            : ticket.question_summary}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500">
                        {relativeDate(ticket.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        {ticket.ticket_type === 'unanswered_question' ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Bot size={11} />
                            Chatbot
                          </span>
                        ) : (
                          <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[ticket.status]}`}
                        >
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleView(ticket)}
                            disabled={loading}
                            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleStatusCycle(ticket)}
                            disabled={isBusy || loading}
                            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            {isBusy ? '…' : `→ ${STATUS_LABELS[NEXT_STATUS[ticket.status]]}`}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
