'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import EmailTemplatesList from './components/EmailTemplatesList';
import HealthTab from './components/HealthTab';
import MaintenanceTab from './components/MaintenanceTab';

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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30 focus:border-[#00B5A3] font-mono transition-colors ${
          error ? 'border-red-300 bg-red-50' : 'border-[#E5E7EB] bg-white'
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-[#6B7280]">{helperText}</p>
      ) : null}
    </div>
  );
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'inactive' | 'saved' | 'active' }) {
  const cls =
    status === 'active'  ? 'bg-green-500' :
    status === 'saved'   ? 'bg-yellow-400' :
                           'bg-slate-300';
  const label =
    status === 'active'  ? 'Configured' :
    status === 'saved'   ? 'Saved, not tracking' :
                           'Not configured';
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
      <span className={`w-2 h-2 rounded-full ${cls}`} />
      {label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'info' | 'error';

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: ToastType;
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    error:   'bg-red-50 border-red-200 text-red-800',
  };
  const icons: Record<ToastType, React.ReactNode> = {
    success: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info:    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    error:   <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
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

// ─── Datetime helpers ─────────────────────────────────────────────────────────

function utcToDatetimeLocal(utcIso: string): string {
  if (!utcIso) return '';
  try {
    const d = new Date(utcIso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

function datetimeLocalToUtc(local: string): string {
  if (!local) return '';
  try { return new Date(local).toISOString(); } catch { return ''; }
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
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [ga4Id, setGa4Id]         = useState('');
  const [clarityId, setClarityId] = useState('');
  const [enabled, setEnabled]     = useState(false);
  const [ga4Error, setGa4Error]   = useState('');
  const [clarityError, setClarityError] = useState('');
  const [toast, setToast]         = useState<{ type: ToastType; message: string } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  // Track what's actually committed to the DB to drive status dots accurately
  const [savedGa4Id, setSavedGa4Id]         = useState('');
  const [savedClarityId, setSavedClarityId] = useState('');
  const [savedEnabled, setSavedEnabled]     = useState(false);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['ga4_measurement_id', 'clarity_project_id', 'analytics_enabled']);

      if (data) {
        const map: Record<string, string> = {};
        (data as Array<{ key: string; value: string }>).forEach(r => { map[r.key] = r.value ?? ''; });
        const ga4  = map.ga4_measurement_id ?? '';
        const clar = map.clarity_project_id ?? '';
        const enab = map.analytics_enabled === 'true';
        setGa4Id(ga4);       setSavedGa4Id(ga4);
        setClarityId(clar);  setSavedClarityId(clar);
        setEnabled(enab);    setSavedEnabled(enab);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Status dots reflect the last-saved state, not the live form values
  const ga4Status: 'inactive' | 'saved' | 'active' =
    !savedGa4Id ? 'inactive' : savedEnabled ? 'active' : 'saved';
  const clarityStatus: 'inactive' | 'saved' | 'active' =
    !savedClarityId ? 'inactive' : savedEnabled ? 'active' : 'saved';

  const dismissToast = useCallback(() => setToast(null), []);

  const save = async () => {
    setSaving(true);
    setGa4Error('');
    setClarityError('');

    // Guard: at least one ID must be present
    if (!ga4Id && !clarityId) {
      setToast({ type: 'error', message: 'Please enter at least one analytics ID before saving.' });
      setSaving(false);
      return;
    }

    // Validate non-empty fields
    const ga4Valid     = !ga4Id     || /^G-[A-Z0-9]{4,}$/.test(ga4Id);
    const clarityValid = !clarityId || clarityId.length >= 8;

    if (!ga4Valid) {
      setGa4Error("GA4 Measurement ID must start with 'G-' (e.g. G-XXXXXXXXXX)");
    }
    if (!clarityValid) {
      setClarityError('Clarity Project ID appears invalid. Find it at clarity.microsoft.com → your project → Setup.');
    }

    if (!ga4Valid || !clarityValid) {
      setSaving(false);
      return;
    }

    // Get current user for updated_by
    const { data: { user } } = await supabase.auth.getUser();

    const rows = [
      { key: 'ga4_measurement_id', value: ga4Id,                      description: 'Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)' },
      { key: 'clarity_project_id', value: clarityId,                  description: 'Microsoft Clarity Project ID (format: abc123def4)' },
      { key: 'analytics_enabled',  value: enabled ? 'true' : 'false', description: 'Master switch to enable/disable all analytics scripts' },
    ];

    for (const row of rows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase
        .from('site_settings')
        .upsert(
          { ...row, updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
          { onConflict: 'key' }
        );
    }

    // Update saved state to reflect what's now in the DB
    setSavedGa4Id(ga4Id);
    setSavedClarityId(clarityId);
    setSavedEnabled(enabled);

    // Context-aware success message
    if (!enabled) {
      setToast({ type: 'info', message: 'Analytics tracking paused.' });
    } else if (ga4Id && clarityId) {
      setToast({ type: 'success', message: 'Analytics connected successfully. Scripts will load on the next page visit.' });
    } else if (ga4Id) {
      setToast({ type: 'success', message: 'Google Analytics 4 connected successfully. Scripts will load on the next page visit.' });
    } else {
      setToast({ type: 'success', message: 'Microsoft Clarity connected successfully. Scripts will load on the next page visit.' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#00B5A3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GA4 */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Google Analytics 4</h2>
          <StatusDot status={ga4Status} />
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-[#6B7280]">
            Connect Google Analytics 4 to track page views, sessions, user demographics, and traffic sources.
          </p>
          <InputField
            label="GA4 Measurement ID"
            value={ga4Id}
            onChange={setGa4Id}
            placeholder="G-XXXXXXXXXX"
            helperText="Find this in Google Analytics → Admin → Data Streams → your stream → Measurement ID"
            error={ga4Error}
          />
        </div>
      </div>

      {/* Clarity */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Microsoft Clarity</h2>
          <StatusDot status={clarityStatus} />
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-[#6B7280]">
            Connect Microsoft Clarity for session recordings, heatmaps, and click tracking. Free and unlimited.
          </p>
          <InputField
            label="Clarity Project ID"
            value={clarityId}
            onChange={setClarityId}
            placeholder="abc123def4"
            helperText="Find this in clarity.microsoft.com → your project → Setup → get the ID from the script snippet"
            error={clarityError}
          />
        </div>
      </div>

      {/* Master switch */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Master Switch</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Enable Analytics</p>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm">
                When disabled, no analytics scripts will load regardless of the IDs entered. Use this to pause tracking without deleting your IDs.
              </p>
            </div>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00B5A3] text-white text-sm font-semibold hover:bg-[#009e8e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          {saving ? 'Saving…' : 'Save & Connect'}
        </button>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'general' | 'analytics' | 'email-templates' | 'health' | 'maintenance';

const TABS: { key: Tab; label: string }[] = [
  { key: 'general',         label: 'General'         },
  { key: 'analytics',       label: 'Analytics'       },
  { key: 'email-templates', label: 'Email Templates' },
  { key: 'health',          label: 'Health'           },
  { key: 'maintenance',     label: 'Maintenance'      },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Settings</h1>
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

      {tab === 'general'         && <GeneralTab />}
      {tab === 'analytics'       && <AnalyticsTab />}
      {tab === 'email-templates' && <EmailTemplatesList />}
      {tab === 'health'          && <HealthTab />}
      {tab === 'maintenance'     && <MaintenanceTab />}
    </div>
  );
}
