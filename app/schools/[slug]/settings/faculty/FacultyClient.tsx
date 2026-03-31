'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import {
  saveFacultyMember,
  removeFacultyMember,
  inviteFacultyByEmail,
} from '../actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FacultyRow {
  id: string
  profile_id: string | null
  invited_email: string | null
  position: string | null
  is_principal_trainer: boolean
  status: string
  full_name?: string
  avatar_url?: string | null
}

interface SearchResult {
  id: string
  full_name: string
  avatar_url: string | null
}

interface RawFacultyRow {
  id: string
  profile_id: string | null
  invited_email: string | null
  position: string | null
  is_principal_trainer: boolean
  status: string
  profiles?: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

const POSITIONS = [
  'Instructor',
  'Senior Instructor',
  'Lead Teacher',
  'Assistant',
  'Administrator',
  'Support Staff',
]

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
        type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      {message}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    inactive: 'bg-gray-100 text-gray-500',
  }
  const classes = map[status] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${classes}`}>
      {status}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface FacultyClientProps {
  schoolId: string
  schoolSlug: string
  ownerName: string
  initialFaculty: RawFacultyRow[]
}

export default function FacultyClient({
  schoolId,
  schoolSlug,
  ownerName,
  initialFaculty,
}: FacultyClientProps) {
  const [facultyList, setFacultyList] = useState<FacultyRow[]>(() =>
    initialFaculty.map((f) => ({
      id: f.id,
      profile_id: f.profile_id,
      invited_email: f.invited_email,
      position: f.position,
      is_principal_trainer: f.is_principal_trainer,
      status: f.status,
      full_name: f.profiles
        ? `${f.profiles.first_name ?? ''} ${f.profiles.last_name ?? ''}`.trim()
        : undefined,
      avatar_url: f.profiles?.avatar_url ?? null,
    }))
  )

  const [activeTab, setActiveTab] = useState<'search' | 'invite'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<SearchResult | null>(null)
  const [memberPosition, setMemberPosition] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePosition, setInvitePosition] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (!query.trim()) {
        setSearchResults([])
        return
      }
      searchTimerRef.current = setTimeout(async () => {
        setIsSearching(true)
        try {
          const res = await fetch(
            `/api/schools/faculty-search?q=${encodeURIComponent(query)}&school_id=${schoolId}`
          )
          if (res.ok) {
            const data = (await res.json()) as { results: SearchResult[] }
            setSearchResults(data.results ?? [])
          }
        } finally {
          setIsSearching(false)
        }
      }, 500)
    },
    [schoolId]
  )

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setSearchQuery(q)
    debouncedSearch(q)
  }

  function handleSelectMember(member: SearchResult) {
    setSelectedMember(member)
    setSearchQuery('')
    setSearchResults([])
  }

  function handleAddMember() {
    if (!selectedMember || !memberPosition.trim()) return
    setActionError(null)
    startTransition(async () => {
      const result = await saveFacultyMember(schoolSlug, {
        profile_id: selectedMember.id,
        position: memberPosition.trim(),
      })
      if ('error' in result) {
        setActionError(result.error)
      } else {
        setFacultyList((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            profile_id: selectedMember.id,
            invited_email: null,
            full_name: selectedMember.full_name,
            avatar_url: selectedMember.avatar_url,
            position: memberPosition.trim(),
            is_principal_trainer: false,
            status: 'active',
          },
        ])
        setSelectedMember(null)
        setMemberPosition('')
        setShowAddSection(false)
        setToast({ message: 'Faculty member added.', type: 'success' })
      }
    })
  }

  function handleInvite() {
    setActionError(null)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(inviteEmail)) {
      setActionError('Please enter a valid email address.')
      return
    }
    if (!invitePosition.trim()) {
      setActionError('Position is required.')
      return
    }
    startTransition(async () => {
      const result = await inviteFacultyByEmail(schoolSlug, {
        email: inviteEmail.trim(),
        position: invitePosition.trim(),
      })
      if ('error' in result) {
        setActionError(result.error)
      } else {
        setFacultyList((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            profile_id: null,
            invited_email: inviteEmail.trim(),
            position: invitePosition.trim(),
            is_principal_trainer: false,
            status: 'pending',
          },
        ])
        setInviteEmail('')
        setInvitePosition('')
        setShowAddSection(false)
        setToast({ message: 'Invite sent successfully.', type: 'success' })
      }
    })
  }

  function handleConfirmRemove(facultyId: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await removeFacultyMember(schoolSlug, facultyId)
      if ('error' in result) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setFacultyList((prev) => prev.filter((f) => f.id !== facultyId))
        setToast({ message: 'Faculty member removed.', type: 'success' })
      }
      setConfirmRemoveId(null)
    })
  }

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1B3A5C]">Faculty</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage your teaching staff and faculty members.</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowAddSection((v) => !v); setActionError(null) }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#1B3A5C] text-white hover:bg-[#15304d] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Principal Trainer (owner) — always shown */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
        <Avatar name={ownerName} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1B3A5C]">{ownerName}</p>
          <p className="text-xs text-[#4E87A0]">Principal Trainer (you)</p>
        </div>
        <span className="text-xs bg-[#1B3A5C] text-white px-2 py-0.5 rounded-full font-medium">
          Principal Trainer
        </span>
      </div>

      {/* Faculty list */}
      {facultyList.length > 0 ? (
        <div className="space-y-2 mb-6">
          {facultyList.map((member) => {
            const displayName =
              member.full_name ||
              member.invited_email ||
              'Unknown'
            return (
              <div
                key={member.id}
                className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <Avatar name={displayName} src={member.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1B3A5C] truncate">{displayName}</p>
                  {member.invited_email && !member.full_name && (
                    <p className="text-xs text-[#6B7280]">Invited by email</p>
                  )}
                  {member.position && (
                    <p className="text-xs text-[#6B7280]">{member.position}</p>
                  )}
                </div>
                <StatusBadge status={member.status} />
                {confirmRemoveId === member.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmRemove(member.id)}
                      disabled={isPending}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {isPending ? 'Removing...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(null)}
                      className="text-xs font-medium text-[#6B7280] hover:text-[#374151]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(member.id)}
                    className="text-xs font-medium text-[#6B7280] hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-[#6B7280] mb-6 py-4">
          No additional faculty members yet.
        </div>
      )}

      {/* Add Member section */}
      {showAddSection && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#1B3A5C] mb-4">Add Faculty Member</h2>

          {/* Tabs */}
          <div className="flex border-b border-[#E5E7EB] mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === 'search'
                  ? 'border-[#1B3A5C] text-[#1B3A5C]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Search GOYA Members
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invite')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === 'invite'
                  ? 'border-[#1B3A5C] text-[#1B3A5C]'
                  : 'border-transparent text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              Invite by Email
            </button>
          </div>

          {activeTab === 'search' ? (
            <div className="space-y-4">
              {/* Member search */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Search by name
                </label>
                {selectedMember ? (
                  <div className="flex items-center gap-3 border border-[#E5E7EB] rounded-xl px-4 py-2.5">
                    <Avatar name={selectedMember.full_name} src={selectedMember.avatar_url} />
                    <span className="flex-1 text-sm font-medium text-[#1B3A5C]">
                      {selectedMember.full_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="text-xs text-[#6B7280] hover:text-red-600"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search by name..."
                      className="w-full text-sm border border-[#E5E7EB] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin h-4 w-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      </div>
                    )}
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {searchResults.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => handleSelectMember(member)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F8FA] transition-colors text-left"
                          >
                            <Avatar name={member.full_name} src={member.avatar_url} />
                            <span className="text-sm text-[#1B3A5C] font-medium">
                              {member.full_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!isSearching && searchQuery.trim().length > 1 && searchResults.length === 0 && (
                      <p className="mt-2 text-xs text-[#6B7280]">No members found. Try a different name.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Position
                </label>
                <select
                  value={memberPosition}
                  onChange={(e) => setMemberPosition(e.target.value)}
                  className="w-full text-sm border border-[#E5E7EB] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] bg-white"
                >
                  <option value="">Select position...</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {actionError && (
                <p className="text-xs text-red-600">{actionError}</p>
              )}

              <button
                type="button"
                onClick={handleAddMember}
                disabled={!selectedMember || !memberPosition.trim() || isPending}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1B3A5C] text-white hover:bg-[#15304d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? <><Spinner /> Adding...</> : 'Add Member'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full text-sm border border-[#E5E7EB] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Position
                </label>
                <select
                  value={invitePosition}
                  onChange={(e) => setInvitePosition(e.target.value)}
                  className="w-full text-sm border border-[#E5E7EB] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] bg-white"
                >
                  <option value="">Select position...</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {actionError && (
                <p className="text-xs text-red-600">{actionError}</p>
              )}

              <button
                type="button"
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || !invitePosition.trim() || isPending}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1B3A5C] text-white hover:bg-[#15304d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? <><Spinner /> Sending...</> : 'Send Invite'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
