'use client'

import { useState, useEffect, useRef } from 'react'
import FloatingButton from './FloatingButton'
import ChatPanel from './ChatPanel'
import { getCurrentUserId, getAnonymousId } from '@/lib/chatbot/chat-actions'

interface ChatbotConfig {
  is_active: boolean
  name: string
  avatar_url: string | null
}

const LS_KEY = 'goya_chat_session_id'

export default function ChatWidget() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [anonymousId, setAnonymousId] = useState<string | null>(null)
  const [initialSessionId, setInitialSessionId] = useState<string | null>(null)
  const floatingButtonRef = useRef<HTMLButtonElement>(null)

  // Fetch chatbot config on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/chatbot/config')
        if (!res.ok) {
          setLoading(false)
          return
        }
        const data = await res.json() as ChatbotConfig
        setConfig(data)
      } catch {
        // On error, treat as inactive
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  // Resolve user identity on mount (after config confirms widget is active)
  useEffect(() => {
    if (!config?.is_active) return

    async function resolveIdentity() {
      try {
        const [uid, anonId] = await Promise.all([
          getCurrentUserId(),
          getAnonymousId(),
        ])
        setUserId(uid)
        setAnonymousId(anonId)
      } catch {
        // Non-fatal — widget still works without identity
      }
    }

    resolveIdentity()
  }, [config?.is_active])

  // Read stored session ID from localStorage for restore on panel open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setInitialSessionId(stored)
    }
  }, [])

  function handleOpen() {
    setIsOpen(true)
  }

  function handleClose() {
    setIsOpen(false)
    // Return focus to floating button
    setTimeout(() => floatingButtonRef.current?.focus(), 50)
  }

  // Don't render while loading or if chatbot is inactive
  if (loading || !config || !config.is_active) return null

  return (
    <>
      {!isOpen && (
        <FloatingButton onClick={handleOpen} />
      )}
      <ChatPanel
        isOpen={isOpen}
        avatarUrl={config.avatar_url}
        name={config.name}
        onClose={handleClose}
        userId={userId}
        anonymousId={anonymousId}
        initialSessionId={initialSessionId}
      />
    </>
  )
}
