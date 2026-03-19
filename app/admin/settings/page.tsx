'use client';

import { useState } from 'react';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E7EB]">
        <h2 className="text-base font-semibold text-[#1B3A5C]">{title}</h2>
        {description && <p className="text-sm text-[#6B7280] mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <label className="text-sm font-medium text-[#374151]">{label}</label>
      <span className="text-sm text-[#6B7280] font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
        {value}
      </span>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:ring-offset-2 ${
        checked ? 'bg-[#00B5A3]' : 'bg-[#E5E7EB]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const environment = process.env.NODE_ENV === 'production' ? 'Production' : 'Development';

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-8">Settings</h1>

      <div className="space-y-6">
        {/* General */}
        <Section title="General" description="Basic platform information.">
          <ReadOnlyField label="App Name"    value="GOYA — Global Online Yoga Association" />
          <ReadOnlyField label="Version"     value="v2.0.0-alpha" />
          <ReadOnlyField label="Environment" value={environment} />
        </Section>

        {/* Maintenance */}
        <Section title="Maintenance" description="Control platform availability.">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Maintenance Mode</p>
              <p className="text-xs text-[#6B7280] mt-1">
                When enabled, non-admin users will see a maintenance page.
              </p>
            </div>
            <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
          </div>
          {maintenanceMode && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-xs font-medium text-amber-700">Maintenance mode is active (UI only — no backend logic yet)</p>
            </div>
          )}
        </Section>

        {/* Danger Zone */}
        <div className="rounded-xl border-2 border-red-200 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
          </div>
          <div className="px-6 py-5 bg-white">
            <p className="text-sm text-[#374151]">
              Database operations, cache clearing, and other destructive actions will be available here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
