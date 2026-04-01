'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaintenanceSettings {
  enabled: boolean;
  scheduled: boolean;
  endUtc: string;
  message: string;
}

// ─── Lotus SVG ────────────────────────────────────────────────────────────────

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Center petal */}
      <path
        d="M40 12C40 12 32 28 32 42C32 52 36 58 40 60C44 58 48 52 48 42C48 28 40 12 40 12Z"
        fill="currentColor"
        opacity="0.25"
      />
      {/* Left petal */}
      <path
        d="M40 60C40 60 20 50 14 38C10 30 12 22 16 18C20 22 28 34 40 60Z"
        fill="currentColor"
        opacity="0.18"
      />
      {/* Right petal */}
      <path
        d="M40 60C40 60 60 50 66 38C70 30 68 22 64 18C60 22 52 34 40 60Z"
        fill="currentColor"
        opacity="0.18"
      />
      {/* Far left petal */}
      <path
        d="M40 60C40 60 12 56 6 44C2 36 4 28 8 24C14 30 24 42 40 60Z"
        fill="currentColor"
        opacity="0.12"
      />
      {/* Far right petal */}
      <path
        d="M40 60C40 60 68 56 74 44C78 36 76 28 72 24C66 30 56 42 40 60Z"
        fill="currentColor"
        opacity="0.12"
      />
    </svg>
  );
}

// ─── Maintenance page ─────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['maintenance_mode_enabled', 'maintenance_mode_scheduled', 'maintenance_end_utc', 'maintenance_message']);

      if (data) {
        const map: Record<string, string> = {};
        (data as Array<{ key: string; value: string }>).forEach(r => { map[r.key] = r.value ?? ''; });
        setSettings({
          enabled:   map.maintenance_mode_enabled === 'true',
          scheduled: map.maintenance_mode_scheduled === 'true',
          endUtc:    map.maintenance_end_utc ?? '',
          message:   map.maintenance_message || '',
        });
      }
    }
    load();
    // Gentle fade-in on mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const message = settings?.message || '';

  // Show countdown only when in scheduled mode (not manually enabled) and an end time is set
  const showTimer = settings !== null && settings.scheduled && !settings.enabled && !!settings.endUtc;

  const endFormatted = settings?.endUtc
    ? new Date(settings.endUtc).toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : '';

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center px-6 relative bg-[var(--goya-surface-warm)]">

      {/* Subtle background mandala watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <svg className="w-[600px] h-[600px] text-[var(--goya-primary)] opacity-[0.03]" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="0.5" />
          {/* Radial lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 200 + 60 * Math.cos(angle);
            const y1 = 200 + 60 * Math.sin(angle);
            const x2 = 200 + 180 * Math.cos(angle);
            const y2 = 200 + 180 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" />;
          })}
          {/* Petal arcs */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const cx = 200 + 120 * Math.cos(angle);
            const cy = 200 + 120 * Math.sin(angle);
            return <circle key={`p${i}`} cx={cx} cy={cy} r="40" stroke="currentColor" strokeWidth="0.5" />;
          })}
        </svg>
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center text-center max-w-md transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/GOYA Logo Blue.png" alt="GOYA" className="w-40 mx-auto" />
        </Link>

        {/* Breathing lotus */}
        <div className="mb-8">
          <LotusIcon className="w-16 h-16 text-[var(--goya-primary)] animate-[breathe_6s_ease-in-out_infinite]" />
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--goya-primary-dark)] mb-3 tracking-tight">
          A moment of stillness
        </h1>

        {/* Subtext */}
        <p className="text-[var(--foreground-secondary)] text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
          {message || "We\u2019re tending to our platform with care. Take a breath \u2014 we\u2019ll be back shortly."}
        </p>

        {/* Scheduled end time */}
        {showTimer && endFormatted && (
          <div className="bg-white/80 backdrop-blur-sm border border-[var(--goya-border)] rounded-2xl px-6 py-4 text-center mb-8 max-w-sm w-full">
            <p className="text-[10px] text-[var(--foreground-tertiary)] uppercase tracking-[0.15em] font-medium mb-1.5">
              Expected back online
            </p>
            <p className="text-sm font-medium text-[var(--foreground)]">{endFormatted}</p>
          </div>
        )}

        {/* Admin link */}
        <Link
          href="/sign-in"
          className="text-xs text-[var(--foreground-tertiary)] hover:text-[var(--foreground-secondary)] transition-colors"
        >
          Admin access &rarr;
        </Link>

        {/* Legal links */}
        <p className="text-center text-xs text-[var(--foreground-tertiary)] mt-8">
          <Link href="/privacy" className="hover:text-[var(--foreground-secondary)] hover:underline transition-colors">Privacy Policy</Link>
          {' '}&middot;{' '}
          <Link href="/terms" className="hover:text-[var(--foreground-secondary)] hover:underline transition-colors">Terms of Use</Link>
        </p>
      </div>

      {/* Breathing animation keyframes */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
