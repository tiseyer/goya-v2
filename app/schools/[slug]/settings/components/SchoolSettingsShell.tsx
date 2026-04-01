'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavItem {
  segment: string | null;
  label: string;
  paths: string[];
}

function buildNavItems(slug: string): NavItem[] {
  return [
    {
      segment: null,
      label: 'General',
      paths: [
        'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      ],
    },
    {
      segment: 'online-presence',
      label: 'Online Presence',
      paths: [
        'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
      ],
    },
    {
      segment: 'teaching',
      label: 'Teaching Info',
      paths: [
        'M12 14l9-5-9-5-9 5 9 5z',
        'M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
        'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
      ],
    },
    {
      segment: 'location',
      label: 'Location',
      paths: [
        'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
        'M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      ],
    },
    {
      segment: 'faculty',
      label: 'Faculty',
      paths: [
        'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      ],
    },
    {
      segment: 'designations',
      label: 'Designations',
      paths: [
        'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
      ],
    },
    {
      segment: 'documents',
      label: 'Documents',
      paths: [
        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      ],
    },
    {
      segment: 'subscription',
      label: 'Subscription',
      paths: [
        'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      ],
    },
  ].map(item => ({ ...item }));
}

interface SchoolSettingsShellProps {
  children: React.ReactNode;
  schoolSlug: string;
  schoolStatus?: string;
}

export default function SchoolSettingsShell({ children, schoolSlug, schoolStatus }: SchoolSettingsShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = buildNavItems(schoolSlug);

  useEffect(() => {
    const stored = localStorage.getItem('school-settings-sidebar-collapsed');
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('school-settings-sidebar-collapsed', String(next));
      return next;
    });
  }

  const baseHref = `/schools/${schoolSlug}/settings`;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside
        style={{ width: collapsed ? '64px' : '248px' }}
        className="sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out z-10"
      >
        {/* Toggle */}
        <div className="flex items-center h-14 px-3 border-b border-slate-200 shrink-0">
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-50 transition-colors cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          {!collapsed && (
            <span className="ml-2.5 text-sm font-bold text-primary-dark whitespace-nowrap overflow-hidden">
              School Settings
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const href = item.segment ? `${baseHref}/${item.segment}` : baseHref;
            const isActive = item.segment === null
              ? pathname === baseHref
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? item.label : undefined}
                className={[
                  'flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
                ].join(' ')}
              >
                <div className="relative shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {item.paths.map((d, i) => (
                      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.75} d={d} />
                    ))}
                  </svg>
                </div>
                {!collapsed && (
                  <span className="flex-1 text-sm whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-slate-200 shrink-0">
            <p className="text-[11px] font-bold text-primary-dark leading-none">School Settings</p>
            <p className="text-[10px] text-slate-400 mt-1">v2.0.0-alpha</p>
          </div>
        )}
        {collapsed && (
          <div className="py-4 border-t border-slate-200 flex justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 bg-surface-muted">
        {/* Status banner */}
        {schoolStatus === 'pending_review' && (
          <div className="mx-6 mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Your school is currently under review</p>
                <p className="text-sm text-amber-700 mt-0.5">This can take up to 1 week. You will be notified once the review is complete.</p>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
