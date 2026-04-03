'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile } from '../actions'
import ResetOnboardingButton from './ResetOnboardingButton'
import { displayRole } from '@/lib/roles'

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
  role: string
  member_type: string | null
  mrn: string | null
  subscription_status: string | null
  verification_status: string | null
  onboarding_completed: boolean | null
  created_at: string
  last_login_at: string | null
  wp_user_id: number | null
  wp_roles: string[] | null
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
    </svg>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-800">{value || '—'}</p>
    </div>
  )
}

// ─── Box 1: Profile Info ──────────────────────────────────────────────────────

function ProfileInfoBox({ profile, isAdmin }: { profile: UserProfile; isAdmin: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [role, setRole] = useState(profile.role ?? 'student')
  const [memberType, setMemberType] = useState(profile.member_type ?? '')

  // Saved values for cancel
  const [saved, setSaved] = useState({ fullName, username, role, memberType })

  function handleEdit() {
    setSaved({ fullName, username, role, memberType })
    setEditing(true)
    setError(null)
  }

  function handleCancel() {
    setFullName(saved.fullName)
    setUsername(saved.username)
    setRole(saved.role)
    setMemberType(saved.memberType)
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateUserProfile(profile.id, {
      full_name: fullName || null,
      username: username || null,
      role,
      member_type: memberType || null,
    })
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Save failed')
      return
    }
    setSaved({ fullName, username, role, memberType })
    setEditing(false)
    router.refresh()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Profile Info</h2>
        {!editing && (
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Edit"
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="wellness_practitioner">Wellness Practitioner</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Member Type</label>
            <input
              type="text"
              value={memberType}
              onChange={e => setMemberType(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">MRN</p>
            <p className="text-sm text-slate-500 font-mono">{profile.mrn || '—'}</p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1B3A5C] hover:bg-[#15304e] rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="Full Name" value={fullName} />
          <ReadOnlyField label="Username" value={username ? `@${username}` : null} />
          <ReadOnlyField label="Role" value={displayRole(role).replace(/_/g, ' ')} />
          <ReadOnlyField label="Member Type" value={memberType.replace(/_/g, ' ')} />
          <ReadOnlyField label="MRN" value={profile.mrn} />
        </div>
      )}
    </div>
  )
}

// ─── Box 2: Account Status ────────────────────────────────────────────────────

function AccountStatusBox({ profile, isAdmin }: { profile: UserProfile; isAdmin: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [subscriptionStatus, setSubscriptionStatus] = useState(profile.subscription_status ?? 'guest')
  const [verificationStatus, setVerificationStatus] = useState(profile.verification_status ?? 'unverified')
  const [onboardingCompleted, setOnboardingCompleted] = useState(profile.onboarding_completed ?? false)

  const [saved, setSaved] = useState({ subscriptionStatus, verificationStatus, onboardingCompleted })

  function handleEdit() {
    setSaved({ subscriptionStatus, verificationStatus, onboardingCompleted })
    setEditing(true)
    setError(null)
  }

  function handleCancel() {
    setSubscriptionStatus(saved.subscriptionStatus)
    setVerificationStatus(saved.verificationStatus)
    setOnboardingCompleted(saved.onboardingCompleted)
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateUserProfile(profile.id, {
      subscription_status: subscriptionStatus,
      verification_status: verificationStatus,
      onboarding_completed: onboardingCompleted,
    })
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Save failed')
      return
    }
    setSaved({ subscriptionStatus, verificationStatus, onboardingCompleted })
    setEditing(false)
    router.refresh()
  }

  const onboardingLabel = onboardingCompleted ? 'Completed' : 'Incomplete'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Account Status</h2>
        {!editing && (
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Edit"
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Subscription Status</label>
            <select
              value={subscriptionStatus}
              onChange={e => setSubscriptionStatus(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
            >
              <option value="guest">Guest</option>
              <option value="member">Member</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Verification Status</label>
            <select
              value={verificationStatus}
              onChange={e => setVerificationStatus(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
            >
              <option value="unverified">Unverified</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Onboarding Status</label>
            <select
              value={onboardingCompleted ? 'completed' : 'incomplete'}
              onChange={e => setOnboardingCompleted(e.target.value === 'completed')}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
            >
              <option value="incomplete">Incomplete</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1B3A5C] hover:bg-[#15304e] rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="Subscription Status" value={subscriptionStatus} />
            <ReadOnlyField label="Verification Status" value={verificationStatus} />
            <ReadOnlyField label="Onboarding Status" value={onboardingLabel} />
          </div>
          <div className="pt-2 border-t border-slate-100">
            <ResetOnboardingButton
              userId={profile.id}
              userName={profile.full_name || profile.username || profile.email || 'Unknown User'}
              isAdmin={isAdmin}
            />
            {!isAdmin && (
              <p className="text-xs text-slate-400 mt-2">Only admins can reset onboarding.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Box 3: Contact & Dates (read-only) ──────────────────────────────────────

function ContactDatesBox({ profile }: { profile: UserProfile }) {
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const lastLogin = profile.last_login_at
    ? new Date(profile.last_login_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Contact &amp; Dates</h2>
        <span className="text-xs text-slate-400">Read-only</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReadOnlyField label="Email" value={profile.email} />
        <ReadOnlyField label="Member Since" value={memberSince} />
        <ReadOnlyField label="Last Login" value={lastLogin} />
      </div>
    </div>
  )
}

// ─── Box 4: WP Migration Info (read-only, collapsible) ───────────────────────

function WPMigrationBox({ profile }: { profile: UserProfile }) {
  const hasWp = (profile.wp_roles && profile.wp_roles.length > 0) || profile.wp_user_id != null
  const [open, setOpen] = useState(false)

  if (!hasWp) return null

  const wpRolesStr = profile.wp_roles && profile.wp_roles.length > 0
    ? profile.wp_roles.join(', ')
    : null

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-sm font-semibold text-slate-700">WP Migration Info</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Read-only</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="WP Roles" value={wpRolesStr} />
          <ReadOnlyField label="WP User ID" value={profile.wp_user_id != null ? String(profile.wp_user_id) : null} />
        </div>
      )}
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export default function UserDetailClient({
  profile,
  isAdmin,
}: {
  profile: UserProfile
  isAdmin: boolean
}) {
  return (
    <div className="space-y-4">
      <ProfileInfoBox profile={profile} isAdmin={isAdmin} />
      <AccountStatusBox profile={profile} isAdmin={isAdmin} />
      <ContactDatesBox profile={profile} />
      <WPMigrationBox profile={profile} />
    </div>
  )
}
