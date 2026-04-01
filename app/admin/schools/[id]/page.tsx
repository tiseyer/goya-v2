import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseService } from '@/lib/supabase/service'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import PageContainer from '@/app/components/ui/PageContainer'
import ApproveRejectBar from './ApproveRejectBar'

export const dynamic = 'force-dynamic'

type SchoolStatus = 'pending' | 'pending_review' | 'approved' | 'rejected' | 'suspended'

const STATUS_STYLES: Record<SchoolStatus, string> = {
  pending:        'bg-amber-50 text-amber-700 border border-amber-200',
  pending_review: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  approved:       'bg-green-50 text-green-700 border border-green-200',
  rejected:       'bg-rose-50 text-rose-700 border border-rose-200',
  suspended:      'bg-orange-50 text-orange-700 border border-orange-200',
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function PillBadge({ label }: { label: string }) {
  return (
    <span className="inline-block bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
    </span>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-50 last:border-0">
      <dt className="text-xs font-medium text-slate-500 pt-0.5">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-800 break-words">{value ?? <span className="text-slate-300">—</span>}</dd>
    </div>
  )
}

export default async function AdminSchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = getSupabaseService() as any
  const supabase = await createSupabaseServerClient()

  // Fetch school with owner join
  const { data: schoolRaw } = await service
    .from('schools')
    .select(`
      id, name, slug, status, bio, short_bio, description,
      city, country, established_year, website, instagram, youtube,
      facebook, tiktok, video_url, video_platform,
      practice_styles, programs_offered, course_delivery_format,
      lineage, languages, location_address, location_city, location_country,
      location_lat, location_lng, logo_url, cover_image_url,
      is_insured, onboarding_completed, onboarding_completed_at,
      approved_at, approved_by, rejection_reason, owner_id, created_at,
      owner:owner_id (id, full_name, email, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!schoolRaw) notFound()

  const school = {
    ...schoolRaw,
    owner: Array.isArray(schoolRaw.owner) ? schoolRaw.owner[0] ?? null : schoolRaw.owner,
  }

  // Fetch related data in parallel
  const [designationsRes, facultyRes, documentsRes] = await Promise.all([
    service.from('school_designations').select('*').eq('school_id', id),
    service.from('school_faculty').select('*, profile:profile_id (id, full_name, email, avatar_url)').eq('school_id', id),
    service.from('school_verification_documents').select('*').eq('school_id', id),
  ])

  const designations = designationsRes.data ?? []
  const facultyRaw = facultyRes.data ?? []
  const faculty = facultyRaw.map((f: { profile: unknown; [key: string]: unknown }) => ({
    ...f,
    profile: Array.isArray(f.profile) ? f.profile[0] ?? null : f.profile,
  }))
  const documents = documentsRes.data ?? []

  // Generate signed URLs for documents
  const documentsWithUrls = await Promise.all(
    documents.map(async (doc: {
      id: string
      file_url: string | null
      file_name: string | null
      file_size: number | null
      document_type: string
      status: string
      uploaded_at: string | null
    }) => {
      let signedUrl: string | null = null
      if (doc.file_url) {
        // Extract path from full URL if needed
        let path = doc.file_url
        const bucketMarker = '/school-documents/'
        const idx = path.indexOf(bucketMarker)
        if (idx !== -1) {
          path = path.slice(idx + bucketMarker.length)
        }
        const { data } = await supabase.storage
          .from('school-documents')
          .createSignedUrl(path, 3600)
        signedUrl = data?.signedUrl ?? null
      }
      return { ...doc, signedUrl }
    })
  )

  const status = school.status as SchoolStatus
  const isPendingAction = status === 'pending' || status === 'pending_review'

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <PageContainer>
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/inbox?tab=schools"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1B3A5C] transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Inbox
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-xl bg-[#4E87A0]/10 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                {school.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-[#4E87A0]">{school.name?.[0]?.toUpperCase() ?? '?'}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1B3A5C]">{school.name}</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Registered {school.created_at ? new Date(school.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
            <span className={`inline-block text-sm px-3 py-1.5 rounded-full font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
              {status === 'pending_review' ? 'In Review' : status}
            </span>
          </div>
        </div>

        {/* Approve/Reject Bar */}
        {isPendingAction && (
          <ApproveRejectBar schoolId={id} />
        )}

        {/* Rejection reason alert */}
        {status === 'rejected' && school.rejection_reason && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-rose-700 mb-1">Rejection Reason</p>
            <p className="text-sm text-rose-600">{school.rejection_reason}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Owner */}
          <SectionCard title="Owner">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#4E87A0]/10 flex items-center justify-center overflow-hidden shrink-0">
                {school.owner?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={school.owner.avatar_url} alt={school.owner.full_name ?? ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-[#4E87A0]">{school.owner?.full_name?.[0]?.toUpperCase() ?? '?'}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{school.owner?.full_name ?? '—'}</p>
                <p className="text-xs text-slate-500">{school.owner?.email ?? '—'}</p>
              </div>
              {school.owner?.id && (
                <Link
                  href={`/admin/users?search=${school.owner.id}`}
                  className="ml-auto text-xs font-semibold text-[#4E87A0] hover:underline whitespace-nowrap"
                >
                  View User →
                </Link>
              )}
            </div>
          </SectionCard>

          {/* Basic Info */}
          <SectionCard title="Basic Info">
            <dl>
              <Field label="Slug" value={school.slug} />
              <Field label="Short bio" value={school.short_bio} />
              <Field label="Bio" value={school.bio} />
              <Field label="Description" value={school.description} />
              <Field label="Established" value={school.established_year} />
              <Field label="Insured" value={school.is_insured === true ? 'Yes' : school.is_insured === false ? 'No' : null} />
              <Field label="Onboarding complete" value={school.onboarding_completed ? `Yes (${school.onboarding_completed_at ? new Date(school.onboarding_completed_at).toLocaleDateString() : ''})` : 'No'} />
              {school.approved_at && <Field label="Approved at" value={new Date(school.approved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />}
            </dl>
          </SectionCard>

          {/* Online Presence */}
          <SectionCard title="Online Presence">
            <dl>
              <Field label="Website" value={school.website ? <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-[#4E87A0] hover:underline break-all">{school.website}</a> : null} />
              <Field label="Instagram" value={school.instagram} />
              <Field label="YouTube" value={school.youtube} />
              <Field label="Facebook" value={school.facebook} />
              <Field label="TikTok" value={school.tiktok} />
              <Field label="Video URL" value={school.video_url ? <a href={school.video_url} target="_blank" rel="noopener noreferrer" className="text-[#4E87A0] hover:underline break-all">{school.video_url}</a> : null} />
              <Field label="Video platform" value={school.video_platform} />
            </dl>
          </SectionCard>

          {/* Teaching Info */}
          <SectionCard title="Teaching Info">
            <dl>
              <Field
                label="Practice styles"
                value={
                  Array.isArray(school.practice_styles) && school.practice_styles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {school.practice_styles.map((s: string) => <PillBadge key={s} label={s} />)}
                    </div>
                  ) : null
                }
              />
              <Field
                label="Programs offered"
                value={
                  Array.isArray(school.programs_offered) && school.programs_offered.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {school.programs_offered.map((p: string) => <PillBadge key={p} label={p} />)}
                    </div>
                  ) : null
                }
              />
              <Field label="Delivery format" value={school.course_delivery_format} />
              <Field label="Lineage" value={school.lineage} />
              <Field
                label="Languages"
                value={
                  Array.isArray(school.languages) && school.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {school.languages.map((l: string) => <PillBadge key={l} label={l} />)}
                    </div>
                  ) : null
                }
              />
            </dl>
          </SectionCard>

          {/* Location */}
          <SectionCard title="Location">
            <dl>
              <Field label="Address" value={school.location_address} />
              <Field label="City" value={school.location_city ?? school.city} />
              <Field label="Country" value={school.location_country ?? school.country} />
              <Field label="Latitude" value={school.location_lat} />
              <Field label="Longitude" value={school.location_lng} />
            </dl>
          </SectionCard>

          {/* Designations */}
          <SectionCard title="Designations">
            {designations.length === 0 ? (
              <p className="text-sm text-slate-400">No designations requested.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Type</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Subscription ID</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Signup Fee</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2">Annual Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {designations.map((d: {
                      id: string
                      designation_type: string
                      status: string
                      stripe_subscription_id: string | null
                      signup_fee_amount: number | null
                      annual_fee_amount: number | null
                    }) => (
                      <tr key={d.id}>
                        <td className="py-2 pr-4 font-medium text-slate-800">{d.designation_type}</td>
                        <td className="py-2 pr-4">
                          <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-500 font-mono text-xs">{d.stripe_subscription_id ?? '—'}</td>
                        <td className="py-2 pr-4 text-slate-600">{d.signup_fee_amount != null ? `$${d.signup_fee_amount}` : '—'}</td>
                        <td className="py-2 text-slate-600">{d.annual_fee_amount != null ? `$${d.annual_fee_amount}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Documents */}
          <SectionCard title="Verification Documents">
            {documentsWithUrls.length === 0 ? (
              <p className="text-sm text-slate-400">No documents uploaded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Type</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">File Name</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Size</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {documentsWithUrls.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-2 pr-4 font-medium text-slate-800 capitalize">{doc.document_type?.replace(/_/g, ' ') ?? '—'}</td>
                        <td className="py-2 pr-4 text-slate-600 max-w-[200px] truncate">{doc.file_name ?? '—'}</td>
                        <td className="py-2 pr-4 text-slate-500">{formatFileSize(doc.file_size)}</td>
                        <td className="py-2 pr-4">
                          <span className="inline-block bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                            {doc.status ?? '—'}
                          </span>
                        </td>
                        <td className="py-2">
                          {doc.signedUrl ? (
                            <a
                              href={doc.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E87A0] hover:underline"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </a>
                          ) : (
                            <span className="text-xs text-slate-300">Unavailable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Faculty */}
          <SectionCard title="Faculty Members">
            {faculty.length === 0 ? (
              <p className="text-sm text-slate-400">No faculty members added.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Name / Email</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Position</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Principal Trainer</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {faculty.map((f: {
                      id: string
                      position: string | null
                      is_principal_trainer: boolean | null
                      invited_email: string | null
                      status: string
                      profile: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null
                    }) => {
                      const name = f.profile?.full_name ?? f.invited_email ?? '—'
                      const email = f.profile?.email ?? f.invited_email ?? '—'
                      return (
                        <tr key={f.id}>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#4E87A0]/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {f.profile?.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={f.profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-[#4E87A0]">{name[0]?.toUpperCase() ?? '?'}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{name}</p>
                                <p className="text-xs text-slate-400">{email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-4 text-slate-600">{f.position ?? '—'}</td>
                          <td className="py-2 pr-4">
                            {f.is_principal_trainer ? (
                              <span className="inline-block bg-[#4E87A0]/10 text-[#4E87A0] rounded-full px-2.5 py-0.5 text-xs font-semibold">Yes</span>
                            ) : (
                              <span className="text-slate-300 text-xs">No</span>
                            )}
                          </td>
                          <td className="py-2">
                            <span className="inline-block bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </PageContainer>
    </div>
  )
}
