'use client'

import { useState, useRef } from 'react'

export default function FileUploadSection() {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return
    const valid = Array.from(incoming).filter(f => {
      const ok = ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)
      const small = f.size <= 5 * 1024 * 1024
      return ok && small
    })
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !existing.has(f.name))]
    })
  }

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  return (
    <div className="mt-8 border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-bold text-[#1e3a5f] mb-1">Upload Document(s)</h3>
      <p className="text-xs text-slate-500 mb-4">
        PDF, JPG, or PNG — max 5 MB per file. Accepted documents include certificates, transcripts, and training records.
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className="border-2 border-dashed border-slate-200 hover:border-[#1e3a5f]/40 rounded-lg p-6 text-center cursor-pointer transition-colors group"
      >
        <svg className="w-8 h-8 text-slate-300 group-hover:text-slate-400 mx-auto mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
          Click or drag &amp; drop to upload
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map(f => (
            <li key={f.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs text-slate-700 truncate">{f.name}</span>
                <span className="text-xs text-slate-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button
                onClick={() => removeFile(f.name)}
                className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                aria-label="Remove file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
