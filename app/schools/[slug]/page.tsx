import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseService } from '@/lib/supabase/service'
import PageContainer from '@/app/components/ui/PageContainer'

export const dynamic = 'force-dynamic'

// ─── Helper components ───────────────────────────────────────────────────────

function PillBadge({ label }: { label: string }) {
  return (
    <span className="inline-block bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
    </span>
  )
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
      <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
      {title}
    </h2>
  )
}

// ─── Video embed helper ───────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/
  )
  return match?.[1] ?? null
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match?.[1] ?? null
}

function getEmbedUrl(videoUrl: string, platform: string | null): string | null {
  const p = platform?.toLowerCase() ?? ''
  if (p === 'youtube' || videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) {
    const id = extractYouTubeId(videoUrl)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (p === 'vimeo' || videoUrl.includes('vimeo')) {
    const id = extractVimeoId(videoUrl)
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatDeliveryFormat(format: string | null): string {
  if (!format) return ''
  const map: Record<string, string> = {
    in_person: 'In-Person',
    online: 'Online',
    hybrid: 'Hybrid',
    'in-person': 'In-Person',
  }
  return map[format.toLowerCase()] ?? format
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SchoolProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getSupabaseService() as any

  // Fetch approved school only — non-approved or missing returns 404
  const { data: schoolRaw } = await service
    .from('schools')
    .select(`
      id, name, slug, status, bio, short_bio, description,
      city, country, established_year, website, instagram, youtube,
      facebook, tiktok, video_url, video_platform,
      practice_styles, programs_offered, course_delivery_format,
      lineage, languages, location_city, location_country,
      logo_url, cover_image_url
    `)
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!schoolRaw) notFound()

  const school = schoolRaw

  // Fetch designations and faculty in parallel
  const [designationsRes, facultyRes] = await Promise.all([
    service.from('school_designations').select('*').eq('school_id', school.id),
    service
      .from('school_faculty')
      .select('*, profile:profile_id (id, full_name, avatar_url)')
      .eq('school_id', school.id),
  ])

  const designations: Array<{ id: string; designation_type: string; status: string }> =
    designationsRes.data ?? []

  const facultyRaw: Array<{
    id: string
    position: string | null
    is_principal_trainer: boolean | null
    invited_email: string | null
    status: string
    profile_id: string | null
    profile: { id: string; full_name: string | null; avatar_url: string | null } | null
  }> = (facultyRes.data ?? []).map(
    (f: { profile: unknown; [key: string]: unknown }) => ({
      ...f,
      profile: Array.isArray(f.profile) ? (f.profile[0] ?? null) : f.profile,
    })
  )

  // Sort: Principal Trainer first, then others. Only show those with a GOYA profile.
  const faculty = facultyRaw
    .filter((f) => f.profile !== null)
    .sort((a, b) => {
      if (a.is_principal_trainer && !b.is_principal_trainer) return -1
      if (!a.is_principal_trainer && b.is_principal_trainer) return 1
      return 0
    })

  // Active designations only
  const activeDesignations = designations.filter((d) => d.status === 'active')

  // Location display
  const locationDisplay =
    school.location_city || school.location_country
      ? [school.location_city, school.location_country].filter(Boolean).join(', ')
      : school.city || school.country
        ? [school.city, school.country].filter(Boolean).join(', ')
        : school.course_delivery_format?.toLowerCase() === 'online'
          ? 'Online School'
          : null

  // Lineage pills (comma-separated string or array)
  const lineagePills: string[] = Array.isArray(school.lineage)
    ? school.lineage
    : typeof school.lineage === 'string' && school.lineage.trim()
      ? school.lineage.split(',').map((l: string) => l.trim()).filter(Boolean)
      : []

  // Video embed
  const embedUrl = school.video_url ? getEmbedUrl(school.video_url, school.video_platform) : null

  // Social links presence
  const hasSocialLinks =
    school.website || school.instagram || school.youtube || school.facebook || school.tiktok

  // About text (prefer bio, then description)
  const aboutText = school.bio || school.description || null

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-primary relative overflow-hidden flex items-center h-[240px] sm:h-[260px] md:h-[280px]">
        {/* Decorative blur orb */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-light opacity-[0.05] rounded-full blur-3xl translate-x-1/2 -translate-y-1/4" />
        </div>

        <PageContainer className="relative">
          {/* Back link */}
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-4 transition-colors group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#4E87A0]/20 flex items-center justify-center overflow-hidden ring-4 ring-white/10 shadow-2xl">
                {school.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={school.logo_url}
                    alt={school.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {school.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="text-left pb-1">
              {/* Designation badges */}
              {activeDesignations.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3 justify-start">
                  {activeDesignations.map((d) => (
                    <span
                      key={d.id}
                      className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-white/15 text-white border border-white/20"
                    >
                      {d.designation_type}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                {school.name}
              </h1>

              {locationDisplay && (
                <div className="flex items-center justify-start gap-1.5 text-slate-400 text-sm mt-1">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {locationDisplay}
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <PageContainer className="-mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            {aboutText && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <SectionHeading title="About" />
                <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">
                  {aboutText}
                </p>
              </div>
            )}

            {/* Practice Styles */}
            {Array.isArray(school.practice_styles) && school.practice_styles.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <SectionHeading title="Practice Styles" />
                <div className="flex flex-wrap gap-2">
                  {(school.practice_styles as string[]).map((style) => (
                    <PillBadge key={style} label={style} />
                  ))}
                </div>
              </div>
            )}

            {/* Programs Offered */}
            {Array.isArray(school.programs_offered) && school.programs_offered.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <SectionHeading title="Programs Offered" />
                <div className="flex flex-wrap gap-2">
                  {(school.programs_offered as string[]).map((program) => (
                    <PillBadge key={program} label={program} />
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {Array.isArray(school.languages) && school.languages.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <SectionHeading title="Languages" />
                <div className="flex flex-wrap gap-2">
                  {(school.languages as string[]).map((lang) => (
                    <PillBadge key={lang} label={lang} />
                  ))}
                </div>
              </div>
            )}

            {/* Lineage */}
            {lineagePills.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <SectionHeading title="Lineage" />
                <div className="flex flex-wrap gap-2">
                  {lineagePills.map((l) => (
                    <PillBadge key={l} label={l} />
                  ))}
                </div>
              </div>
            )}

            {/* Video intro */}
            {embedUrl && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <SectionHeading title="Video Introduction" />
                <div className="aspect-video rounded-xl overflow-hidden">
                  <iframe
                    src={embedUrl}
                    title={`${school.name} video introduction`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

          </div>

          {/* Right column — sidebar */}
          <div className="space-y-6">

            {/* Details card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <SectionHeading title="Details" />
              <dl className="space-y-3">
                {school.established_year && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-sm text-slate-500">Established</dt>
                    <dd className="text-sm font-semibold text-slate-800">{school.established_year}</dd>
                  </div>
                )}
                {school.course_delivery_format && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-sm text-slate-500">Delivery</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {formatDeliveryFormat(school.course_delivery_format)}
                    </dd>
                  </div>
                )}
                {/* GOYA Verified badge */}
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    GOYA Verified School
                  </span>
                </div>
              </dl>
            </div>

            {/* Social links */}
            {hasSocialLinks && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Connect</h2>
                <div className="space-y-2.5">
                  {school.website && (
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <span className="truncate">Website</span>
                    </a>
                  )}
                  {school.instagram && (
                    <a
                      href={school.instagram.startsWith('http') ? school.instagram : `https://instagram.com/${school.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>
                      <span className="truncate">Instagram</span>
                    </a>
                  )}
                  {school.youtube && (
                    <a
                      href={school.youtube.startsWith('http') ? school.youtube : `https://youtube.com/${school.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                        </svg>
                      </div>
                      <span className="truncate">YouTube</span>
                    </a>
                  )}
                  {school.facebook && (
                    <a
                      href={school.facebook.startsWith('http') ? school.facebook : `https://facebook.com/${school.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <span className="truncate">Facebook</span>
                    </a>
                  )}
                  {school.tiktok && (
                    <a
                      href={school.tiktok.startsWith('http') ? school.tiktok : `https://tiktok.com/@${school.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.28 8.28 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
                        </svg>
                      </div>
                      <span className="truncate">TikTok</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Faculty card */}
            {faculty.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <SectionHeading title="Faculty" />
                <div className="space-y-4">
                  {faculty.map((f) => {
                    const profile = f.profile!
                    const name = profile.full_name ?? 'GOYA Member'
                    return (
                      <div key={f.id} className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-[#4E87A0]/10 flex items-center justify-center overflow-hidden shrink-0">
                          {profile.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={profile.avatar_url}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-[#4E87A0]">
                              {name[0]?.toUpperCase() ?? '?'}
                            </span>
                          )}
                        </div>
                        {/* Name + position */}
                        <div className="min-w-0">
                          <Link
                            href={`/members/${profile.id}`}
                            className="text-sm font-semibold text-slate-800 hover:text-[#4E87A0] transition-colors leading-tight block truncate"
                          >
                            {name}
                          </Link>
                          <p className="text-xs text-slate-500 truncate">
                            {f.is_principal_trainer ? 'Principal Trainer' : (f.position ?? 'Faculty')}
                          </p>
                        </div>
                        {/* Principal Trainer label */}
                        {f.is_principal_trainer && (
                          <span className="ml-auto shrink-0 inline-block bg-[#4E87A0]/10 text-[#4E87A0] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            PT
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </PageContainer>
    </div>
  )
}
