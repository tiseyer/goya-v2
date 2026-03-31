'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface SearchEntry {
  slug: string
  title: string
  audience: string[]
  section: string
  content: string
}

const AUDIENCE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  moderator: 'bg-blue-100 text-blue-700',
  teacher: 'bg-emerald-100 text-emerald-700',
  student: 'bg-amber-100 text-amber-700',
  developer: 'bg-slate-100 text-slate-700',
}

type Props = {
  isOpen: boolean
  onClose: () => void
  basePath: string // '/admin/docs' or '/settings/help/docs'
  allowedAudiences?: string[] // if set, filter results to these audiences
}

export default function SearchModal({ isOpen, onClose, basePath, allowedAudiences }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchEntry[]>([])
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load search index on first open
  useEffect(() => {
    if (!isOpen || index.length > 0) return
    fetch('/docs/search-index.json')
      .then(r => r.json())
      .then((data: SearchEntry[]) => setIndex(data))
      .catch(() => {})
  }, [isOpen, index.length])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelectedIdx(0)
    }
  }, [isOpen])

  // Debounced search
  const search = useCallback(
    (q: string) => {
      if (q.length < 2) {
        setResults([])
        return
      }

      const queryLower = q.toLowerCase()
      const words = queryLower.split(/\s+/).filter(w => w.length > 1)

      let filtered = index

      // Filter by allowed audiences
      if (allowedAudiences) {
        filtered = filtered.filter(entry =>
          entry.audience.some(a => allowedAudiences.includes(a))
        )
      }

      // Score and sort by relevance
      const scored = filtered
        .map(entry => {
          let score = 0
          for (const word of words) {
            if (entry.title.toLowerCase().includes(word)) score += 10
            if (entry.section.toLowerCase().includes(word)) score += 3
            const contentLower = entry.content.toLowerCase()
            const contentMatches = contentLower.split(word).length - 1
            score += Math.min(contentMatches, 5)
          }
          return { entry, score }
        })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(s => s.entry)

      setResults(scored)
      setSelectedIdx(0)
    },
    [index, allowedAudiences]
  )

  const handleInput = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => search(value), 200)
    },
    [search]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [results, selectedIdx, onClose]
  )

  // Get excerpt with highlighted match
  function getExcerpt(content: string, q: string): string {
    if (q.length < 2) return content.slice(0, 120) + '...'
    const lower = content.toLowerCase()
    const idx = lower.indexOf(q.toLowerCase())
    if (idx === -1) return content.slice(0, 120) + '...'
    const start = Math.max(0, idx - 40)
    const end = Math.min(content.length, idx + q.length + 80)
    let excerpt = (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '')
    return excerpt
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 text-sm text-foreground placeholder:text-slate-400 outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.length < 2 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Type at least 2 characters to search...
            </div>
          )}

          {query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {results.map((result, i) => (
            <Link
              key={result.slug}
              href={`${basePath}/${result.slug}`}
              onClick={onClose}
              className={`block px-4 py-3 border-b border-slate-100 transition-colors ${
                i === selectedIdx ? 'bg-[var(--goya-primary)]/5' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">{result.title}</span>
                {result.audience.map(a => (
                  <span
                    key={a}
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${AUDIENCE_COLORS[a] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {a}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                {getExcerpt(result.content, query)}
              </p>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 flex items-center gap-4 text-[10px] text-slate-400">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  )
}
