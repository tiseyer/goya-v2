'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SwitchToButton from './SwitchToButton'
import { displayRole, isAdminOrAbove, isSuperuser } from '@/lib/roles'

export type UserRow = {
  id: string
  email: string
  full_name: string | null
  username: string | null
  role: string
  subscription_status: string | null
  is_verified: boolean
  created_at: string
  avatar_url: string | null
  wp_roles?: string[]
  wp_registered_at?: string | null
}

const ROLE_BADGE: Record<string, string> = {
  student:               'bg-slate-100 text-slate-600',
  teacher:               'bg-blue-100 text-blue-700',
  wellness_practitioner: 'bg-emerald-100 text-emerald-700',
  moderator:             'bg-orange-100 text-orange-700',
  admin:                 'bg-red-100 text-red-700',
}

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase()
  }
  return (email[0] ?? 'U').toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminUsersTable({ users, adminRole }: { users: UserRow[]; adminRole?: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [showAdminConfirm, setShowAdminConfirm] = useState(false)
  const [adminConfirmText, setAdminConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const allSelected = users.length > 0 && selected.size === users.length
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(users.map(u => u.id)))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const selectedUsers = users.filter(u => selected.has(u.id))
  const hasAdminTargets = selectedUsers.some(u => u.role === 'admin')
  const callerIsSuperuser = isSuperuser(adminRole)

  async function handleBulkDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')

      setShowModal(false)
      setSelected(new Set())

      if (data.errors?.length > 0) {
        setToast({ type: 'error', message: `${data.deleted} deleted. Warnings: ${data.errors.join('; ')}` })
      } else {
        setToast({ type: 'success', message: `${data.deleted} user${data.deleted !== 1 ? 's' : ''} deleted` })
      }
      setTimeout(() => setToast(null), 5000)
      router.refresh()
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Delete failed' })
      setTimeout(() => setToast(null), 5000)
    } finally {
      setDeleting(false)
    }
  }

  function handleDeleteClick() {
    // If caller is superuser and there are admin targets, require second confirmation
    if (callerIsSuperuser && hasAdminTargets) {
      setShowModal(false)
      setShowAdminConfirm(true)
    } else {
      handleBulkDelete()
    }
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
        <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-sm font-medium text-[#374151]">No users found</p>
        <p className="text-xs text-[#6B7280] mt-1">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="accent-[#1B3A5C] rounded"
                  />
                </th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {users.map(user => {
                const displayedRole = displayRole(user.role)
                return (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${selected.has(user.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleOne(user.id)}
                        className="accent-[#1B3A5C] rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="group/avatar relative w-8 h-8 rounded-full bg-[#00B5A3] flex items-center justify-center text-white text-[10px] font-black shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              {/* Hover preview */}
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[120px] h-[120px] rounded-xl overflow-hidden shadow-xl border border-slate-200 bg-white opacity-0 scale-95 transition-all duration-200 group-hover/avatar:opacity-100 group-hover/avatar:scale-100 z-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              </div>
                            </>
                          ) : (
                            getInitials(user.full_name, user.email)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1B3A5C] truncate max-w-[160px]">
                            {user.full_name || '—'}
                          </p>
                          {user.username && (
                            <p className="text-xs text-[#6B7280] truncate max-w-[160px]">@{user.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#374151] truncate max-w-[200px] block">{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[displayedRole] ?? 'bg-slate-100 text-slate-600'}`}>
                          {displayedRole.replace(/_/g, ' ')}
                        </span>
                        {user.wp_roles && user.wp_roles.length > 0 && user.wp_roles.map((wr: string) => (
                          <span key={wr} className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                            {wr.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.subscription_status === 'member' ? (
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#00B5A3] text-white">Member</span>
                      ) : (
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#E5E7EB] text-[#6B7280]">Guest</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.is_verified ? (
                        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                        </svg>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#6B7280] flex items-center gap-1.5">
                        {formatDate(user.wp_registered_at || user.created_at)}
                        {user.wp_registered_at && (
                          <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-slate-100 text-slate-400">WP</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#374151] hover:text-[#1B3A5C] hover:border-[#1B3A5C] transition-colors"
                        >
                          View
                        </Link>
                        {isAdminOrAbove(adminRole) && !isAdminOrAbove(user.role) && user.role !== 'moderator' && (
                          <SwitchToButton userId={user.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1B3A5C] text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-6 z-50">
          <span className="text-sm font-medium">{selected.size} user{selected.size !== 1 ? 's' : ''} selected</span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-white/70 hover:text-white">
            Clear
          </button>
        </div>
      )}

      {/* First Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#1B3A5C]">Delete {selected.size} user{selected.size !== 1 ? 's' : ''}?</h3>
            <p className="text-sm text-slate-600">
              This will permanently delete these users from Supabase Auth and their profiles. This cannot be undone.
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {selectedUsers.slice(0, 10).map(u => {
                const uRole = u.role as string
                return (
                  <p key={u.id} className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{u.full_name || '—'}</span> — {u.email}
                    {uRole === 'superuser' && (
                      <span className="ml-1 text-red-500 font-medium">(cannot be deleted)</span>
                    )}
                    {uRole === 'admin' && !callerIsSuperuser && (
                      <span className="ml-1 text-red-500 font-medium">(admin — will be skipped)</span>
                    )}
                    {uRole === 'admin' && callerIsSuperuser && (
                      <span className="ml-1 text-orange-500 font-medium">(admin — extra confirmation required)</span>
                    )}
                  </p>
                )
              })}
              {selectedUsers.length > 10 && (
                <p className="text-xs text-slate-400">+ {selectedUsers.length - 10} more</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-[#E5E7EB] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {deleting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Modal — admin deletion (superuser only) */}
      {showAdminConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-700">Confirm admin deletion</h3>
            <p className="text-sm text-slate-600">
              You are about to permanently delete an admin account. This cannot be undone.
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-red-50 rounded-lg p-3">
              {selectedUsers.filter(u => (u.role as string) === 'admin').map(u => (
                <p key={u.id} className="text-xs text-red-800 font-medium">
                  {u.full_name || '—'} — {u.email}
                </p>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-red-700">DELETE ADMIN</span> to confirm
              </label>
              <input
                type="text"
                value={adminConfirmText}
                onChange={(e) => setAdminConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="DELETE ADMIN"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowAdminConfirm(false); setAdminConfirmText('') }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowAdminConfirm(false); setAdminConfirmText(''); handleBulkDelete() }}
                disabled={adminConfirmText !== 'DELETE ADMIN' || deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                Confirm deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  )
}
