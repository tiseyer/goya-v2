'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logAuditEventAction } from '@/app/actions/audit';

// ─── Shared UI (copied from page.tsx) ────────────────────────────────────────

function Section({
  title,
  children,
  statusDot,
}: {
  title: string;
  children: React.ReactNode;
  statusDot?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#1B3A5C]">{title}</h2>
        {statusDot}
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
      </div>
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

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-1">
      <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-semibold hover:bg-[#162f4d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        )}
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}

// ─── Datetime helpers (copied from page.tsx) ──────────────────────────────────

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

// ─── MaintenanceTab ──────────────────────────────────────────────────────────

// ─── Page Visibility types ──────────────────────────────────────────────────

interface PageVisibilityEntry {
  enabled: boolean;
  fallback1: string;
  fallback2: string;
}

type PageVisibilityMap = Record<string, PageVisibilityEntry>;

const PAGE_VISIBILITY_PAGES = [
  { path: '/dashboard', label: 'Dashboard', defaultFallback1: '/members', defaultFallback2: '/academy' },
  { path: '/members', label: 'Members', defaultFallback1: '/dashboard', defaultFallback2: '/academy' },
  { path: '/academy', label: 'Academy', defaultFallback1: '/dashboard', defaultFallback2: '/members' },
  { path: '/events', label: 'Events', defaultFallback1: '/dashboard', defaultFallback2: '/members' },
  { path: '/addons', label: 'Add-Ons', defaultFallback1: '/dashboard', defaultFallback2: '/members' },
  { path: '/settings', label: 'Settings', defaultFallback1: '/dashboard', defaultFallback2: '/members' },
];

function getDefaultPageVisibility(): PageVisibilityMap {
  const map: PageVisibilityMap = {};
  for (const page of PAGE_VISIBILITY_PAGES) {
    map[page.path] = { enabled: true, fallback1: page.defaultFallback1, fallback2: page.defaultFallback2 };
  }
  return map;
}

export default function MaintenanceTab() {
  // ── Maintenance Mode state ────────────────────────────────────────────────
  const [mmEnabled,   setMmEnabled]   = useState(false);
  const [mmScheduled, setMmScheduled] = useState(false);
  const [mmStart,     setMmStart]     = useState('');
  const [mmEnd,       setMmEnd]       = useState('');
  const [mmMessage,   setMmMessage]   = useState('');
  const [mmLoading,   setMmLoading]   = useState(true);
  const [mmSaving,    setMmSaving]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Email Sandbox state ───────────────────────────────────────────────────
  const [sbEnabled,   setSbEnabled]   = useState(false);
  const [sbRecipient, setSbRecipient] = useState('');
  const [sbLoading,   setSbLoading]   = useState(true);
  const [sbSaving,    setSbSaving]    = useState(false);

  // ── Chatbot Maintenance state ─────────────────────────────────────────────
  const [cmEnabled, setCmEnabled] = useState(false);
  const [cmLoading, setCmLoading] = useState(true);
  const [cmSaving,  setCmSaving]  = useState(false);

  // ── Flows Sandbox state ───────────────────────────────────────────────────
  const [fsEnabled, setFsEnabled] = useState(false);
  const [fsLoading, setFsLoading] = useState(true);
  const [fsSaving,  setFsSaving]  = useState(false);

  // ── Credit Hours Sandbox state ────────────────────────────────────────────
  const [chEnabled, setChEnabled] = useState(false);
  const [chLoading, setChLoading] = useState(true);
  const [chSaving,  setChSaving]  = useState(false);

  // ── Theme Lock state ──────────────────────────────────────────────────────
  const [themeLock, setThemeLock]   = useState<string>('');
  const [tlLoading, setTlLoading]   = useState(true);
  const [tlSaving,  setTlSaving]    = useState(false);

  // ── Page Visibility state ─────────────────────────────────────────────────
  const [pageVisibility, setPageVisibility] = useState<PageVisibilityMap>(getDefaultPageVisibility());
  const [pvLoading, setPvLoading] = useState(true);
  const [pvSaving,  setPvSaving]  = useState(false);

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'maintenance_mode_enabled', 'maintenance_mode_scheduled',
          'maintenance_start_utc', 'maintenance_end_utc', 'maintenance_message',
          'email_sandbox_enabled', 'email_sandbox_recipient',
          'chatbot_maintenance_mode',
          'flows_sandbox', 'credit_hours_sandbox', 'theme_lock', 'page_visibility',
        ]);

      if (data) {
        const map: Record<string, string> = {};
        (data as Array<{ key: string; value: string }>).forEach(r => { map[r.key] = r.value ?? ''; });
        setMmEnabled(map.maintenance_mode_enabled === 'true');
        setMmScheduled(map.maintenance_mode_scheduled === 'true');
        setMmStart(utcToDatetimeLocal(map.maintenance_start_utc ?? ''));
        setMmEnd(utcToDatetimeLocal(map.maintenance_end_utc ?? ''));
        setMmMessage(map.maintenance_message ?? '');
        setSbEnabled(map.email_sandbox_enabled === 'true');
        setSbRecipient(map.email_sandbox_recipient ?? '');
        setCmEnabled(map.chatbot_maintenance_mode === 'true');
        setFsEnabled(map.flows_sandbox === 'true');
        setChEnabled(map.credit_hours_sandbox === 'true');
        setThemeLock(map.theme_lock ?? '');
        if (map.page_visibility) {
          try {
            const parsed = JSON.parse(map.page_visibility) as PageVisibilityMap;
            setPageVisibility({ ...getDefaultPageVisibility(), ...parsed });
          } catch {
            // Keep defaults
          }
        }
      }
      setMmLoading(false);
      setSbLoading(false);
      setCmLoading(false);
      setFsLoading(false);
      setChLoading(false);
      setTlLoading(false);
      setPvLoading(false);
    }
    load();
  }, []);

  // ── Maintenance Mode save ─────────────────────────────────────────────────

  const mmStatusInfo = mmEnabled
    ? { dot: 'bg-red-500 animate-pulse', label: 'Maintenance is live', labelCls: 'text-red-600' }
    : (mmScheduled && mmStart && mmEnd)
      ? { dot: 'bg-yellow-400', label: 'Scheduled window set', labelCls: 'text-yellow-700' }
      : { dot: 'bg-emerald-500', label: 'Site is online', labelCls: 'text-emerald-700' };

  async function saveMmSettings(enabledOverride?: boolean) {
    setMmSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const enabled = enabledOverride !== undefined ? enabledOverride : mmEnabled;
    const rows = [
      { key: 'maintenance_mode_enabled',   value: String(enabled) },
      { key: 'maintenance_mode_scheduled', value: String(mmScheduled) },
      { key: 'maintenance_start_utc',      value: datetimeLocalToUtc(mmStart) },
      { key: 'maintenance_end_utc',        value: datetimeLocalToUtc(mmEnd) },
      { key: 'maintenance_message',        value: mmMessage },
    ];
    for (const row of rows) {
      await supabase
        .from('site_settings')
        .upsert(
          { ...row, updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
          { onConflict: 'key' }
        );
    }
    if (enabledOverride !== undefined) setMmEnabled(enabledOverride);
    setMmSaving(false);

    if (enabledOverride === true) {
      void logAuditEventAction({ category: 'admin', action: 'admin.maintenance_mode_enabled', actor_id: user?.id ?? undefined, description: 'Maintenance mode enabled' });
      setToast({ type: 'info', message: 'Maintenance mode is now active. Non-admin users will see the maintenance page.' });
    } else if (enabledOverride === false) {
      void logAuditEventAction({ category: 'admin', action: 'admin.maintenance_mode_disabled', actor_id: user?.id ?? undefined, description: 'Maintenance mode disabled' });
      setToast({ type: 'success', message: 'Maintenance mode disabled. The site is back online.' });
    } else {
      void logAuditEventAction({ category: 'admin', action: 'admin.settings_changed', actor_id: user?.id ?? undefined, description: 'Maintenance settings updated', metadata: { setting: 'maintenance_mode', scheduled: String(mmScheduled) } });
      setToast({ type: 'success', message: 'Maintenance settings saved.' });
    }
  }

  function handleEnableToggle(val: boolean) {
    if (val) {
      setShowConfirm(true);
    } else {
      saveMmSettings(false);
    }
  }

  // ── Email Sandbox save ────────────────────────────────────────────────────

  async function saveSbSettings() {
    setSbSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const rows = [
      { key: 'email_sandbox_enabled',   value: String(sbEnabled) },
      { key: 'email_sandbox_recipient', value: sbRecipient },
    ];
    for (const row of rows) {
      await supabase
        .from('site_settings')
        .upsert(
          { ...row, updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
          { onConflict: 'key' }
        );
    }
    setSbSaving(false);
    if (sbEnabled) {
      void logAuditEventAction({ category: 'admin', action: 'admin.email_sandbox_enabled', actor_id: user?.id ?? undefined, description: `Email sandbox enabled (redirect to ${sbRecipient || 'none'})` });
      setToast({ type: 'info', message: `Email sandbox active — all emails redirected to ${sbRecipient || '(no address set)'}` });
    } else {
      void logAuditEventAction({ category: 'admin', action: 'admin.email_sandbox_disabled', actor_id: user?.id ?? undefined, description: 'Email sandbox disabled' });
      setToast({ type: 'success', message: 'Email sandbox disabled. Emails sending normally.' });
    }
  }

  // ── Chatbot Maintenance save ──────────────────────────────────────────────

  async function saveCmSettings() {
    setCmSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('site_settings')
      .upsert(
        { key: 'chatbot_maintenance_mode', value: String(cmEnabled), updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
        { onConflict: 'key' }
      );
    setCmSaving(false);
    if (cmEnabled) {
      void logAuditEventAction({ category: 'admin', action: 'admin.chatbot_sandbox_enabled', actor_id: user?.id ?? undefined, description: 'Chatbot maintenance mode enabled' });
      setToast({ type: 'info', message: 'Chatbot maintenance mode active. Regular users will not see the chat widget.' });
    } else {
      void logAuditEventAction({ category: 'admin', action: 'admin.chatbot_sandbox_disabled', actor_id: user?.id ?? undefined, description: 'Chatbot maintenance mode disabled' });
      setToast({ type: 'success', message: 'Chatbot maintenance mode disabled. Widget visible to all users.' });
    }
  }

  // ── Flows Sandbox save ───────────────────────────────────────────────────

  async function saveFsSettings() {
    setFsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('site_settings')
      .upsert(
        { key: 'flows_sandbox', value: String(fsEnabled), updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
        { onConflict: 'key' }
      );
    setFsSaving(false);
    void logAuditEventAction({ category: 'admin', action: 'admin.settings_changed', actor_id: user?.id ?? undefined, description: `Flows sandbox ${fsEnabled ? 'enabled' : 'disabled'}`, metadata: { setting: 'flows_sandbox', value: String(fsEnabled) } });
    if (fsEnabled) {
      setToast({ type: 'info', message: 'Flows sandbox active. Flows hidden from regular users.' });
    } else {
      setToast({ type: 'success', message: 'Flows sandbox disabled. Flows visible to all users.' });
    }
  }

  // ── Credit Hours Sandbox save ────────────────────────────────────────────

  async function saveChSettings() {
    setChSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('site_settings')
      .upsert(
        { key: 'credit_hours_sandbox', value: String(chEnabled), updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
        { onConflict: 'key' }
      );
    setChSaving(false);
    void logAuditEventAction({ category: 'admin', action: 'admin.settings_changed', actor_id: user?.id ?? undefined, description: `Credit Hours sandbox ${chEnabled ? 'enabled' : 'disabled'}`, metadata: { setting: 'credit_hours_sandbox', value: String(chEnabled) } });
    if (chEnabled) {
      setToast({ type: 'info', message: 'Credit Hours sandbox active. Credit submissions hidden from regular users.' });
    } else {
      setToast({ type: 'success', message: 'Credit Hours sandbox disabled. Credit submissions visible to all users.' });
    }
  }

  // ── Theme Lock save ──────────────────────────────────────────────────────

  async function saveTlSettings() {
    setTlSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('site_settings')
      .upsert(
        { key: 'theme_lock', value: themeLock || '', updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
        { onConflict: 'key' }
      );
    setTlSaving(false);
    void logAuditEventAction({ category: 'admin', action: 'admin.settings_changed', actor_id: user?.id ?? undefined, description: `Theme lock changed to "${themeLock || 'none'}"`, metadata: { setting: 'theme_lock', value: themeLock || 'none' } });
    if (themeLock === 'light') {
      setToast({ type: 'info', message: 'Theme locked to Light Mode for non-admin users.' });
    } else if (themeLock === 'dark') {
      setToast({ type: 'info', message: 'Theme locked to Dark Mode for non-admin users.' });
    } else {
      setToast({ type: 'success', message: 'Theme unlocked. Users can choose their own theme.' });
    }
  }

  // ── Page Visibility save ─────────────────────────────────────────────────

  async function savePvSettings() {
    setPvSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('site_settings')
      .upsert(
        { key: 'page_visibility', value: JSON.stringify(pageVisibility), updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
        { onConflict: 'key' }
      );
    setPvSaving(false);
    void logAuditEventAction({ category: 'admin', action: 'admin.settings_changed', actor_id: user?.id ?? undefined, description: 'Page visibility settings updated', metadata: { setting: 'page_visibility' } });
    setToast({ type: 'success', message: 'Page visibility settings saved.' });
  }

  function updatePageVisibility(path: string, field: keyof PageVisibilityEntry, value: boolean | string) {
    setPageVisibility(prev => ({
      ...prev,
      [path]: { ...prev[path], [field]: value },
    }));
  }

  // Combined save: Maintenance Mode + Chatbot
  const [box1Saving, setBox1Saving] = useState(false);
  async function saveBox1() {
    setBox1Saving(true);
    await saveMmSettings();
    await saveCmSettings();
    setBox1Saving(false);
  }

  // Combined save: All sandboxes
  const [box2Saving, setBox2Saving] = useState(false);
  async function saveBox2() {
    setBox2Saving(true);
    await saveSbSettings();
    await saveFsSettings();
    await saveChSettings();
    setBox2Saving(false);
  }

  // Sandbox active count for header badge
  const sandboxActiveCount = [sbEnabled, fsEnabled, chEnabled].filter(Boolean).length;

  const isAnyLoading = mmLoading || sbLoading || cmLoading || fsLoading || chLoading;

  return (
    <div className="space-y-6">

      {/* ══════ BOX 1: Maintenance Mode + Chatbot ══════ */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Maintenance Mode</h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${mmStatusInfo.dot}`} />
            <span className={mmStatusInfo.labelCls}>{mmStatusInfo.label}</span>
          </span>
        </div>

        {isAnyLoading ? (
          <div className="px-6 py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#00B5A3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Site maintenance toggle */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#374151]">Enable Maintenance Mode</p>
                <p className="text-xs text-[#6B7280] mt-1">
                  Immediately redirect all non-admin users to the maintenance page.
                </p>
              </div>
              <Toggle checked={mmEnabled} onChange={handleEnableToggle} />
            </div>

            {mmEnabled && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs font-medium text-red-700">Maintenance mode is active. Non-admin users cannot access the site.</p>
              </div>
            )}

            {/* Maintenance message */}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Maintenance Message</label>
              <textarea
                value={mmMessage}
                onChange={e => setMmMessage(e.target.value)}
                rows={3}
                placeholder="We are currently performing scheduled maintenance. We will be back online shortly."
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30 focus:border-[#00B5A3] resize-none transition-colors"
              />
              <p className="mt-1.5 text-xs text-[#6B7280]">Shown to visitors on the maintenance page.</p>
            </div>

            {/* Scheduled window */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#374151]">Scheduled Window</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Automatically activate maintenance during a specific time range.
                </p>
              </div>
              <Toggle checked={mmScheduled} onChange={setMmScheduled} />
            </div>

            {mmScheduled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Start (local time)</label>
                  <input
                    type="datetime-local"
                    value={mmStart}
                    onChange={e => setMmStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30 focus:border-[#00B5A3] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">End (local time)</label>
                  <input
                    type="datetime-local"
                    value={mmEnd}
                    onChange={e => setMmEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30 focus:border-[#00B5A3] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Divider — Chatbot Maintenance */}
            <div className="border-t border-[#E5E7EB] pt-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#374151]">Chatbot Maintenance Mode</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Hide the chat widget from regular users. Admins will still see it with a maintenance badge.
                  </p>
                </div>
                <Toggle checked={cmEnabled} onChange={setCmEnabled} />
              </div>

              {cmEnabled && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs font-medium text-amber-800">Chatbot is hidden from regular users. Admin users can still see and test the widget.</p>
                </div>
              )}
            </div>

            <div className="border-t border-[#E5E7EB] pt-5">
              <SaveButton saving={box1Saving || mmSaving} onClick={saveBox1} />
            </div>
          </div>
        )}
      </div>

      {/* ══════ BOX 2: Sandboxes ══════ */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-[#1B3A5C]">Sandboxes</h2>
            {!isAnyLoading && (
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                sandboxActiveCount > 0
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}>
                {sandboxActiveCount > 0 ? `${sandboxActiveCount} active` : 'All inactive'}
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">Sandbox modes restrict features to admins only for testing.</p>
        </div>

        {isAnyLoading ? (
          <div className="px-6 py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#00B5A3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Email Sandbox */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#374151]">Email Sandbox</p>
                <p className="text-xs text-[#6B7280] mt-1">
                  Redirect all outgoing emails to a single address instead of the real recipients.
                </p>
              </div>
              <Toggle checked={sbEnabled} onChange={setSbEnabled} />
            </div>

            {sbEnabled && (
              <>
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs font-medium text-yellow-800">Sandbox is active. No real users will receive emails until this is disabled.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">Redirect all emails to</label>
                  <input
                    type="email"
                    value={sbRecipient}
                    onChange={e => setSbRecipient(e.target.value)}
                    placeholder="till@seyer-marketing.de"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30 focus:border-[#00B5A3] font-mono transition-colors"
                  />
                  <p className="mt-1.5 text-xs text-[#6B7280]">All outgoing emails will be delivered to this address instead.</p>
                </div>
              </>
            )}

            {/* Divider — Flows Sandbox */}
            <div className="border-t border-[#E5E7EB] pt-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#374151]">Flows Sandbox</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Hide flows from regular users. Admins can still see and test all flows.
                  </p>
                </div>
                <Toggle checked={fsEnabled} onChange={setFsEnabled} />
              </div>

              {fsEnabled && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs font-medium text-amber-800">Flows are hidden from regular users. Admin users can still see and test.</p>
                </div>
              )}
            </div>

            {/* Divider — Credit Hours Sandbox */}
            <div className="border-t border-[#E5E7EB] pt-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#374151]">Credit Hours Sandbox</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Hide credit hour submissions from regular users. Admins can still access.
                  </p>
                </div>
                <Toggle checked={chEnabled} onChange={setChEnabled} />
              </div>

              {chEnabled && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs font-medium text-amber-800">Credit Hours are hidden from regular users.</p>
                </div>
              )}
            </div>

            <div className="border-t border-[#E5E7EB] pt-5">
              <SaveButton saving={box2Saving || sbSaving} onClick={saveBox2} />
            </div>
          </div>
        )}
      </div>

      {/* ══════ BOX 3: Theme Lock ══════ */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Theme Lock</h2>
          {!tlLoading && (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              themeLock === 'light'
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : themeLock === 'dark'
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}>
              {themeLock === 'light' ? 'Forced Light' : themeLock === 'dark' ? 'Forced Dark' : 'Unlocked'}
            </span>
          )}
        </div>

        {tlLoading ? (
          <div className="px-6 py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#00B5A3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Force theme for all non-admin users</label>
              <select
                value={themeLock}
                onChange={e => setThemeLock(e.target.value)}
                className="w-full max-w-xs px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30 focus:border-[#00B5A3] transition-colors"
              >
                <option value="">Unlocked (default)</option>
                <option value="light">Force Light Mode</option>
                <option value="dark">Force Dark Mode</option>
              </select>
              <p className="mt-1.5 text-xs text-[#6B7280]">
                Use this if one theme has a visual bug. Admins are not affected and can still switch freely.
              </p>
            </div>

            <div className="border-t border-[#E5E7EB] pt-5">
              <SaveButton saving={tlSaving} onClick={saveTlSettings} />
            </div>
          </div>
        )}
      </div>

      {/* ══════ BOX 4: Page Visibility ══════ */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Page Visibility</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Disable individual pages. Users on a disabled page are redirected to the fallback.
          </p>
        </div>

        {pvLoading ? (
          <div className="px-6 py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#00B5A3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Page</th>
                    <th className="text-center py-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Enabled</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fallback 1</th>
                    <th className="text-left py-2 pl-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fallback 2</th>
                  </tr>
                </thead>
                <tbody>
                  {PAGE_VISIBILITY_PAGES.map(page => {
                    const entry = pageVisibility[page.path] ?? { enabled: true, fallback1: page.defaultFallback1, fallback2: page.defaultFallback2 };
                    const otherPages = PAGE_VISIBILITY_PAGES.filter(p => p.path !== page.path);
                    return (
                      <tr key={page.path} className="border-b border-slate-100">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-800">{page.label}</p>
                          <p className="text-xs text-slate-400 font-mono">{page.path}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Toggle
                            checked={entry.enabled}
                            onChange={(v) => updatePageVisibility(page.path, 'enabled', v)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={entry.fallback1}
                            onChange={e => updatePageVisibility(page.path, 'fallback1', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30"
                          >
                            {otherPages.map(p => (
                              <option key={p.path} value={p.path}>{p.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pl-4">
                          <select
                            value={entry.fallback2}
                            onChange={e => updatePageVisibility(page.path, 'fallback2', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/30"
                          >
                            {otherPages.map(p => (
                              <option key={p.path} value={p.path}>{p.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[#E5E7EB] pt-5">
              <SaveButton saving={pvSaving} onClick={savePvSettings} />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation dialog for enabling site maintenance */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1B3A5C]">Enable Maintenance Mode?</h3>
                <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
                  All non-admin users will be immediately redirected to the maintenance page. Admin users can still access the site normally.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); saveMmSettings(true); }}
                className="px-4 py-2 text-sm font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Enable Maintenance
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />}
    </div>
  );
}
