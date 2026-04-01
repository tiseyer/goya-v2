import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import DocumentsClient from './DocumentsClient'

export interface DesignationWithDocs {
  id: string
  designation_type: string
  status: string
  documents: DocumentRow[]
}

export interface DocumentRow {
  id: string
  designation_id: string
  document_type: string
  file_name: string | null
  file_url: string
  file_size: number | null
  status: string
  created_at: string
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!school) redirect('/dashboard')

  // Fetch designations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: designations } = await (supabase as any)
    .from('school_designations')
    .select('id, designation_type, status')
    .eq('school_id', school.id)
    .order('created_at', { ascending: true })

  // Fetch all documents for this school
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: documents } = await (supabase as any)
    .from('school_verification_documents')
    .select('id, designation_id, document_type, file_name, file_url, file_size, status, created_at')
    .eq('school_id', school.id)
    .order('created_at', { ascending: true })

  const docList: DocumentRow[] = documents ?? []

  // Group documents by designation
  const designationsWithDocs: DesignationWithDocs[] = (designations ?? []).map(
    (d: { id: string; designation_type: string; status: string }) => ({
      ...d,
      documents: docList.filter((doc) => doc.designation_id === d.id),
    })
  )

  return (
    <DocumentsClient
      schoolSlug={slug}
      designationsWithDocs={designationsWithDocs}
    />
  )
}
