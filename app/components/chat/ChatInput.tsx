'use client'

import { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function adjustHeight() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, 84) // max 3 rows ~84px
    el.style.height = `${newHeight}px`
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    adjustHeight()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--goya-border)] bg-[var(--background-secondary)] flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask Mattea anything..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none min-h-[36px] max-h-[84px] bg-[var(--background-tertiary)] border border-[var(--goya-border)] rounded-xl px-3 py-2 text-sm placeholder:text-[var(--foreground-tertiary)] outline-none focus:ring-1 focus:ring-[var(--goya-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ height: '36px' }}
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className="w-9 h-9 rounded-full bg-[var(--goya-primary)] flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowUp size={16} className="text-white" />
      </button>
    </div>
  )
}
