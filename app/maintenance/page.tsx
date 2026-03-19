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

// ─── Maintenance page ─────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
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
          message:   map.maintenance_message || 'We are currently performing scheduled maintenance. We will be back online shortly. Thank you for your patience.',
        });
      }
    }
    load();
  }, []);

  const message = settings?.message ?? 'We are currently performing scheduled maintenance. We will be back online shortly. Thank you for your patience.';

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
    <div className="min-h-screen bg-gradient-to-br from-[#F7F8FA] to-[#EFF6FF] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/GOYA Logo Blue.png" alt="GOYA" style={{ width: '140px', height: 'auto' }} />
      </div>

      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-bold text-[#1B3A5C] mb-4 text-center">
        Under Maintenance
      </h1>

      {/* Message */}
      <p className="text-[#6B7280] text-center max-w-md mb-8 leading-relaxed text-sm sm:text-base">
        {message}
      </p>

      {/* Scheduled end time */}
      {showTimer && endFormatted && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl px-6 py-4 text-center shadow-sm mb-8 max-w-sm w-full">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-medium mb-1.5">Expected back online</p>
          <p className="text-sm font-semibold text-[#374151]">{endFormatted}</p>
        </div>
      )}

      {/* Admin link */}
      <Link
        href="/sign-in"
        className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors mt-2"
      >
        Admin access →
      </Link>
    </div>
  );
}
