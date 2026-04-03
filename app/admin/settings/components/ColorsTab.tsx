'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logAuditEventAction } from '@/app/actions/audit';
import type { BrandColors, RoleColors } from '@/lib/theme/types';
import {
  DEFAULT_BRAND_COLORS,
  DEFAULT_ROLE_COLORS,
  DEFAULT_MAINTENANCE_COLOR,
  BRAND_CSS_VARS,
  ROLE_CSS_VARS,
  MAINTENANCE_CSS_VAR,
} from '@/lib/theme/defaults';

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#1B3A5C]">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

type ToastType = 'success' | 'error';

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
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
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

// ─── ColorRow ─────────────────────────────────────────────────────────────────

function ColorRow({
  label,
  value,
  defaultValue,
  onChange,
  onReset,
}: {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (hex: string) => void;
  onReset: () => void;
}) {
  const isDirty = value.toLowerCase() !== defaultValue.toLowerCase();

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Accept partial input while typing; only propagate valid 7-char hex
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-sm font-medium text-[#374151]">{label}</span>
      <div className="flex items-center gap-3">
        {/* Native color picker */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-[#E5E7EB] p-0.5 bg-white"
          title={`Pick color for ${label}`}
        />
        {/* Hex text input */}
        <input
          type="text"
          defaultValue={value}
          key={value}
          onChange={handleHexInput}
          pattern="^#[0-9a-fA-F]{6}$"
          maxLength={7}
          className="w-24 text-sm font-mono border border-[#E5E7EB] rounded-md px-2 py-1 text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent"
          title={`Hex value for ${label}`}
        />
        {/* Swatch preview */}
        <div
          className="w-6 h-6 rounded border border-[#E5E7EB] shrink-0"
          style={{ backgroundColor: value }}
          title={`Preview: ${value}`}
        />
        {/* Reset button — visible only when changed from default */}
        <button
          onClick={onReset}
          title={`Reset ${label} to default (${defaultValue})`}
          className={`text-slate-400 hover:text-[#374151] transition-colors ${isDirty ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-hidden={!isDirty}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Label maps ──────────────────────────────────────────────────────────────

const BRAND_LABELS: Record<keyof BrandColors, string> = {
  primary: 'Primary Blue',
  accent: 'Accent Red',
  background: 'Background',
  surface: 'Surface',
  border: 'Border',
  foreground: 'Text Foreground',
};

const ROLE_LABELS: Record<keyof RoleColors, string> = {
  student: 'Student',
  teacher: 'Teacher',
  wellness: 'Wellness Practitioner',
  school: 'School',
  moderator: 'Moderator',
  admin: 'Admin',
};

// ─── ColorsTab ────────────────────────────────────────────────────────────────

export default function ColorsTab() {
  const [brandColors, setBrandColors] = useState<BrandColors>({ ...DEFAULT_BRAND_COLORS });
  const [roleColors, setRoleColors] = useState<RoleColors>({ ...DEFAULT_ROLE_COLORS });
  const [maintenanceColor, setMaintenanceColor] = useState<string>(DEFAULT_MAINTENANCE_COLOR);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Load existing colors from DB on mount ──────────────────────────────────
  useEffect(() => {
    async function loadColors() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['brand_colors', 'role_colors', 'maintenance_indicator_color']);

      if (data) {
        const brandRow = data.find((r) => r.key === 'brand_colors');
        const roleRow = data.find((r) => r.key === 'role_colors');
        const maintRow = data.find((r) => r.key === 'maintenance_indicator_color');

        if (brandRow?.value) {
          try {
            setBrandColors({ ...DEFAULT_BRAND_COLORS, ...JSON.parse(brandRow.value) });
          } catch {
            // keep defaults on parse error
          }
        }
        if (roleRow?.value) {
          try {
            setRoleColors({ ...DEFAULT_ROLE_COLORS, ...JSON.parse(roleRow.value) });
          } catch {
            // keep defaults on parse error
          }
        }
        if (maintRow?.value) {
          setMaintenanceColor(maintRow.value);
        }
      }

      setLoaded(true);
    }

    loadColors();
  }, []);

  // ── Live CSS variable preview ──────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    (Object.keys(brandColors) as (keyof BrandColors)[]).forEach((key) => {
      root.style.setProperty(BRAND_CSS_VARS[key], brandColors[key]);
    });
  }, [brandColors, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    (Object.keys(roleColors) as (keyof RoleColors)[]).forEach((key) => {
      root.style.setProperty(ROLE_CSS_VARS[key], roleColors[key]);
    });
  }, [roleColors, loaded]);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.style.setProperty(MAINTENANCE_CSS_VAR, maintenanceColor);
  }, [maintenanceColor, loaded]);

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const updatedBy = user?.id ?? null;

      const upserts = [
        supabase.from('site_settings').upsert(
          { key: 'brand_colors', value: JSON.stringify(brandColors), updated_at: now, updated_by: updatedBy },
          { onConflict: 'key' }
        ),
        supabase.from('site_settings').upsert(
          { key: 'role_colors', value: JSON.stringify(roleColors), updated_at: now, updated_by: updatedBy },
          { onConflict: 'key' }
        ),
        supabase.from('site_settings').upsert(
          { key: 'maintenance_indicator_color', value: maintenanceColor, updated_at: now, updated_by: updatedBy },
          { onConflict: 'key' }
        ),
      ];

      const results = await Promise.all(upserts);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        setToast({ type: 'error', message: 'Failed to save color settings. Please try again.' });
      } else {
        await logAuditEventAction({
          category: 'admin',
          action: 'admin.colors_updated',
          actor_id: user?.id ?? undefined,
          description: 'Color settings updated',
        });
        setToast({ type: 'success', message: 'Color settings saved successfully.' });
      }
    } catch {
      setToast({ type: 'error', message: 'An unexpected error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  }, [brandColors, roleColors, maintenanceColor]);

  // ── Reset All handler ──────────────────────────────────────────────────────
  const handleResetAll = useCallback(() => {
    setBrandColors({ ...DEFAULT_BRAND_COLORS });
    setRoleColors({ ...DEFAULT_ROLE_COLORS });
    setMaintenanceColor(DEFAULT_MAINTENANCE_COLOR);
    setToast({ type: 'success', message: 'All colors reset to defaults. Click Save to persist.' });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header row with Save button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6B7280]">Customize platform colors. Changes preview instantly.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#00B5A3] text-white text-sm font-semibold rounded-lg hover:bg-[#009e8f] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* Brand Colors section */}
      <Section title="Brand Colors">
        {(Object.keys(DEFAULT_BRAND_COLORS) as (keyof BrandColors)[]).map((key) => (
          <ColorRow
            key={key}
            label={BRAND_LABELS[key]}
            value={brandColors[key]}
            defaultValue={DEFAULT_BRAND_COLORS[key]}
            onChange={(hex) => setBrandColors((prev) => ({ ...prev, [key]: hex }))}
            onReset={() => setBrandColors((prev) => ({ ...prev, [key]: DEFAULT_BRAND_COLORS[key] }))}
          />
        ))}
      </Section>

      {/* Role Colors section */}
      <Section title="Role Colors">
        {(Object.keys(DEFAULT_ROLE_COLORS) as (keyof RoleColors)[]).map((key) => (
          <ColorRow
            key={key}
            label={ROLE_LABELS[key]}
            value={roleColors[key]}
            defaultValue={DEFAULT_ROLE_COLORS[key]}
            onChange={(hex) => setRoleColors((prev) => ({ ...prev, [key]: hex }))}
            onReset={() => setRoleColors((prev) => ({ ...prev, [key]: DEFAULT_ROLE_COLORS[key] }))}
          />
        ))}
      </Section>

      {/* Maintenance Indicator section */}
      <Section title="Maintenance Indicator">
        <ColorRow
          label="Maintenance Indicator"
          value={maintenanceColor}
          defaultValue={DEFAULT_MAINTENANCE_COLOR}
          onChange={setMaintenanceColor}
          onReset={() => setMaintenanceColor(DEFAULT_MAINTENANCE_COLOR)}
        />
      </Section>

      {/* ── Live Preview ─────────────────────────────────────────────────── */}
      <div className="border-t border-[#E5E7EB] pt-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Live Preview</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Changes update in real time</p>
        </div>

        <div className="space-y-4">
          {/* 1. Hero strip */}
          <div
            className="rounded-xl overflow-hidden p-6 text-center relative"
            style={{ backgroundColor: brandColors.primary }}
          >
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            <div className="relative">
              <span className="inline-block px-3 py-1 bg-white/15 border border-white/20 rounded-full text-white text-xs font-semibold mb-2">Upcoming Events</span>
              <h3 className="text-2xl font-black text-white">Hero Section Preview</h3>
              <p className="text-white/70 text-sm mt-1">Subtitle text uses primary blue as background</p>
            </div>
          </div>

          {/* 2. Buttons row */}
          <div className="flex flex-wrap gap-3">
            <span
              className="px-4 py-2 text-white text-sm font-semibold rounded-lg cursor-default"
              style={{ backgroundColor: brandColors.primary }}
            >
              Primary Button
            </span>
            <span
              className="px-4 py-2 text-sm font-semibold rounded-lg cursor-default"
              style={{ border: `1px solid ${brandColors.border}`, color: brandColors.foreground }}
            >
              Secondary Button
            </span>
            <span
              className="px-4 py-2 text-white text-sm font-semibold rounded-lg cursor-default"
              style={{ backgroundColor: brandColors.accent }}
            >
              Destructive Button
            </span>
          </div>

          {/* 3. Typography */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold" style={{ color: brandColors.foreground }}>Heading Text</h3>
            <p className="text-sm" style={{ color: brandColors.foreground }}>Body text in the foreground color. This shows how regular content appears.</p>
            <p className="text-sm" style={{ color: brandColors.foreground, opacity: 0.5 }}>Muted secondary text at 50% opacity.</p>
          </div>

          {/* 4. Surface & Border card */}
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: brandColors.surface, border: `1px solid ${brandColors.border}` }}
          >
            <p className="text-sm" style={{ color: brandColors.foreground }}>Content card with Surface background and Border color</p>
          </div>

          {/* 5. Role pills */}
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Role badges:</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(roleColors) as (keyof RoleColors)[]).map((key) => (
                <span
                  key={key}
                  className="px-3 py-1 text-white text-xs font-semibold rounded-full cursor-default"
                  style={{ backgroundColor: roleColors[key] }}
                >
                  {ROLE_LABELS[key]}
                </span>
              ))}
            </div>
          </div>

          {/* 6. Maintenance indicator */}
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Maintenance mode indicator:</p>
            <div
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white flex items-center gap-2"
              style={{ backgroundColor: maintenanceColor }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Platform is currently undergoing maintenance
            </div>
          </div>

          {/* 7. Free badge + price badge */}
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Event badges:</p>
            <div className="flex gap-3">
              <span
                className="px-3 py-1 text-white text-sm font-bold rounded-full cursor-default"
                style={{ backgroundColor: brandColors.primary }}
              >
                Free
              </span>
              <span
                className="px-3 py-1 text-sm font-bold rounded-full cursor-default"
                style={{ backgroundColor: brandColors.surface, border: `1px solid ${brandColors.border}`, color: brandColors.foreground }}
              >
                $25
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset All button */}
      <div className="flex justify-end">
        <button
          onClick={handleResetAll}
          className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
        >
          Reset All to Defaults
        </button>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />}
    </div>
  );
}
