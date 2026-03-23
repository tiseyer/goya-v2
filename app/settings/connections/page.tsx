export default function SettingsConnectionsPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[#1B3A5C] mb-6">Connections</h1>
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#1B3A5C] mb-2">Coming Soon</h2>
        <p className="text-sm text-[#6B7280] max-w-md mx-auto">
          Manage your professional connections, view connection requests, and control your privacy settings — all from one place.
        </p>
      </div>
    </div>
  );
}
