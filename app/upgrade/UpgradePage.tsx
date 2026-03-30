'use client'

import { useState, useRef } from 'react'
import { uploadCertificate, createUpgradeCheckoutSession } from './actions'

type UploadedFile = {
  file: File
  url: string
  previewUrl: string | null
}

export function UpgradePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    for (const file of files) {
      if (uploadedFiles.length >= 3) break

      const formData = new FormData()
      formData.set('file', file)

      const result = await uploadCertificate(formData)

      if ('error' in result) {
        setError(result.error)
        setUploading(false)
        return
      }

      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      setUploadedFiles(prev => [...prev, { file, url: result.url, previewUrl }])
    }

    setUploading(false)
    // Reset input so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => {
      const updated = [...prev]
      const removed = updated.splice(index, 1)[0]
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      return updated
    })
  }

  async function handleProceedToCheckout() {
    setCheckoutLoading(true)
    setError(null)

    const urls = uploadedFiles.map(f => f.url)
    const result = await createUpgradeCheckoutSession(urls)

    if ('error' in result) {
      setError(result.error)
      setCheckoutLoading(false)
      return
    }

    window.location.href = result.url
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* STEP 1 — Info */}
      {step === 1 && (
        <div>
          <p className="text-xs font-medium text-[#9CA3AF] mb-2 uppercase tracking-wide">Step 1 of 3</p>
          <h1 className="text-xl font-semibold text-[#1B3A5C] mb-4">Upgrade to GOYA Certified Teacher</h1>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 mb-6">
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <svg className="h-5 w-5 text-[#1B3A5C] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-sm text-[#6B7280]">Access exclusive teacher resources and materials</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-5 w-5 text-[#1B3A5C] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-sm text-[#6B7280]">Display your credentials on your GOYA profile</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-5 w-5 text-[#1B3A5C] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-sm text-[#6B7280]">Connect with the GOYA teacher community</span>
              </li>
            </ul>

            <div className="border-t border-[#E5E7EB] pt-4">
              <p className="text-sm font-medium text-[#1B3A5C]">Teacher Membership &mdash; $39.00 / year</p>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="bg-[#1B3A5C] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f4a] transition-colors"
          >
            Start Upgrade
          </button>
        </div>
      )}

      {/* STEP 2 — Certificate Upload */}
      {step === 2 && (
        <div>
          <p className="text-xs font-medium text-[#9CA3AF] mb-2 uppercase tracking-wide">Step 2 of 3</p>
          <h1 className="text-xl font-semibold text-[#1B3A5C] mb-1">Upload Your Certificates</h1>
          <p className="text-sm text-[#6B7280] mb-6">Upload 1&ndash;3 certificate files (PDF, JPG, PNG, WEBP &mdash; max 4MB each)</p>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 mb-6">
            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
              <ul className="space-y-3 mb-4">
                {uploadedFiles.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                    {f.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.previewUrl} alt={f.file.name} className="h-10 w-10 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 flex items-center justify-center rounded bg-[#EFF6FF] flex-shrink-0">
                        <svg className="h-5 w-5 text-[#1B3A5C]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                    )}
                    <span className="text-sm text-[#1B3A5C] flex-1 truncate">{f.file.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors text-xs"
                      aria-label="Remove file"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* File input + Add button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="cert-upload"
              multiple
            />
            <label
              htmlFor="cert-upload"
              className={`inline-flex items-center gap-2 border border-[#E5E7EB] text-[#6B7280] text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-[#F9FAFB] transition-colors ${
                uploadedFiles.length >= 3 || uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Certificate
                </>
              )}
            </label>

            {error && (
              <p className="text-sm text-[#EF4444] mt-3">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="border border-[#E5E7EB] text-[#6B7280] text-sm px-4 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={uploadedFiles.length === 0 || uploading}
              className="bg-[#1B3A5C] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Payment */}
      {step === 3 && (
        <div>
          <p className="text-xs font-medium text-[#9CA3AF] mb-2 uppercase tracking-wide">Step 3 of 3</p>
          <h1 className="text-xl font-semibold text-[#1B3A5C] mb-4">Authorize Payment</h1>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 mb-6">
            <p className="text-sm font-medium text-[#1B3A5C]">Teacher Membership &mdash; $39.00 / year</p>
            <p className="text-sm text-[#6B7280] mt-1">Your payment will only be charged after your credentials are verified by our team.</p>
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <p className="text-sm text-[#6B7280]">{uploadedFiles.length} certificate{uploadedFiles.length !== 1 ? 's' : ''} ready</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(2)}
              className="border border-[#E5E7EB] text-[#6B7280] text-sm px-4 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleProceedToCheckout}
              disabled={checkoutLoading}
              className="bg-[#1B3A5C] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? 'Redirecting...' : 'Proceed to Checkout'}
            </button>
          </div>

          {error && (
            <p className="text-sm text-[#EF4444] mt-3">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
