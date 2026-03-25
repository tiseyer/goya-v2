export default function UpgradeSuccessPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 text-center">
        {/* Checkmark icon — inline SVG, no external icon library */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[#1B3A5C] mb-2">
          Your upgrade request has been submitted!
        </h1>
        <p className="text-sm text-[#6B7280] mb-1">
          Our team will verify your credentials within 48 hours.
        </p>
        <p className="text-sm text-[#6B7280] mb-6">
          You&apos;ll receive a notification once your upgrade has been verified.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center bg-[#1B3A5C] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f4a] transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}
