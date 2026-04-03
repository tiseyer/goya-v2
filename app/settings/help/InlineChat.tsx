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

interface Message {
  id: string
  role: 'user' | 'assistant' | 'escalation' | 'rate-limit'
  content: string
}

const LS_KEY = 'goya_help_chat_session_id'

const GREETING_MESSAGE: Message = {
  id: 'greeting',
  role: 'assistant',
  content: "Namaste! I'm Mattea, your GOYA guide. How can I help you today?",
}

interface InlineChatProps {
  initialQuestion?: string;
}

export default function InlineChat({ initialQuestion }: InlineChatProps) {
  const initialQuestionSentRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize session on mount
  useEffect(() => {
    let cancelled = false

    async function initSession() {
      try {
        const [userId, anonymousId] = await Promise.all([
          getCurrentUserId(),
          getAnonymousId(),
        ])

        const storedSessionId =
          typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null

        const result = await getOrCreateSession({
          userId: userId ?? undefined,
          anonymousId: anonymousId ?? undefined,
          existingSessionId: storedSessionId ?? undefined,
        })

        if (cancelled) return

        setSessionId(result.session_id)

        if (typeof window !== 'undefined') {
          localStorage.setItem(LS_KEY, result.session_id)
        }

        // Restore conversation history if any
        if (result.messages.length > 0) {
          const restored: Message[] = result.messages
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
  }, [])

  // Auto-submit initial question from ?q= param
  useEffect(() => {
    if (!initialQuestion || !sessionId || initialQuestionSentRef.current) return;
    initialQuestionSentRef.current = true;
    const timer = setTimeout(() => {
      handleSend(initialQuestion);
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
      abortControllerRef.current?.abort()
    }
  }, [])

  async function handleSend(text: string) {
    if (isEscalated || isRateLimited) return

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
            content: "You've reached the message limit for this hour. Please check back soon.",
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
              setIsTyping(false)
              setIsStreaming(true)
              assistantMsgId = crypto.randomUUID()
              setMessages(prev => [
                ...prev,
                { id: assistantMsgId!, role: 'assistant', content: data.content ?? '' },
              ])
            } else {
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
          onSend={handleSend}
          isLoading={isTyping || isStreaming}
          disabled={isEscalated || isRateLimited}
          placeholder="Ask Mattea anything..."
        />
      </div>
    </div>
  )
}
