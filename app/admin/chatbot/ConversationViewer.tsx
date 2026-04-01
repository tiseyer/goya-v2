'use client'

import { ArrowLeft } from 'lucide-react'
import type { ChatMessage } from '@/lib/chatbot/types'

interface Props {
  sessionId: string
  messages: ChatMessage[]
  userName: string | null
  onBack: () => void
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ConversationViewer({ sessionId, messages, userName, onBack }: Props) {
  const displayName = userName || 'Guest'

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5E7EB] bg-slate-50">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-sm font-semibold text-[#1B3A5C]">
            Conversation with {displayName}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{sessionId}</p>
        </div>
      </div>

      {/* Message list */}
      <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No messages in this conversation.</p>
        )}
        {messages
          .filter((m) => m.role !== 'system')
          .map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
              >
                {!isUser && (
                  <span className="text-xs font-semibold text-slate-500 ml-1">Mattea</span>
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
    </div>
  )
}
