'use client'

interface TypingIndicatorProps {
  avatarUrl?: string | null
}

export default function TypingIndicator({ avatarUrl }: TypingIndicatorProps) {
  return (
    <div className="mr-auto max-w-[75%] flex flex-row gap-2" aria-label="Mattea is typing">
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

      {/* Dots */}
      <div className="bg-[var(--goya-surface)] border border-[var(--goya-border)] rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-pulse"
          style={{ animationDelay: '0ms', animationDuration: '1200ms' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-pulse"
          style={{ animationDelay: '150ms', animationDuration: '1200ms' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-pulse"
          style={{ animationDelay: '300ms', animationDuration: '1200ms' }}
        />
      </div>
    </div>
  )
}
