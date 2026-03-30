'use client'

import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import type { SupportTicket, TicketStatus, ChatMessage } from '@/lib/chatbot/types'
import { updateTicketStatus, replyToTicket } from './actions'

interface Props {
  ticket: SupportTicket
  messages: ChatMessage[]
  adminUserId: string
  onBack: () => void
  onStatusChange: (ticket: SupportTicket) => void
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TicketViewer({ ticket, messages: initialMessages, adminUserId, onBack, onStatusChange }: Props) {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(initialMessages)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)

  const STATUS_SEQUENCE: TicketStatus[] = ['open', 'in_progress', 'resolved']

  async function handleStatusChange(newStatus: TicketStatus) {
    setStatusBusy(true)
    const result = await updateTicketStatus(ticket.id, newStatus, adminUserId)
    if (result.success) {
      onStatusChange({ ...ticket, status: newStatus })
    }
    setStatusBusy(false)
  }

  async function handleSend() {
    const trimmed = replyContent.trim()
    if (!trimmed || !ticket.session_id) return

    setSending(true)
    setSendError(null)

    const result = await replyToTicket(ticket.id, ticket.session_id, trimmed, adminUserId)

    if (result.success) {
      // Add the reply to the local messages list as an assistant message
      const newMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        session_id: ticket.session_id,
        role: 'assistant',
        content: trimmed,
        created_at: new Date().toISOString(),
      }
      setLocalMessages((prev) => [...prev, newMessage])
      setReplyContent('')
    } else {
      setSendError(result.error)
    }

    setSending(false)
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E5E7EB] bg-slate-50">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
            aria-label="Back to tickets"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#1B3A5C] truncate">
              Ticket: {ticket.question_summary}
            </h3>
          </div>
          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${STATUS_STYLES[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>

        {/* Status toggle buttons */}
        <div className="flex items-center gap-2 ml-10">
          <span className="text-xs text-slate-400">Set status:</span>
          {STATUS_SEQUENCE.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={statusBusy || ticket.status === s}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 ${
                ticket.status === s
                  ? `${STATUS_STYLES[s]} opacity-70 cursor-default`
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="p-5 space-y-3 max-h-[480px] overflow-y-auto">
        {localMessages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No conversation history available.</p>
        )}
        {localMessages
          .filter((m) => m.role !== 'system')
          .map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
              >
                {!isUser && (
                  <span className="text-xs font-semibold text-slate-500 ml-1">Mattea / Support</span>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-xl text-sm ${
                    isUser
                      ? 'bg-slate-100 rounded-br-sm text-[#374151]'
                      : 'bg-white border border-slate-200 rounded-tl-sm text-[#374151]'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
              </div>
            )
          })}
      </div>

      {/* Reply section */}
      {ticket.session_id ? (
        <div className="px-5 py-4 border-t border-[#E5E7EB] bg-slate-50">
          {sendError && (
            <p className="text-xs text-rose-600 mb-2">{sendError}</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
              rows={3}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="flex-1 text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B5A3] bg-white text-[#374151] placeholder-[#9CA3AF] resize-none disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={sending || !replyContent.trim()}
              className="p-2.5 rounded-lg bg-[#00B5A3] text-white hover:bg-[#009d8d] transition-colors disabled:opacity-40 flex-shrink-0"
              aria-label="Send reply"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Press Cmd/Ctrl+Enter to send</p>
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-[#E5E7EB] bg-slate-50">
          <p className="text-sm text-slate-400 italic">
            This ticket has no associated chat session — replies are unavailable.
          </p>
        </div>
      )}
    </div>
  )
}
