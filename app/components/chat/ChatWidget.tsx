'use client'

import { useState, useEffect, useRef } from 'react'
import FloatingButton from './FloatingButton'
import ChatPanel from './ChatPanel'

interface ChatbotConfig {
  is_active: boolean
  name: string
  avatar_url: string | null
}

export default function ChatWidget() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
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
      />
    </>
  )
}
