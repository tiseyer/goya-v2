'use client'

import { useState, useEffect, useRef } from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import {
  getOrCreateSession,
  deleteSession,
} from '@/lib/chatbot/chat-actions'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'escalation' | 'rate-limit'
  content: string
}

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
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
          const restored: Message[] = result.messages
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
      abortControllerRef.current?.abort()
    }
  }, [])

  async function handleSend(text: string) {
    if (isEscalated || isRateLimited) return

    // Optimistic: add user message immediately
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          anonymous_id: anonymousId,
        }),
        signal: controller.signal,
      })

      if (res.status === 429) {
        setIsRateLimited(true)
        setIsTyping(false)
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'rate-limit',
            content:
              "You've reached the message limit for this hour. Please check back soon.",
          },
        ])
        return
      }

      if (!res.ok) {
        setIsTyping(false)
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Something went wrong. Please try again.',
          },
        ])
        return
      }

      if (!res.body) {
        setIsTyping(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantMsgId: string | null = null

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue

          let data: { type: string; content?: string; message?: string; session_id?: string }
          try {
            data = JSON.parse(line)
          } catch {
            continue
          }

          if (data.type === 'token') {
            if (!assistantMsgId) {
              // First token: switch from typing indicator to streaming
              setIsTyping(false)
              setIsStreaming(true)
              assistantMsgId = crypto.randomUUID()
              setMessages(prev => [
                ...prev,
                { id: assistantMsgId!, role: 'assistant', content: data.content ?? '' },
              ])
            } else {
              // Subsequent tokens: append to existing assistant message
              const targetId = assistantMsgId
              setMessages(prev =>
                prev.map(m =>
                  m.id === targetId
                    ? { ...m, content: m.content + (data.content ?? '') }
                    : m,
                ),
              )
            }
          } else if (data.type === 'done') {
            setIsStreaming(false)
            if (data.session_id && data.session_id !== sessionId) {
              setSessionId(data.session_id)
              if (typeof window !== 'undefined') {
                localStorage.setItem(LS_KEY, data.session_id)
              }
            }
          } else if (data.type === 'escalation') {
            setIsEscalated(true)
            setIsTyping(false)
            setIsStreaming(false)
            if (data.session_id) {
              setSessionId(data.session_id)
              if (typeof window !== 'undefined') {
                localStorage.setItem(LS_KEY, data.session_id)
              }
            }
            setMessages(prev => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'escalation',
                content: data.message ?? "I'll connect you with a human team member shortly.",
              },
            ])
          } else if (data.type === 'error') {
            setIsTyping(false)
            setIsStreaming(false)
            setMessages(prev => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.message ?? 'Something went wrong. Please try again.',
              },
            ])
          }
        }
      }
    } catch (err) {
      // Ignore AbortError (user navigated away or started new chat)
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setIsTyping(false)
      setIsStreaming(false)
    }
  }

  async function handleNewChat() {
    // Abort any in-flight request
    abortControllerRef.current?.abort()

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
    setIsEscalated(false)
    setIsRateLimited(false)
    setIsTyping(false)
    setIsStreaming(false)

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
      className="fixed z-50 flex flex-col bg-[var(--goya-surface)] border border-[var(--goya-border)] shadow-[var(--shadow-elevated)]
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
        onSend={handleSend}
        disabled={isEscalated || isRateLimited || isTyping || isStreaming}
      />
    </div>
  )
}
