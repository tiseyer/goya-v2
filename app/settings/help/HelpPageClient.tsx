'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { RefreshCw, Trash2, ArrowUp } from 'lucide-react'
import {
  getOrCreateSession,
  getCurrentUserId,
  getAnonymousId,
  deleteSession,
  getChatHistory,
} from '@/lib/chatbot/chat-actions'
import MessageBubble from '@/app/components/chat/MessageBubble'
import TypingIndicator from '@/app/components/chat/TypingIndicator'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'escalation' | 'rate-limit'
  content: string
}

interface ChatbotConfig {
  name: string
  avatarUrl: string | null
}

interface ConversationSummary {
  id: string
  created_at: string
  last_message_at: string
  first_message: string
}

const LS_KEY = 'goya_help_chat_session_id'

export default function HelpPageClient({ initialQuestion }: { initialQuestion?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [chatStarted, setChatStarted] = useState(false)
  const [heroInput, setHeroInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [config, setConfig] = useState<ChatbotConfig>({ name: 'Mattea', avatarUrl: null })
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [showConversations, setShowConversations] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const autoSubmittedRef = useRef(false)

  // Fetch chatbot config
  useEffect(() => {
    fetch('/api/chatbot/config')
      .then(r => r.json())
      .then((data: { name?: string; avatar_url?: string | null }) => {
        setConfig({
          name: data.name || 'Mattea',
          avatarUrl: data.avatar_url || null,
        })
      })
      .catch(() => {})
  }, [])

  // Initialize session
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
          started_from: 'help_page',
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
          setMessages(restored)
          setChatStarted(true)
        }

        // Load user's conversation history for dropdown
        if (userId) {
          loadConversations(userId)
        }
      } catch {
        // Non-fatal
      }
    }

    initSession()
    return () => { cancelled = true }
  }, [])

  // Auto-submit from ?q= param or initialQuestion prop
  useEffect(() => {
    if (autoSubmittedRef.current) return
    const q = initialQuestion || searchParams.get('q')
    if (!q || !sessionId) return

    autoSubmittedRef.current = true
    const timer = setTimeout(() => {
      handleSend(q)
      // Clear the URL param
      router.replace('/settings/help', { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, sessionId])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  async function loadConversations(userId: string) {
    try {
      const res = await fetch(`/api/chatbot/config`) // We'll use a simpler approach
      // For now, conversations dropdown will be powered by getChatHistory via server action
      // This is a placeholder — we'll populate from chat_sessions
      void res
      void userId
    } catch {
      // silent
    }
  }

  const handleSend = useCallback(async (text: string) => {
    if (isEscalated || isRateLimited || !text.trim()) return

    setChatStarted(true)

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    setHeroInput('')
    setChatInput('')

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text.trim(),
        }),
        signal: controller.signal,
      })

      if (res.status === 429) {
        setIsRateLimited(true)
        setIsTyping(false)
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'rate-limit', content: "You've reached the message limit for this hour. Please check back soon." },
        ])
        return
      }

      if (!res.ok || !res.body) {
        setIsTyping(false)
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong. Please try again.' },
        ])
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
          try { data = JSON.parse(line) } catch { continue }

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
                prev.map(m => m.id === targetId ? { ...m, content: m.content + (data.content ?? '') } : m)
              )
            }
          } else if (data.type === 'done') {
            setIsStreaming(false)
            if (data.session_id && data.session_id !== sessionId) {
              setSessionId(data.session_id)
              if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, data.session_id)
            }
          } else if (data.type === 'escalation') {
            setIsEscalated(true)
            setIsTyping(false)
            setIsStreaming(false)
            if (data.session_id) {
              setSessionId(data.session_id)
              if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, data.session_id)
            }
            setMessages(prev => [
              ...prev,
              { id: crypto.randomUUID(), role: 'escalation', content: data.message ?? "I'll connect you with a human team member shortly." },
            ])
          } else if (data.type === 'error') {
            setIsTyping(false)
            setIsStreaming(false)
            setMessages(prev => [
              ...prev,
              { id: crypto.randomUUID(), role: 'assistant', content: data.message ?? 'Something went wrong. Please try again.' },
            ])
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsTyping(false)
      setIsStreaming(false)
    }
  }, [isEscalated, isRateLimited, sessionId])

  async function handleNewChat() {
    abortRef.current?.abort()
    setMessages([])
    setChatStarted(false)
    setIsEscalated(false)
    setIsRateLimited(false)
    setIsTyping(false)
    setIsStreaming(false)
    setConfirmDelete(false)
    autoSubmittedRef.current = false

    try {
      const [userId, anonymousId] = await Promise.all([getCurrentUserId(), getAnonymousId()])
      const result = await getOrCreateSession({ userId: userId ?? undefined, anonymousId: anonymousId ?? undefined, started_from: 'help_page' })
      setSessionId(result.session_id)
      if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, result.session_id)
    } catch {
      // silent
    }
  }

  async function handleDeleteChat() {
    if (!sessionId) return
    try {
      await deleteSession(sessionId)
    } catch {
      // silent
    }
    if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY)
    handleNewChat()
  }

  function handleHeroSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (heroInput.trim()) handleSend(heroInput.trim())
  }

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (chatInput.trim()) handleSend(chatInput.trim())
  }

  const lastMessage = messages[messages.length - 1]
  const streamingMsgId = isStreaming ? lastMessage?.id : null

  return (
    <div>
      {/* Hero input — visible when chat hasn't started */}
      {!chatStarted && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Support</h1>
          <form onSubmit={handleHeroSubmit} className="relative">
            <input
              type="text"
              value={heroInput}
              onChange={e => setHeroInput(e.target.value)}
              placeholder="Ask us anything..."
              autoFocus
              className="w-full px-5 py-4 pr-14 text-base rounded-xl border border-[var(--goya-border)] bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--goya-primary)]/30 focus:border-[var(--goya-primary)] placeholder:text-slate-400 transition-all"
            />
            <button
              type="submit"
              disabled={!heroInput.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--goya-primary)] text-white disabled:opacity-30 hover:bg-[var(--goya-primary)]/90 transition-colors"
            >
              <ArrowUp size={18} />
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2 ml-1">{config.name} will answer instantly</p>
        </div>
      )}

      {/* Chat area — visible after first message */}
      {chatStarted && (
        <div className="mb-6">
          {/* Chat header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {config.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.avatarUrl} alt={config.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--goya-primary)] flex items-center justify-center text-white text-xs font-semibold">
                  {config.name[0]?.toUpperCase()}
                </div>
              )}
              <h1 className="text-lg font-semibold text-foreground">{config.name}</h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="p-2 text-slate-400 hover:text-foreground rounded-lg hover:bg-slate-100 transition-colors"
                title="New chat"
              >
                <RefreshCw size={16} />
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete chat"
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={handleDeleteChat}
                    className="px-2 py-1 text-red-600 font-medium hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="max-h-[50vh] overflow-y-auto space-y-3 p-4 rounded-xl border border-[var(--goya-border)] bg-[var(--goya-surface)]"
          >
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                avatarUrl={msg.role === 'assistant' ? config.avatarUrl : undefined}
                isStreaming={msg.id === streamingMsgId}
              />
            ))}
            {isTyping && <TypingIndicator />}
          </div>

          {/* Follow-up input */}
          <form onSubmit={handleChatSubmit} className="mt-3 relative">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={`Ask ${config.name} a follow-up...`}
              disabled={isEscalated || isRateLimited}
              className="w-full px-4 py-3 pr-12 text-sm rounded-xl border border-[var(--goya-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--goya-primary)]/30 focus:border-[var(--goya-primary)] placeholder:text-slate-400 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isTyping || isStreaming || isEscalated || isRateLimited}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--goya-primary)] text-white disabled:opacity-30 hover:bg-[var(--goya-primary)]/90 transition-colors"
            >
              <ArrowUp size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Conversation history dropdown — placeholder for future */}
      {conversations.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-foreground transition-colors"
          >
            All Conversations
            <svg className={`w-4 h-4 transition-transform ${showConversations ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showConversations && (
            <div className="mt-2 space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={async () => {
                    const history = await getChatHistory(conv.id)
                    const restored: Message[] = history
                      .filter(m => m.role === 'user' || m.role === 'assistant')
                      .map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content }))
                    setMessages(restored)
                    setChatStarted(true)
                    setSessionId(conv.id)
                    if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, conv.id)
                    setShowConversations(false)
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg border border-[var(--goya-border)] bg-white hover:border-[var(--goya-primary)]/30 transition-colors"
                >
                  <p className="text-sm text-foreground truncate">{conv.first_message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(conv.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
