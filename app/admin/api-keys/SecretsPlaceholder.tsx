export default function SecretsPlaceholder() {
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
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <h3 className="text-base font-semibold text-[#1B3A5C] mb-1">Third Party Keys</h3>
      <p className="text-sm text-[#6B7280]">
        Manage third-party API secrets. Coming in a future update.
      </p>
    </div>
  )
}
