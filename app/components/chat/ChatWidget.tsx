'use client'

import { useState, useEffect } from 'react'
import FloatingButton from './FloatingButton'
import ChatPanel from './ChatPanel'
import { getCurrentUserId, getAnonymousId, getCurrentUserRole } from '@/lib/chatbot/chat-actions'

interface ChatbotConfig {
  is_active: boolean
  name: string
  avatar_url: string | null
  chatbot_maintenance_mode: boolean
}

const LS_KEY = 'goya_chat_session_id'

export default function ChatWidget() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [anonymousId, setAnonymousId] = useState<string | null>(null)
  const [initialSessionId, setInitialSessionId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
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

  // Resolve user identity and role on mount
  useEffect(() => {
    async function resolveIdentity() {
      try {
        const [uid, anonId, role] = await Promise.all([
          getCurrentUserId(),
          getAnonymousId(),
          getCurrentUserRole(),
        ])
        setUserId(uid)
        setAnonymousId(anonId)
        setUserRole(role)
      } catch {
        // Non-fatal — widget still works without identity
      }
    }

    resolveIdentity()
  }, [])

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
  }

  // Don't render while loading config
  if (loading || !config) return null

  const isAdmin = userRole === 'admin' || userRole === 'moderator'
  const maintenanceMode = config.chatbot_maintenance_mode

  // Determine visibility and badge
  let badge: 'preview' | 'maintenance' | null = null

  if (config.is_active && !maintenanceMode) {
    // Normal mode — show for everyone, no badge
    badge = null
  } else if (config.is_active && maintenanceMode) {
    // Chatbot maintenance — show for admins only with amber badge
    if (!isAdmin) return null
    badge = 'maintenance'
  } else {
    // is_active=false — admin preview mode only
    if (!isAdmin) return null
    badge = 'preview'
  }

  function toggleChat() {
    if (isOpen) handleClose()
    else handleOpen()
  }

  return (
    <>
      <FloatingButton onClick={toggleChat} isOpen={isOpen} maintenance={badge === 'maintenance'} />
      {!isOpen && badge === 'preview' && (
        <span className="fixed bottom-16 right-4 z-50 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium leading-none pointer-events-none">
          Preview
        </span>
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
