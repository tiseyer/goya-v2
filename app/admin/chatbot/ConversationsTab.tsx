'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import type { ConversationListItem, ChatMessage } from '@/lib/chatbot/types'
import { listConversations, getConversationMessages } from './chatbot-actions'
import ConversationViewer from './ConversationViewer'

interface Props {
  initialConversations: ConversationListItem[]
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

type FilterOption = 'all' | 'users' | 'guests' | 'escalated'

export default function ConversationsTab({ initialConversations }: Props) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations)
  const [filter, setFilter] = useState<FilterOption>('all')
  const [search, setSearch] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<ConversationListItem | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  async function handleFilterChange(newFilter: FilterOption) {
    setFilter(newFilter)
    setLoading(true)
    const result = await listConversations(newFilter, search || undefined)
    if (result.success) {
      setConversations(result.conversations)
    }
    setLoading(false)
  }

  async function handleSearchChange(newSearch: string) {
    setSearch(newSearch)
    setLoading(true)
    const result = await listConversations(filter, newSearch || undefined)
    if (result.success) {
      setConversations(result.conversations)
    }
    setLoading(false)
  }

  async function handleView(conv: ConversationListItem) {
    setLoading(true)
    const result = await getConversationMessages(conv.id)
    if (result.success) {
      setMessages(result.messages)
      setSelectedConversation(conv)
      setSelectedSessionId(conv.id)
    }
    setLoading(false)
  }

  function handleBack() {
    setSelectedSessionId(null)
    setSelectedConversation(null)
    setMessages([])
  }

  if (selectedSessionId && selectedConversation) {
    return (
      <ConversationViewer
        sessionId={selectedSessionId}
        messages={messages}
        userName={selectedConversation.user_name}
        onBack={handleBack}
      />
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as FilterOption)}
          className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B5A3] bg-white text-[#374151]"
        >
          <option value="all">All Conversations</option>
          <option value="users">Logged-in Users</option>
          <option value="guests">Guests</option>
          <option value="escalated">Escalated</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or ID..."
          className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B5A3] bg-white text-[#374151] placeholder-[#9CA3AF] w-64"
        />
        {loading && <span className="text-sm text-slate-400">Loading...</span>}
      </div>

      {/* Empty state */}
      {conversations.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare size={40} className="text-[#9CA3AF]" />
          <h3 className="text-base font-semibold text-[#1B3A5C] mt-4">No conversations yet</h3>
          <p className="text-sm text-[#6B7280] mt-2">
            Chat sessions will appear here once users start conversations.
          </p>
        </div>
      )}

      {/* Table */}
      {conversations.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-widest text-[#6B7280] border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Started</th>
                  <th className="text-left px-5 py-3">Last Message</th>
                  <th className="text-left px-5 py-3">Messages</th>
                  <th className="text-left px-5 py-3">Escalated</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {conversations.map((conv) => {
                  const displayName = conv.user_name
                    ? conv.user_name
                    : conv.anonymous_id
                    ? `Guest #${conv.anonymous_id.slice(0, 8)}`
                    : 'Unknown'

                  return (
                    <tr key={conv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-[#1B3A5C]">{displayName}</div>
                        {conv.user_email && (
                          <div className="text-xs text-slate-400 mt-0.5">{conv.user_email}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500">
                        {relativeDate(conv.created_at)}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500">
                        {relativeDate(conv.last_message_at)}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 font-medium">
                        {conv.message_count}
                      </td>
                      <td className="px-5 py-3">
                        {conv.is_escalated ? (
                          <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Escalated
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleView(conv)}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
                        >
                          View
                        </button>
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
