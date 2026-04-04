'use client'

import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import FeedbackButtons from './FeedbackButtons'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'escalation' | 'rate-limit'
  content: string
  message_id?: string
}

interface MessageListProps {
  messages: Message[]
  avatarUrl: string | null
  isTyping: boolean
  isStreaming: boolean
  sessionId?: string | null   // for feedback API calls
}

const GREETING = "Namaste! I'm Mattea, your GOYA guide. How can I help you today?"

export default function MessageList({
  messages,
  avatarUrl,
  isTyping,
  isStreaming,
  sessionId,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping, isStreaming])

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col gap-3 overflow-y-auto scrollbar-none px-4 py-4"
      aria-live="polite"
    >
      {/* Greeting always shown as first assistant message — no feedback button */}
      <MessageBubble
        role="assistant"
        content={GREETING}
        avatarUrl={avatarUrl}
      />

      {/* Render messages */}
      {messages.map((msg, index) => {
        const isLastAssistant =
          index === messages.length - 1 &&
          (msg.role === 'assistant' || msg.role === 'escalation' || msg.role === 'rate-limit')

        return (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            avatarUrl={msg.role !== 'user' ? avatarUrl : undefined}
            isStreaming={isLastAssistant && isStreaming}
            feedbackSlot={
              msg.role === 'assistant' ? (
                <FeedbackButtons
                  sessionId={sessionId ?? null}
                  visible={!(isLastAssistant && isStreaming)}
                />
              ) : undefined
            }
          />
        )
      })}

      {/* Typing indicator: only when waiting for first token (not streaming) */}
      {isTyping && !isStreaming && <TypingIndicator avatarUrl={avatarUrl} />}
    </div>
  )
}
