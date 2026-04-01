'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import HealthTab from './components/HealthTab';
import MaintenanceTab from './components/MaintenanceTab';
import VersionsTab from './components/VersionsTab';
import DangerZone from './components/DangerZone';
import ColorsTab from './components/ColorsTab';

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  statusDot,
  children,
}: {
  title: string;
  description?: string;
  statusDot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#1B3A5C]">{title}</h2>
        {statusDot}
        {description && <p className="text-sm text-[#6B7280] mt-0.5 ml-auto">{description}</p>}
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

// ─── Deploy Environment card ──────────────────────────────────────────────────

const ENVS = {
  develop:    'https://goya-v2-git-develop-tiseyers-projects.vercel.app',
  production: 'https://goya-v2.vercel.app',
} as const;

type EnvKey = keyof typeof ENVS;

function DeployEnvironmentCard() {
  const [current, setCurrent] = useState<EnvKey>('production');

  useEffect(() => {
    const h = window.location.hostname;
    const isDev = h.includes('git-develop') || h === 'localhost';
    setCurrent(isDev ? 'develop' : 'production');
  }, []);

  const handleSelect = (env: EnvKey) => {
    if (env === current) return;
    window.location.href = ENVS[env];
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E7EB]">
        <h2 className="text-base font-semibold text-[#1B3A5C]">System</h2>
      </div>
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#374151]">Live Environment</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Switch between the development preview and the production site.</p>
          </div>
          <div className="shrink-0 flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['develop', 'production'] as EnvKey[]).map(env => {
              const active = env === current;
              return (
                <button
                  key={env}
                  onClick={() => handleSelect(env)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    active ? 'bg-[#00B5A3] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-slate-300'}`} />
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3">
          <a
            href={ENVS[current]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#6B7280] hover:text-[#00B5A3] transition-colors font-mono"
          >
            {ENVS[current]}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── General tab ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const environment = process.env.NODE_ENV === 'production' ? 'Production' : 'Development';

  return (
    <div className="space-y-6">
      <Section title="General" description="Basic platform information.">
        <ReadOnlyField label="App Name"    value="GOYA — Global Online Yoga Association" />
        <ReadOnlyField label="Version"     value="v2.0.0-alpha" />
        <ReadOnlyField label="Environment" value={environment} />
      </Section>

      <DeployEnvironmentCard />

      <DangerZone />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'general' | 'health' | 'maintenance' | 'versions' | 'colors';

const TABS: { key: Tab; label: string }[] = [
  { key: 'general',     label: 'General'     },
  { key: 'colors',      label: 'Colors'      },
  { key: 'health',      label: 'Health'      },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'versions',    label: 'Versions'    },
];

function isValidTab(value: string | null): value is Tab {
  return value !== null && TABS.some(t => t.key === value);
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<Tab>(() => isValidTab(tabParam) ? tabParam : 'general');

  // Sync tab state when URL search params change (e.g. sidebar link to ?tab=email-templates)
  useEffect(() => {
    if (isValidTab(tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">System Settings</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage platform configuration</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-[#1B3A5C] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general'     && <GeneralTab />}
      {tab === 'colors'      && <ColorsTab />}
      {tab === 'health'      && <HealthTab />}
      {tab === 'maintenance' && <MaintenanceTab />}
      {tab === 'versions'    && <VersionsTab />}
    </div>
  );
}
