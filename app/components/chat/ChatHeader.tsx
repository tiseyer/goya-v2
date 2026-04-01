'use client'

import { useState, useEffect } from 'react'
import { RotateCcw, Trash2, X } from 'lucide-react'

interface ChatHeaderProps {
  avatarUrl: string | null
  name: string
  onNewChat: () => void
  onDeleteHistory: () => void
  onClose: () => void
}

export default function ChatHeader({
  avatarUrl,
  name,
  onNewChat,
  onDeleteHistory,
  onClose,
}: ChatHeaderProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Auto-dismiss delete confirm after 5 seconds
  useEffect(() => {
    if (!showDeleteConfirm) return
    const timer = setTimeout(() => setShowDeleteConfirm(false), 5000)
    return () => clearTimeout(timer)
  }, [showDeleteConfirm])

  function handleDeleteConfirm() {
    onDeleteHistory()
    setShowDeleteConfirm(false)
  }

  return (
    <div className="flex-shrink-0">
      {/* Main header row */}
      <div
        className="h-14 px-4 flex items-center gap-3 border-b border-[var(--goya-border)] bg-[var(--background-secondary)] rounded-t-2xl"
      >
        {/* Left: avatar + name + online dot */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[var(--goya-primary)] flex items-center justify-center text-white text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name */}
          <span className="text-sm font-semibold truncate">{name}</span>

          {/* Online dot */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-[var(--goya-primary)]" />
            <span className="sr-only">Online</span>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            aria-label="Start new chat"
            title="New chat"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--goya-border)]/50 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Delete chat history"
            title="Delete chat history"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--goya-border)]/50 transition-colors text-[var(--goya-accent)]"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close chat"
            title="Close chat"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--goya-border)]/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Delete confirm row */}
      {showDeleteConfirm && (
        <div className="px-4 py-2 bg-[var(--background-secondary)] border-b border-[var(--goya-border)] flex items-center justify-between gap-2 text-xs animate-[fadeIn_180ms_ease]">
          <span className="text-foreground-secondary">Delete all messages? This cannot be undone.</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleDeleteConfirm}
              className="px-2 py-1 rounded text-xs font-medium bg-[var(--goya-accent)] text-white hover:opacity-90 transition-opacity"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-1 rounded text-xs font-medium border border-[var(--goya-border)] hover:bg-[var(--goya-border)]/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
