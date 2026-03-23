export default function SettingsInboxPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[#1B3A5C] mb-6">Inbox</h1>
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#1B3A5C] mb-2">Coming Soon</h2>
        <p className="text-sm text-[#6B7280] max-w-md mx-auto">
          Configure your inbox notification preferences and manage message filtering rules from here.
        </p>
      </div>
    </div>
  );
}
