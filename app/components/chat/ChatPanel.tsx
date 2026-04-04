'use client'

import { useState, useEffect, useRef } from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import {
  getOrCreateSession,
  deleteSession,
} from '@/lib/chatbot/chat-actions'
import { useChatStream } from '@/lib/chatbot/useChatStream'

interface ChatPanelProps {
  isOpen: boolean
  avatarUrl: string | null
  name: string
  onClose: () => void
  userId: string | null
  anonymousId: string | null
  initialSessionId: string | null
}

const LS_KEY = 'goya_chat_session_id'

export default function ChatPanel({
  isOpen,
  avatarUrl,
  name,
  onClose,
  userId,
  anonymousId,
  initialSessionId,
}: ChatPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

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

  // Restore or create session when panel opens
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    async function initSession() {
      try {
        const storedSessionId =
          initialSessionId ?? (typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null)

        const result = await getOrCreateSession({
          userId: userId ?? undefined,
          anonymousId: anonymousId ?? undefined,
          existingSessionId: storedSessionId ?? undefined,
        })

        if (cancelled) return

        setSessionId(result.session_id)

        // Persist session ID to localStorage for cross-navigation restore
        if (typeof window !== 'undefined') {
          localStorage.setItem(LS_KEY, result.session_id)
        }

        // Restore conversation history
        if (result.messages.length > 0) {
          const restored = result.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
          setMessages(restored)
        }
      } catch {
        // Non-fatal — widget still works without session restore
      }
    }

    initSession()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Focus input when panel opens
  useEffect(() => {
    if (!isOpen) return
    const textarea = panelRef.current?.querySelector('textarea')
    if (textarea) {
      setTimeout(() => textarea.focus(), 50)
    }
  }, [isOpen])

  // Escape key closes panel
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => {
      abort()
    }
  }, [abort])

  async function handleNewChat() {
    // Abort any in-flight request
    abort()

    // Delete existing session from DB
    if (sessionId) {
      try {
        await deleteSession(sessionId)
      } catch {
        // Non-fatal
      }
    }

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LS_KEY)
    }

    // Reset state
    setMessages([])

    // Create a fresh session
    try {
      const result = await getOrCreateSession({
        userId: userId ?? undefined,
        anonymousId: anonymousId ?? undefined,
      })
      setSessionId(result.session_id)
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_KEY, result.session_id)
      }
    } catch {
      setSessionId(null)
    }
  }

  function handleDeleteHistory() {
    handleNewChat()
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Chat with Mattea"
      aria-modal="true"
      className="fixed z-50 flex flex-col bg-[var(--goya-surface)] border border-[var(--goya-border)] shadow-[var(--shadow-elevated)] overflow-hidden
        inset-0 rounded-none h-[100dvh]
        md:inset-auto md:bottom-24 md:right-6 md:w-[380px] md:h-[560px] md:rounded-2xl
        animate-[slideUp_280ms_ease-out]"
    >
      <ChatHeader
        avatarUrl={avatarUrl}
        name={name}
        onNewChat={handleNewChat}
        onDeleteHistory={handleDeleteHistory}
        onClose={onClose}
      />

      <MessageList
        messages={messages}
        avatarUrl={avatarUrl}
        isTyping={isTyping}
        isStreaming={isStreaming}
      />

      <ChatInput
        onSend={sendMessage}
        disabled={isEscalated || isRateLimited || isTyping || isStreaming}
      />
    </div>
  )
}
