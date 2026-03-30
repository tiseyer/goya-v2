'use client'

import { MessageCircle } from 'lucide-react'

interface FloatingButtonProps {
  onClick: () => void
}

export default function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open chat with Mattea"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--goya-primary)] shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
    >
      <MessageCircle size={24} className="text-white" />
    </button>
  )
}
