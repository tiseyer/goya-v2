'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServiceCheck {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  notes: string;
}

interface HealthResponse {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  services: ServiceCheck[];
  maintenanceSettings?: Record<string, string>;
}

export default function HealthAlertBanner() {
  const [alert, setAlert] = useState<{ severity: 'warning' | 'error'; message: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    fetch('/api/admin/health', { signal: controller.signal, cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then((data: HealthResponse | null) => {
        if (!data) return;

        const downServices = data.services.filter(s => s.status === 'down');
        const degradedServices = data.services.filter(s => s.status === 'degraded');
        const maintenanceActive = data.maintenanceSettings?.maintenance_mode_enabled === 'true';

        if (data.overallStatus === 'critical' || downServices.length > 0) {
          const msg = downServices.length === 1
            ? `${downServices[0].name} is unreachable`
            : `${downServices.length} services are down`;
          setAlert({ severity: 'error', message: msg });
        } else if (maintenanceActive) {
          setAlert({ severity: 'warning', message: 'Maintenance mode is active' });
        } else if (degradedServices.length > 0) {
          const msg = degradedServices.length === 1
            ? `${degradedServices[0].name} is degraded`
            : `${degradedServices.length} services degraded`;
          setAlert({ severity: 'warning', message: msg });
        }
      })
      .catch(() => {
        // Fail silently
      })
      .finally(() => clearTimeout(timeout));

    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  if (!alert || dismissed) return null;

  const isError = alert.severity === 'error';

  return (
    <div className={`mb-6 rounded-xl border p-4 flex items-center justify-between gap-4 ${
      isError
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        {isError ? (
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
        <p className={`text-sm font-medium truncate ${isError ? 'text-red-800' : 'text-amber-800'}`}>
          {isError ? 'Critical: ' : 'Platform issue detected: '}
          {alert.message}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            isError
              ? 'text-red-600 hover:bg-red-100'
              : 'text-amber-600 hover:bg-amber-100'
          }`}
        >
          Dismiss
        </button>
        <Link
          href="/admin/settings?tab=health"
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors ${
            isError
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          View Health
        </Link>
      </div>
    </div>
  );
}
