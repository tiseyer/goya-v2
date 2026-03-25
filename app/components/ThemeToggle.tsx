'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const THEMES = [
  {
    key: 'light' as const,
    label: 'Light',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'system' as const,
    label: 'System',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'dark' as const,
    label: 'Dark',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
];

async function persistTheme(theme: string) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ theme_preference: theme }).eq('id', user.id);
    }
  } catch {
    // Non-critical — localStorage fallback via next-themes still works
  }
}

/**
 * Cards variant — for Settings > General page.
 * Shows three clickable cards in a row with icon + label.
 */
export function ThemeCards() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex gap-3">
        {THEMES.map((t) => (
          <div key={t.key} className="flex-1 h-16 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {THEMES.map((t) => {
        const active = theme === t.key;
        return (
          <button
            key={t.key}
            onClick={() => {
              setTheme(t.key);
              persistTheme(t.key);
            }}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer',
              active
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-goya-border bg-surface text-foreground-secondary hover:border-primary/30',
            ].join(' ')}
          >
            {t.icon}
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Inline variant — for profile dropdown.
 * Shows three small icon buttons in a row.
 */
export function ThemeInline() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-center gap-1">
      {THEMES.map((t) => {
        const active = theme === t.key;
        return (
          <button
            key={t.key}
            onClick={() => {
              setTheme(t.key);
              persistTheme(t.key);
            }}
            title={t.label}
            className={[
              'p-2 rounded-lg transition-all duration-150 cursor-pointer',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-foreground-tertiary hover:text-foreground-secondary hover:bg-surface-muted',
            ].join(' ')}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
}
