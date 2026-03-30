'use client'

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'escalation' | 'rate-limit'
  content: string
  avatarUrl?: string | null
  isStreaming?: boolean
}

export default function MessageBubble({
  role,
  content,
  avatarUrl,
  isStreaming = false,
}: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <div className="animate-[stepIn_220ms_ease] ml-auto max-w-[75%]">
        <div className="bg-[var(--background-secondary)] border border-[var(--goya-border)] rounded-xl rounded-br-sm px-4 py-2 text-sm">
          {content}
        </div>
      </div>
    )
  }

  // Determine bubble style based on role
  const isEscalation = role === 'escalation'
  const isRateLimit = role === 'rate-limit'

  const bubbleClass = isEscalation
    ? 'bg-[var(--goya-primary-50)] border border-[var(--goya-border)] border-l-[3px] border-l-[var(--goya-primary)] rounded-xl rounded-tl-sm px-4 py-2 text-sm'
    : isRateLimit
    ? 'bg-[var(--goya-accent-50)] border border-[var(--goya-accent)]/20 rounded-xl rounded-tl-sm px-4 py-2 text-sm'
    : 'bg-[var(--goya-surface)] border border-[var(--goya-border)] rounded-xl rounded-tl-sm px-4 py-2 text-sm'

  return (
    <div className="animate-[stepIn_220ms_ease] mr-auto max-w-[75%] flex flex-row gap-2">
      {/* Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Mattea"
          className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 object-cover"
        />
      ) : (
        <div className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 bg-[var(--goya-primary)] flex items-center justify-center text-white text-xs font-semibold">
          M
        </div>
      )}

      {/* Bubble */}
      <div className={bubbleClass}>
        {content}
        {isStreaming && (
          <span
            className="inline-block ml-0.5 text-[var(--goya-primary)] animate-pulse"
            aria-hidden="true"
          >
            |
          </span>
        )}
      </div>
    </div>
  )
}
