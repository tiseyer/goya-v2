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
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer',
              activeTab === tab.key
                ? 'text-primary'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
            )}
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
