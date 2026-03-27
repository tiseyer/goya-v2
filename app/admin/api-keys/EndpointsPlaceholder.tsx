export default function EndpointsPlaceholder() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
      <svg
        className="w-10 h-10 text-slate-300 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-base font-semibold text-[#1B3A5C] mb-1">API Endpoints</h3>
      <p className="text-sm text-[#6B7280]">
        Browse and search all API endpoints. Coming in a future update.
      </p>
    </div>
  )
}
