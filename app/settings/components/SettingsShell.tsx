'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isAdminOrMod } from '@/lib/roles';

interface NavItem {
  href: string;
  label: string;
  paths: string[];
  /** If set, only show for these roles */
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/settings',
    label: 'General',
    paths: [
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
  },
  {
    href: '/settings/subscriptions',
    label: 'Subscriptions',
    paths: [
      'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    ],
  },
  {
    href: '/settings/connections',
    label: 'Connections',
    paths: [
      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    ],
  },
  {
    href: '/settings/inbox',
    label: 'Inbox',
    paths: [
      'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
    ],
  },
  {
    href: '/settings/my-events',
    label: 'My Events',
    roles: ['teacher', 'wellness_practitioner', 'admin'],
    paths: [
      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    ],
  },
  {
    href: '/settings/media',
    label: 'Media',
    roles: ['teacher', 'wellness_practitioner', 'admin'],
    paths: [
      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    ],
  },
  {
    href: '/settings/my-courses',
    label: 'My Courses',
    roles: ['teacher', 'wellness_practitioner', 'admin'],
    paths: [
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    ],
  },
  {
    href: '/settings/help',
    label: 'Help',
    paths: ['M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  },
];

export default function SettingsShell({ children, userRole }: { children: React.ReactNode; userRole?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [chatbotMaintenance, setChatbotMaintenance] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('settings-sidebar-collapsed');
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  // Fetch chatbot maintenance mode status for Help item indicator
  useEffect(() => {
    if (!isAdminOrMod(userRole)) return;
    fetch('/api/chatbot/config')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.chatbot_maintenance_mode) setChatbotMaintenance(true);
      })
      .catch(() => {});
  }, [userRole]);

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('settings-sidebar-collapsed', String(next));
      return next;
    });
  }

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
              Settings
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.roles || (userRole && item.roles.includes(userRole))).map(item => {
            const isActive = item.href === '/settings'
              ? pathname === '/settings'
              : pathname.startsWith(item.href);
            const isHelpMaintenance = item.label === 'Help' && chatbotMaintenance;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={[
                  'flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
                  isHelpMaintenance ? 'ring-2 ring-amber-400' : '',
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
            <p className="text-[11px] font-bold text-primary-dark leading-none">Settings</p>
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
        {children}
      </div>
    </div>
  );
}
