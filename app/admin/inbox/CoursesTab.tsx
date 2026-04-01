'use client'

import { useState } from 'react'
import { approveCourse, rejectCourse } from './actions'

type CourseItem = {
  id: string
  title: string
  category: string
  duration: string | null
  status: string
  created_at: string
  created_by: string | null
  rejection_reason: string | null
  submitter_name: string | null
  submitter_email: string | null
}

interface CoursesTabProps {
  courses: CourseItem[]
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  published: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending',
  published: 'Published',
  rejected: 'Rejected',
}

const SUB_TABS: Array<{ key: 'pending_review' | 'published' | 'rejected'; label: string }> = [
  { key: 'pending_review', label: 'Pending' },
  { key: 'published', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function CoursesTab({ courses: initialCourses }: CoursesTabProps) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses)
  const [activeSubTab, setActiveSubTab] = useState<'pending_review' | 'published' | 'rejected'>('pending_review')
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const pendingCount = courses.filter(c => c.status === 'pending_review').length
  const filtered = courses.filter(c => c.status === activeSubTab)

  // Sort: pending first, then by created_at descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'pending_review' && b.status !== 'pending_review') return -1
    if (a.status !== 'pending_review' && b.status === 'pending_review') return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  async function handleApprove(courseId: string) {
    setBusy(courseId)
    const result = await approveCourse(courseId)
    if (result.success) {
      setCourses(prev =>
        prev.map(c => c.id === courseId ? { ...c, status: 'published' } : c)
      )
    } else {
      alert(result.error)
    }
    setBusy(null)
  }

  async function handleReject(courseId: string) {
    if (rejectReason.trim().length < 10) {
      alert('Rejection reason must be at least 10 characters.')
      return
    }
    setBusy(courseId)
    const result = await rejectCourse(courseId, rejectReason)
    if (result.success) {
      setCourses(prev =>
        prev.map(c =>
          c.id === courseId
            ? { ...c, status: 'rejected', rejection_reason: rejectReason }
            : c
        )
      )
      setRejectOpen(null)
      setRejectReason('')
    } else {
      alert(result.error)
    }
    setBusy(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {/* Sub-tab bar */}
      <div className="flex gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`text-sm font-semibold pb-1 transition-colors ${
              activeSubTab === tab.key
                ? 'text-[#1B3A5C] border-b-2 border-[#1B3A5C]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {tab.key === 'pending_review' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {sorted.length === 0 ? (
        <div className="p-16 text-center">
          <p className="font-semibold text-slate-700 mb-1">
            No {activeSubTab === 'pending_review' ? 'pending' : activeSubTab} courses
          </p>
          <p className="text-sm text-slate-400">
            {activeSubTab === 'pending_review'
              ? 'New course submissions will appear here for review.'
              : `${STATUS_LABELS[activeSubTab]} courses will appear here.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_0.7fr_auto] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50 min-w-[800px]">
            {['COURSE TITLE', 'SUBMITTED BY', 'CATEGORY', 'DURATION', 'SUBMITTED', 'ACTIONS'].map(col => (
              <span key={col} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {col}
              </span>
            ))}
          </div>

          <div className="divide-y divide-slate-100 min-w-[800px]">
            {sorted.map(course => {
              const isBusy = busy === course.id

              return (
                <div key={course.id}>
                  {/* Main row */}
                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[2fr_1.2fr_0.8fr_0.8fr_0.7fr_auto] gap-4 items-center">
                    {/* COURSE TITLE */}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1B3A5C] text-sm truncate">
                        {course.title}
                      </p>
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold capitalize mt-1 ${STATUS_STYLES[course.status] ?? 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                        {STATUS_LABELS[course.status] ?? course.status}
                      </span>
                    </div>

                    {/* SUBMITTED BY */}
                    <div className="min-w-0">
                      <p className="text-sm text-slate-600 truncate">
                        {course.submitter_name ?? 'Unknown user'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {course.submitter_email ?? '\u2014'}
                      </p>
                    </div>

                    {/* CATEGORY */}
                    <div className="text-sm text-slate-600">
                      {course.category}
                    </div>

                    {/* DURATION */}
                    <div className="text-sm text-slate-500">
                      {course.duration ?? '\u2014'}
                    </div>

                    {/* SUBMITTED */}
                    <div className="text-sm text-slate-400">
                      {relativeDate(course.created_at)}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {course.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => handleApprove(course.id)}
                            disabled={isBusy}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            {isBusy ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => { setRejectOpen(course.id); setRejectReason('') }}
                            disabled={isBusy}
                            className="px-2.5 py-1.5 text-xs font-semibold border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {course.status === 'rejected' && course.rejection_reason && (
                        <p className="text-xs text-slate-400 max-w-[200px] truncate" title={course.rejection_reason}>
                          {course.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inline reject textarea */}
                  {rejectOpen === course.id && (
                    <div className="px-6 pb-4">
                      <div className="flex items-start gap-2 max-w-lg ml-4">
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Rejection reason (required, min 10 characters)"
                          rows={2}
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100 resize-none"
                          onKeyDown={e => {
                            if (e.key === 'Escape') setRejectOpen(null)
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleReject(course.id)}
                          disabled={isBusy || rejectReason.trim().length < 10}
                          className="px-3 py-2 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                        >
                          {isBusy ? '...' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => setRejectOpen(null)}
                          className="px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                      {rejectReason.trim().length > 0 && rejectReason.trim().length < 10 && (
                        <p className="text-xs text-rose-400 ml-4 mt-1">
                          {10 - rejectReason.trim().length} more character{10 - rejectReason.trim().length !== 1 ? 's' : ''} needed
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
