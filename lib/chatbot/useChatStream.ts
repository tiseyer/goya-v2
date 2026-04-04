'use client'

import { useState, useRef, useCallback } from 'react'

export interface StreamMessage {
  id: string           // client UUID — React key
  role: 'user' | 'assistant' | 'escalation' | 'rate-limit'
  content: string
  message_id?: string  // server DB row ID, populated after done event
}

export interface UseChatStreamOptions {
  sessionId: string | null
  anonymousId?: string | null
  onSessionUpdate?: (newSessionId: string) => void
}

export interface UseChatStreamReturn {
  messages: StreamMessage[]
  setMessages: React.Dispatch<React.SetStateAction<StreamMessage[]>>
  isTyping: boolean
  isStreaming: boolean
  isEscalated: boolean
  isRateLimited: boolean
  sendMessage: (text: string) => Promise<void>
  abort: () => void
}

export function useChatStream(options: UseChatStreamOptions): UseChatStreamReturn {
  const { sessionId, anonymousId, onSessionUpdate } = options

  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (isEscalated || isRateLimited) return

    // Optimistic: add user message immediately
    const userMsg: StreamMessage = {
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
          anonymous_id: anonymousId ?? undefined,
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

          let data: {
            type: string
            content?: string
            message?: string
            session_id?: string
            message_id?: string | null
          }
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
            // Wire server-assigned message_id onto the assistant message
            if (assistantMsgId && data.message_id) {
              const targetId = assistantMsgId
              setMessages(prev =>
                prev.map(m =>
                  m.id === targetId ? { ...m, message_id: data.message_id ?? undefined } : m,
                ),
              )
            }
            // Update sessionId if server assigned a new one
            if (data.session_id && data.session_id !== sessionId) {
              onSessionUpdate?.(data.session_id)
            }
          } else if (data.type === 'escalation') {
            setIsEscalated(true)
            setIsTyping(false)
            setIsStreaming(false)
            if (data.session_id && data.session_id !== sessionId) {
              onSessionUpdate?.(data.session_id)
            }
            setMessages(prev => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'escalation',
                content: data.message ?? "I'll connect you with a human team member shortly.",
                message_id: data.message_id ?? undefined,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, anonymousId, isEscalated, isRateLimited, onSessionUpdate])

  return {
    messages,
    setMessages,
    isTyping,
    isStreaming,
    isEscalated,
    isRateLimited,
    sendMessage,
    abort,
  }
}
