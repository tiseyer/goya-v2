'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { updateOnlinePresence } from '../actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface School {
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  youtube: string | null
  video_platform: 'youtube' | 'vimeo' | null
  video_url: string | null
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: ToastType
  message: string
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const styles: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${styles[type]}`}
    >
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnlinePresenceClient({
  school,
  schoolSlug,
}: {
  school: School
  schoolSlug: string
}) {
  const [website, setWebsite] = useState(school.website ?? '')
  const [instagram, setInstagram] = useState(school.instagram ?? '')
  const [facebook, setFacebook] = useState(school.facebook ?? '')
  const [tiktok, setTiktok] = useState(school.tiktok ?? '')
  const [youtube, setYoutube] = useState(school.youtube ?? '')
  const [videoPlatform, setVideoPlatform] = useState<'youtube' | 'vimeo'>(
    school.video_platform ?? 'youtube'
  )
  const [videoUrl, setVideoUrl] = useState(school.video_url ?? '')

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateOnlinePresence(schoolSlug, {
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        youtube: youtube.trim() || undefined,
        video_platform: videoUrl.trim() ? videoPlatform : null,
        video_url: videoUrl.trim() || undefined,
      })
      if ('error' in result) {
        setToast({ type: 'error', message: result.error })
      } else {
        setToast({ type: 'success', message: 'Online presence saved.' })
      }
    })
  }

  const socialFields = [
    {
      label: 'Website',
      value: website,
      setter: setWebsite,
      placeholder: 'https://your-school.com',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
    },
    {
      label: 'Instagram',
      value: instagram,
      setter: setInstagram,
      placeholder: 'https://instagram.com/yourschool',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      value: facebook,
      setter: setFacebook,
      placeholder: 'https://facebook.com/yourschool',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: 'TikTok',
      value: tiktok,
      setter: setTiktok,
      placeholder: 'https://tiktok.com/@yourschool',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
    {
      label: 'YouTube',
      value: youtube,
      setter: setYoutube,
      placeholder: 'https://youtube.com/@yourschool',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Online Presence</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Add your website and social media links. At least one is required.
        </p>
      </div>

      {/* Social links */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Website &amp; Social Media</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {socialFields.map(({ label, value, setter, placeholder, icon }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">{label}</label>
              <div className="flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#4E87A0]/30 focus-within:border-[#4E87A0] transition-colors">
                <div className="px-3 py-2 bg-[#F7F8FA] text-[#6B7280] border-r border-[#E5E7EB]">
                  {icon}
                </div>
                <input
                  type="url"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video intro */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Video Introduction</h2>
          <p className="mt-1 text-xs text-[#6B7280]">Optional — add an intro video to your school profile.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Platform toggle */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">Platform</label>
            <div className="flex gap-2">
              {(['youtube', 'vimeo'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVideoPlatform(p)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                    videoPlatform === p
                      ? 'bg-[#1B3A5C] border-[#1B3A5C] text-white'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#C4D0DE]'
                  }`}
                >
                  {p === 'youtube' ? 'YouTube' : 'Vimeo'}
                </button>
              ))}
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              {videoPlatform === 'youtube' ? 'YouTube' : 'Vimeo'} Video URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={
                videoPlatform === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://vimeo.com/...'
              }
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4E87A0] text-white text-sm font-semibold hover:bg-[#3A7190] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isPending ? <Spinner /> : null}
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />}
    </div>
  )
}
