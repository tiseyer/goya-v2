'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Post, PostType, createPost, uploadPostMedia } from '@/lib/feed'

// ─── Sub-component props types ────────────────────────────────────────────────

interface PhotoPanelProps {
  images: File[]
  onImagesChange: (files: File[]) => void
}

interface VideoPanelProps {
  video: File | null
  onVideoChange: (file: File | null) => void
}

interface AudioPanelProps {
  audio: File | null
  onAudioChange: (file: File | null) => void
}

interface GifPanelProps {
  gifUrl: string
  onGifUrlChange: (url: string) => void
  gifPreviewOk: boolean
  onGifPreviewOk: (ok: boolean) => void
}

interface PollPanelProps {
  options: string[]
  onOptionsChange: (opts: string[]) => void
}

// ─── Media sub-components ─────────────────────────────────────────────────────

function PhotoPanel({ images, onImagesChange }: PhotoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previews = images.map((f) => URL.createObjectURL(f))

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, 4 - images.length)
          onImagesChange([...images, ...files].slice(0, 4))
        }}
      />
      {images.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#E5E7EB] rounded-xl py-8 text-[#9CA3AF] text-sm hover:border-[#4E87A0] hover:text-[#4E87A0] transition-colors"
        >
          📷 Click to upload photos (max 4)
        </button>
      ) : (
        <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-video">
              <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
              <button
                onClick={() => onImagesChange(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-video border-2 border-dashed border-[#E5E7EB] rounded-xl text-[#9CA3AF] hover:border-[#4E87A0] transition-colors text-sm"
            >
              + Add
            </button>
          )}
        </div>
      )}
      <p className="text-xs text-[#9CA3AF]">{images.length}/4 images</p>
    </div>
  )
}

function VideoPanel({ video, onVideoChange }: VideoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const MAX_MB = 100

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (file.size > MAX_MB * 1024 * 1024) {
            alert(`Video must be under ${MAX_MB}MB`)
            return
          }
          onVideoChange(file)
        }}
      />
      {!video ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#E5E7EB] rounded-xl py-8 text-[#9CA3AF] text-sm hover:border-[#4E87A0] hover:text-[#4E87A0] transition-colors"
        >
          🎥 Click to upload video (max 100MB)
        </button>
      ) : (
        <div className="flex items-center justify-between bg-[#F3F4F6] rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#374151] truncate max-w-xs">{video.name}</p>
            <p className="text-xs text-[#9CA3AF]">{(video.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <button
            onClick={() => onVideoChange(null)}
            className="text-[#9CA3AF] hover:text-red-500 text-xs"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

function AudioPanel({ audio, onAudioChange }: AudioPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const MAX_MB = 50

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (file.size > MAX_MB * 1024 * 1024) {
            alert(`Audio must be under ${MAX_MB}MB`)
            return
          }
          onAudioChange(file)
        }}
      />
      {!audio ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#E5E7EB] rounded-xl py-8 text-[#9CA3AF] text-sm hover:border-[#4E87A0] hover:text-[#4E87A0] transition-colors"
        >
          🎵 Click to upload audio (max 50MB)
        </button>
      ) : (
        <div className="flex items-center justify-between bg-[#F3F4F6] rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#374151] truncate max-w-xs">{audio.name}</p>
            <p className="text-xs text-[#9CA3AF]">{(audio.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <button
            onClick={() => onAudioChange(null)}
            className="text-[#9CA3AF] hover:text-red-500 text-xs"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

function GifPanel({ gifUrl, onGifUrlChange, gifPreviewOk, onGifPreviewOk }: GifPanelProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Paste a GIF URL..."
        value={gifUrl}
        onChange={(e) => {
          onGifUrlChange(e.target.value)
          onGifPreviewOk(false)
        }}
        className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4E87A0]"
      />
      {gifUrl && (
        <div className="relative">
          <img
            src={gifUrl}
            alt="GIF preview"
            onLoad={() => onGifPreviewOk(true)}
            onError={() => onGifPreviewOk(false)}
            className="w-full rounded-xl max-h-64 object-contain bg-[#F3F4F6]"
          />
          {!gifPreviewOk && gifUrl && (
            <p className="text-xs text-red-500 mt-1">Invalid GIF URL</p>
          )}
          {gifPreviewOk && (
            <button
              onClick={() => {
                onGifUrlChange('')
                onGifPreviewOk(false)
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PollPanel({ options, onOptionsChange }: PollPanelProps) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={opt}
            maxLength={100}
            placeholder={`Option ${i + 1}`}
            onChange={(e) => {
              const next = [...options]
              next[i] = e.target.value
              onOptionsChange(next)
            }}
            className="flex-1 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4E87A0]"
          />
          <button
            disabled={options.length <= 2}
            onClick={() => onOptionsChange(options.filter((_, j) => j !== i))}
            className="w-8 h-10 text-[#9CA3AF] hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ))}
      {options.length < 6 && (
        <button
          onClick={() => onOptionsChange([...options, ''])}
          className="text-sm text-[#4E87A0] hover:underline"
        >
          + Add option
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type MediaTab = 'none' | 'photo' | 'video' | 'audio' | 'gif' | 'poll'

interface PostComposerProps {
  currentUserId: string
  currentUserRole: string
  currentUserFirstName: string
  currentUserAvatar?: string | null
  onPostCreated: (post: Post) => void
}

export default function PostComposer({
  currentUserId,
  currentUserFirstName,
  onPostCreated,
}: PostComposerProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [activeTab, setActiveTab] = useState<MediaTab>('none')
  const [images, setImages] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [audio, setAudio] = useState<File | null>(null)
  const [gifUrl, setGifUrl] = useState('')
  const [gifPreviewOk, setGifPreviewOk] = useState(false)
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [charCount, setCharCount] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', currentUserId)
      .single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null))
  }, [currentUserId])

  const handleTextareaResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleCancel = () => {
    setIsExpanded(false)
    setContent('')
    setCharCount(0)
    setActiveTab('none')
    setImages([])
    setVideo(null)
    setAudio(null)
    setGifUrl('')
    setGifPreviewOk(false)
    setPollOptions(['', ''])
    setError(null)
  }

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false
    if (activeTab === 'poll') {
      return pollOptions.filter((o) => o.trim()).length >= 2
    }
    if (activeTab === 'photo') return images.length > 0 || content.trim().length > 0
    if (activeTab === 'video') return video !== null || content.trim().length > 0
    if (activeTab === 'audio') return audio !== null || content.trim().length > 0
    if (activeTab === 'gif') return gifPreviewOk || content.trim().length > 0
    return content.trim().length > 0
  }, [isSubmitting, activeTab, pollOptions, images, video, audio, gifPreviewOk, content])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const mediaUrls: string[] = []
      let resolvedGifUrl: string | null = null
      let postType: PostType = 'text'

      if (activeTab === 'photo' && images.length > 0) {
        postType = 'image'
        for (const img of images) {
          const url = await uploadPostMedia('post-images', currentUserId, img)
          mediaUrls.push(url)
        }
      } else if (activeTab === 'video' && video) {
        postType = 'video'
        const url = await uploadPostMedia('post-videos', currentUserId, video)
        mediaUrls.push(url)
      } else if (activeTab === 'audio' && audio) {
        postType = 'audio'
        const url = await uploadPostMedia('post-audio', currentUserId, audio)
        mediaUrls.push(url)
      } else if (activeTab === 'gif' && gifPreviewOk) {
        postType = 'gif'
        resolvedGifUrl = gifUrl
      } else if (activeTab === 'poll') {
        postType = 'poll'
      }

      const post = await createPost(
        currentUserId,
        content.trim() || null,
        postType,
        mediaUrls,
        resolvedGifUrl,
        activeTab === 'poll' ? pollOptions.filter((o) => o.trim()) : []
      )

      // Track post_created engagement event
      try {
        const { trackPostCreated } = await import('@/lib/analytics/tracking')
        trackPostCreated()
      } catch { /* analytics non-critical */ }
      onPostCreated(post)
      handleCancel()
    } catch (err) {
      console.error(err)
      setError('Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const mediaTabs: { tab: MediaTab; icon: string; label: string }[] = [
    { tab: 'photo', icon: '📷', label: 'Photo' },
    { tab: 'video', icon: '🎥', label: 'Video' },
    { tab: 'gif', icon: 'GIF', label: 'GIF' },
    { tab: 'poll', icon: '📊', label: 'Poll' },
    { tab: 'audio', icon: '🎵', label: 'Audio' },
  ]

  const AvatarNode = (
    <>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={currentUserFirstName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#4E87A0] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {currentUserFirstName.charAt(0).toUpperCase()}
        </div>
      )}
    </>
  )

  // ── Collapsed ──
  if (!isExpanded) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          {AvatarNode}
          <div className="flex-1 bg-[#F3F4F6] rounded-xl px-4 py-2.5 text-sm text-[#9CA3AF]">
            Share what&apos;s on your mind, {currentUserFirstName}...
          </div>
        </div>

        <div className="flex gap-1 mt-3 pt-3 border-t border-[#F3F4F6]">
          {mediaTabs.map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setIsExpanded(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#4E87A0] transition-colors"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Expanded ──
  return (
    <div className="bg-white rounded-2xl border border-[#4E87A0] shadow-sm p-4 space-y-3">
      {/* Author row */}
      <div className="flex gap-3">
        {AvatarNode}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setCharCount(e.target.value.length)
            }}
            placeholder={`Share what's on your mind, ${currentUserFirstName}...`}
            className="w-full resize-none outline-none text-sm text-[#374151] placeholder:text-[#9CA3AF] min-h-[80px]"
            rows={3}
            maxLength={5000}
            onInput={handleTextareaResize}
          />
        </div>
      </div>

      {/* Char count */}
      <div className="text-right">
        <span
          className={`text-xs ${charCount > 4800 ? 'text-red-500 font-semibold' : 'text-[#9CA3AF]'}`}
        >
          {charCount}/5000
        </span>
      </div>

      {/* Media tab buttons */}
      <div className="flex gap-1 border-t border-b border-[#F3F4F6] py-2">
        {mediaTabs.map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab((prev) => (prev === tab ? 'none' : tab))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#4E87A0]/10 text-[#4E87A0]'
                : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#4E87A0]'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Active media panel */}
      {activeTab === 'photo' && (
        <PhotoPanel images={images} onImagesChange={setImages} />
      )}
      {activeTab === 'video' && (
        <VideoPanel video={video} onVideoChange={setVideo} />
      )}
      {activeTab === 'audio' && (
        <AudioPanel audio={audio} onAudioChange={setAudio} />
      )}
      {activeTab === 'gif' && (
        <GifPanel
          gifUrl={gifUrl}
          onGifUrlChange={setGifUrl}
          gifPreviewOk={gifPreviewOk}
          onGifPreviewOk={setGifPreviewOk}
        />
      )}
      {activeTab === 'poll' && (
        <PollPanel options={pollOptions} onOptionsChange={setPollOptions} />
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="px-5 py-2 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Post
        </button>
      </div>
    </div>
  )
}
