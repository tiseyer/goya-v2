'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import type { Flow } from '@/lib/flows/types'

// ─── Display type icon ──────────────────────────────────────────────────────

function DisplayTypeIcon({ type }: { type: Flow['display_type'] }) {
  const className = 'w-4 h-4 text-slate-400 shrink-0'
  const label = type.replace('_', ' ')
  switch (type) {
    case 'fullscreen':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={label}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      )
    case 'top_banner':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={label}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
        </svg>
      )
    case 'bottom_banner':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={label}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
      )
    case 'notification':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={label}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      )
    default: // modal
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={label}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      )
  }
}

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Flow['status'] }) {
  const styles: Record<Flow['status'], string> = {
    active: 'bg-emerald-50 text-emerald-700',
    draft: 'bg-amber-50 text-amber-700',
    paused: 'bg-slate-100 text-slate-600',
    archived: 'bg-red-50 text-red-600',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface FlowStats {
  completed: number
  inProgress: number
}

interface FlowCardProps {
  flow: Flow
  stats?: FlowStats
  statsLoading?: boolean
  onAction: (action: 'duplicate' | 'pause' | 'activate' | 'archive' | 'delete', flowId: string) => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function FlowCard({ flow, stats, statsLoading, onAction }: FlowCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flow.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const triggerLabel: Record<Flow['trigger_type'], string> = {
    login: 'On login',
    manual: 'Manual',
    page_load: 'Page load',
  }

  function handleMenuClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(prev => !prev)
  }

  function handleAction(action: 'duplicate' | 'pause' | 'activate' | 'archive' | 'delete') {
    setMenuOpen(false)
    onAction(action, flow.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors group relative"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing focus:outline-none"
        style={{ touchAction: 'none' }}
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a1 1 0 000 2 1 1 0 000-2zM7 8a1 1 0 000 2 1 1 0 000-2zM7 14a1 1 0 000 2 1 1 0 000-2zM13 2a1 1 0 000 2 1 1 0 000-2zM13 8a1 1 0 000 2 1 1 0 000-2zM13 14a1 1 0 000 2 1 1 0 000-2z" />
        </svg>
      </button>

      {/* Display type icon */}
      <DisplayTypeIcon type={flow.display_type} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-900 truncate">{flow.name}</span>
          <StatusBadge status={flow.status} />
        </div>
        {flow.description && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{flow.description}</p>
        )}
      </div>

      {/* Trigger chip */}
      <span className="text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 shrink-0 hidden sm:inline-block">
        {triggerLabel[flow.trigger_type]}
      </span>

      {/* Condition chips */}
      {flow.conditions.length > 0 && (
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {flow.conditions.slice(0, 2).map((condition, i) => (
            <span
              key={i}
              className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5"
            >
              {condition.type}
            </span>
          ))}
          {flow.conditions.length > 2 && (
            <span className="text-xs text-slate-400">+{flow.conditions.length - 2}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="hidden lg:block shrink-0 text-right">
        {statsLoading ? (
          <span className="text-xs text-slate-300">-- completed, -- in progress</span>
        ) : stats ? (
          <span className="text-xs text-slate-400">
            {stats.completed} completed, {stats.inProgress} in progress
          </span>
        ) : (
          <span className="text-xs text-slate-400">0 completed, 0 in progress</span>
        )}
      </div>

      {/* Three-dot menu */}
      <div className="relative shrink-0">
        <button
          onClick={handleMenuClick}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Flow actions"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {menuOpen && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
              <Link
                href={`/admin/flows/${flow.id}/edit`}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Edit
              </Link>
              <button
                onClick={() => handleAction('duplicate')}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                Duplicate
              </button>
              {flow.status === 'paused' ? (
                <button
                  onClick={() => handleAction('activate')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  Activate
                </button>
              ) : flow.status === 'active' ? (
                <button
                  onClick={() => handleAction('pause')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  Pause
                </button>
              ) : null}
              {flow.status !== 'archived' && (
                <button
                  onClick={() => handleAction('archive')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  Archive
                </button>
              )}
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => handleAction('delete')}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
