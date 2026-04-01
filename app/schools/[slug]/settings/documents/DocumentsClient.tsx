'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { uploadDocument, deleteDocument } from '../actions'
import type { DesignationWithDocs, DocumentRow } from './page'

// ── Constants ─────────────────────────────────────────────────────────────────

const DESIGNATION_LABELS: Record<string, string> = {
  rys_200: 'RYS 200 — 200-Hour Yoga School',
  rys_300: 'RYS 300 — 300-Hour Yoga School',
  rys_500: 'RYS 500 — 500-Hour Yoga School',
  rpys: 'RPYS — Prenatal Yoga School',
  rcys: "RCYS — Children's Yoga School",
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  business_registration: 'Business Registration',
  qualification_certificate: 'Qualification Certificate',
  insurance: 'Insurance Certificate',
  other: 'Other Document',
}

const DOCUMENT_TYPES = ['business_registration', 'qualification_certificate', 'insurance']

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {message}
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  const classes = map[status] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${classes}`}>
      {status}
    </span>
  )
}

// ── Document Row ──────────────────────────────────────────────────────────────

function DocumentItem({
  schoolSlug,
  designationId,
  documentType,
  doc,
  onUploaded,
  onDeleted,
}: {
  schoolSlug: string
  designationId: string
  documentType: string
  doc: DocumentRow | undefined
  onUploaded: (newDoc: DocumentRow) => void
  onDeleted: (docId: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    startTransition(async () => {
      // If replacing, delete the old doc first
      if (doc) {
        const delResult = await deleteDocument(schoolSlug, doc.id)
        if ('error' in delResult) {
          setToast({ message: delResult.error, type: 'error' })
          return
        }
        onDeleted(doc.id)
      }

      const formData = new FormData()
      formData.set('schoolSlug', schoolSlug)
      formData.set('designationId', designationId)
      formData.set('documentType', documentType)
      formData.set('file', file)

      const result = await uploadDocument(formData)
      if ('error' in result) {
        setToast({ message: result.error, type: 'error' })
      } else {
        onUploaded({
          id: result.document.id,
          designation_id: designationId,
          document_type: documentType,
          file_name: result.document.file_name,
          file_url: result.document.file_url,
          file_size: null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        setToast({ message: 'Document uploaded successfully.', type: 'success' })
      }

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  const label = DOCUMENT_TYPE_LABELS[documentType] ?? documentType
  const uploadedDate = doc
    ? new Date(doc.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#374151]">{label}</p>
        {doc ? (
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[#6B7280] truncate max-w-xs">{doc.file_name}</p>
            <span className="text-xs text-[#9CA3AF]">·</span>
            <p className="text-xs text-[#9CA3AF] whitespace-nowrap">{uploadedDate}</p>
            <DocStatusBadge status={doc.status} />
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF] mt-0.5">No document uploaded</p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          disabled={isPending}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
            doc
              ? 'border-[#E5E7EB] text-[#374151] hover:bg-[#F7F8FA]'
              : 'border-[#1B3A5C] text-[#1B3A5C] hover:bg-blue-50'
          }`}
        >
          {isPending ? 'Uploading...' : doc ? 'Re-upload' : 'Upload'}
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface DocumentsClientProps {
  schoolSlug: string
  designationsWithDocs: DesignationWithDocs[]
}

export default function DocumentsClient({
  schoolSlug,
  designationsWithDocs,
}: DocumentsClientProps) {
  const [desigState, setDesigState] = useState<DesignationWithDocs[]>(designationsWithDocs)

  function handleUploaded(designationId: string, newDoc: DocumentRow) {
    setDesigState((prev) =>
      prev.map((d) =>
        d.id === designationId
          ? { ...d, documents: [...d.documents, newDoc] }
          : d
      )
    )
  }

  function handleDeleted(designationId: string, docId: string) {
    setDesigState((prev) =>
      prev.map((d) =>
        d.id === designationId
          ? { ...d, documents: d.documents.filter((doc) => doc.id !== docId) }
          : d
      )
    )
  }

  if (desigState.length === 0) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-xl font-semibold text-[#1B3A5C] mb-2">Documents</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Verification documents submitted for your school designations.
        </p>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center">
          <p className="text-sm text-[#6B7280]">No designations found. Documents will appear here once you have active designations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1B3A5C]">Documents</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Verification documents submitted for your school designations. Re-upload to replace a document.
        </p>
      </div>

      <div className="space-y-6">
        {desigState.map((designation) => {
          const designLabel = DESIGNATION_LABELS[designation.designation_type] ?? designation.designation_type

          return (
            <div key={designation.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">{designLabel}</h2>

              <div>
                {DOCUMENT_TYPES.map((docType) => {
                  const existingDoc = designation.documents.find(
                    (d) => d.document_type === docType
                  )
                  return (
                    <DocumentItem
                      key={docType}
                      schoolSlug={schoolSlug}
                      designationId={designation.id}
                      documentType={docType}
                      doc={existingDoc}
                      onUploaded={(newDoc) => handleUploaded(designation.id, newDoc)}
                      onDeleted={(docId) => handleDeleted(designation.id, docId)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
