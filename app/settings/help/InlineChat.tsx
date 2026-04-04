'use client'

import { useState, useEffect, useRef } from 'react'
import {
  getOrCreateSession,
  getCurrentUserId,
  getAnonymousId,
} from '@/lib/chatbot/chat-actions'
import MessageBubble from '@/app/components/chat/MessageBubble'
import TypingIndicator from '@/app/components/chat/TypingIndicator'
import { PromptInputBox } from '@/app/components/ui/ai-prompt-box'
import { useChatStream, type StreamMessage } from '@/lib/chatbot/useChatStream'

const LS_KEY = 'goya_help_chat_session_id'

const GREETING_MESSAGE: StreamMessage = {
  id: 'greeting',
  role: 'assistant',
  content: "Namaste! I'm Mattea, your GOYA guide. How can I help you today?",
}

interface InlineChatProps {
  initialQuestion?: string;
}

export default function InlineChat({ initialQuestion }: InlineChatProps) {
  const initialQuestionSentRef = useRef(false);
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [anonymousId, setAnonymousId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, setMessages, isTyping, isStreaming, isEscalated, isRateLimited, sendMessage, abort } = useChatStream({
    sessionId,
    anonymousId,
    onSessionUpdate: (newSessionId) => {
      setSessionId(newSessionId)
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_KEY, newSessionId)
      }
    },
  })

  // Initialize with greeting message
  useEffect(() => {
    setMessages([GREETING_MESSAGE])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize session on mount
  useEffect(() => {
    let cancelled = false

    async function initSession() {
      try {
        const [userId, anonId] = await Promise.all([
          getCurrentUserId(),
          getAnonymousId(),
        ])

        if (!cancelled) {
          setAnonymousId(anonId)
        }

        const storedSessionId =
          typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null

        const result = await getOrCreateSession({
          userId: userId ?? undefined,
          anonymousId: anonId ?? undefined,
          existingSessionId: storedSessionId ?? undefined,
        })

        if (cancelled) return

        setSessionId(result.session_id)

        if (typeof window !== 'undefined') {
          localStorage.setItem(LS_KEY, result.session_id)
        }

        // Restore conversation history if any
        if (result.messages.length > 0) {
          const restored: StreamMessage[] = result.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
          setMessages([GREETING_MESSAGE, ...restored])
        }
      } catch {
        // Non-fatal — inline chat still works without session restore
      }
    }

    initSession()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-submit initial question from ?q= param
  useEffect(() => {
    if (!initialQuestion || !sessionId || initialQuestionSentRef.current) return;
    initialQuestionSentRef.current = true;
    const timer = setTimeout(() => {
      sendMessage(initialQuestion);
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => {
      abort()
    }
  }, [abort])

  const lastMessage = messages[messages.length - 1]
  const streamingMsgId = isStreaming ? lastMessage?.id : null

  return (
    <div className="flex flex-col min-h-[400px] max-h-[600px] border border-[var(--goya-border)] rounded-2xl overflow-hidden bg-[var(--goya-surface)]">
      {/* Scrollable message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={msg.id === streamingMsgId}
          />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Input pinned at bottom */}
      <div className="flex-shrink-0 p-3 border-t border-[var(--goya-border)] bg-[var(--background-secondary)]">
        <PromptInputBox
          onSend={sendMessage}
          isLoading={isTyping || isStreaming}
          disabled={isEscalated || isRateLimited}
          placeholder="Ask Mattea anything..."
        />
      </div>
    </div>
  )
}
