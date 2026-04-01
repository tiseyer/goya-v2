'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import TemplatesTab from './components/TemplatesTab';
import ScheduledTab from './components/ScheduledTab';
import TriggeredTab from './components/TriggeredTab';
import EmailProviderTab from './components/EmailProviderTab';

type Tab = 'templates' | 'scheduled' | 'triggered' | 'provider';

const TABS: { key: Tab; label: string }[] = [
  { key: 'templates', label: 'Templates' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'triggered', label: 'Triggered' },
  { key: 'provider', label: 'Email Provider' },
];

function EmailsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get('tab') as Tab) || 'templates';

  function setTab(tab: Tab) {
    router.push(`/admin/emails?tab=${tab}`);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Emails</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Manage templates, schedules, triggers, and email provider settings</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white text-[#1B3A5C] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'scheduled' && <ScheduledTab />}
      {activeTab === 'triggered' && <TriggeredTab />}
      {activeTab === 'provider' && <EmailProviderTab />}
    </div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense fallback={<div className="p-6 lg:p-8"><div className="h-8 w-48 bg-slate-100 rounded animate-pulse" /></div>}>
      <EmailsPageContent />
    </Suspense>
  );
}
