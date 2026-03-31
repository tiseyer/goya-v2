export default function VisitorAnalyticsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Visitor Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visitor analytics coming soon — will include GA4, Microsoft Clarity, and Vercel Analytics.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700 mb-1">Coming Soon</p>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          This page will consolidate visitor analytics from Google Analytics 4, Microsoft Clarity session recordings and heatmaps, and Vercel Web Analytics into a single admin view.
        </p>
      </div>
    </div>
  );
}
