import Link from 'next/link'

export default function DocNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Documentation Coming Soon</h2>
        <p className="text-sm text-foreground-secondary mb-6">
          This documentation page hasn&apos;t been created yet. It may be part of a feature currently in development.
        </p>
        <Link
          href="/admin/docs"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--goya-primary)] text-white text-sm font-medium hover:bg-[var(--goya-primary-dark)] transition-colors"
        >
          ← Back to Documentation
        </Link>
      </div>
    </div>
  )
}
