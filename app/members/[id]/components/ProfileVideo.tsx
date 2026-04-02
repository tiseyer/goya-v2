'use client'

import { useState } from 'react'

interface ProfileVideoProps {
  youtubeIntroUrl: string
}

/**
 * Extracts a YouTube video ID from various URL formats:
 *   youtube.com/watch?v=ID
 *   youtu.be/ID
 *   youtube.com/embed/ID
 */
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('?')[0] || null
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      // embed URL: /embed/ID
      const parts = u.pathname.split('/')
      const embedIdx = parts.indexOf('embed')
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1]
    }
  } catch {
    // fallback: try regex
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
    return match?.[1] ?? null
  }
  return null
}

/**
 * Extracts a Vimeo video ID from urls like vimeo.com/12345678.
 */
function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean)
      return parts[0] ?? null
    }
  } catch {
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match?.[1] ?? null
  }
  return null
}

export default function ProfileVideo({ youtubeIntroUrl }: ProfileVideoProps) {
  const [playing, setPlaying] = useState(false)

  const isVimeo = youtubeIntroUrl.includes('vimeo')
  const videoId = isVimeo
    ? extractVimeoId(youtubeIntroUrl)
    : extractYouTubeId(youtubeIntroUrl)

  // If we can't parse the ID there's nothing to show
  if (!videoId) return null

  const embedSrc = isVimeo
    ? `https://player.vimeo.com/video/${videoId}?autoplay=1`
    : `https://www.youtube.com/embed/${videoId}?autoplay=1`

  const thumbnailSrc = isVimeo
    ? null
    : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <section>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
        {playing ? (
          <iframe
            src={embedSrc}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Intro video"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full group focus:outline-none"
            aria-label="Play intro video"
          >
            {/* Thumbnail */}
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt="Video thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              /* Vimeo placeholder */
              <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center">
                <span className="text-white text-sm opacity-60">Vimeo video</span>
              </div>
            )}

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
                {/* Play triangle */}
                <svg
                  className="w-7 h-7 text-white ml-1"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>
    </section>
  )
}
