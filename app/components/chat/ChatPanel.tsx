'use client'

import { useState, useEffect, useRef } from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

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
}

export default function ChatPanel({ isOpen, avatarUrl, name, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID())
  }, [])

  // Focus input when panel opens
  useEffect(() => {
    if (!isOpen) return
    // Focus the textarea inside the input area
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

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  function handleSend(text: string) {
    if (isEscalated || isRateLimited) return

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    // Mock assistant response after 1 second
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false)
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm Mattea! This is a placeholder response. The real AI backend will be connected soon.",
      }
      setMessages(prev => [...prev, assistantMsg])
    }, 1000)
  }

  function handleNewChat() {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    setMessages([])
    setSessionId(crypto.randomUUID())
    setIsEscalated(false)
    setIsRateLimited(false)
    setIsTyping(false)
    setIsStreaming(false)
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
