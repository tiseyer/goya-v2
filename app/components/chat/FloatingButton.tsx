'use client'

import { MessageCircle, X } from 'lucide-react'

interface FloatingButtonProps {
  onClick: () => void
  isOpen?: boolean
}

export default function FloatingButton({ onClick, isOpen = false }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat with Mattea'}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--goya-primary)] shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
    >
      {isOpen ? (
        <X size={24} className="text-white" />
      ) : (
        <MessageCircle size={24} className="text-white" />
      )}
    </button>
  )
}
