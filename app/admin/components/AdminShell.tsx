'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type NavLink = {
  type: 'link';
  href: string;
  label: string;
  badge?: boolean;
  paths: string[];
};

type NavGroup = {
  type: 'group';
  label: string;
  paths: string[];
  children: Omit<NavLink, 'type'>[];
};

type NavItem = NavLink | NavGroup;

// Role gating: AdminLayout redirects non-admin/moderator users before this component renders.
// Shop nav items are visible to all users who reach AdminShell (admin + moderator only).
const NAV_ITEMS: NavItem[] = [
  {
    type: 'link',
    href: '/admin/dashboard',
    label: 'Dashboard',
    paths: [
      'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
    ],
  },
  {
    type: 'link',
    href: '/admin/inbox',
    label: 'Inbox',
    badge: true,
    paths: [
      'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
    ],
  },
  {
    type: 'link',
    href: '/admin/users',
    label: 'Users',
    paths: [
      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    ],
  },
  {
    type: 'link',
    href: '/admin/verification',
    label: 'Verification',
    paths: [
      'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    ],
  },
  {
    type: 'link',
    href: '/admin/events',
    label: 'Events',
    paths: [
      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    ],
  },
  {
    type: 'link',
    href: '/admin/courses',
    label: 'Courses',
    paths: [
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    ],
  },
  {
    type: 'group',
    label: 'Shop',
    paths: ['M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z'],
    children: [
      { href: '/admin/shop/orders', label: 'Orders', paths: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'] },
      { href: '/admin/shop/products', label: 'Products', paths: ['M16 11V7a4 4 0 00-8 0v4M5 9h14l1 10H4L5 9z'] },
      { href: '/admin/shop/coupons', label: 'Coupons', paths: ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'] },
      { href: '/admin/shop/analytics', label: 'Analytics', paths: ['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'] },
    ],
  },
  {
    type: 'link',
    href: '/admin/credits',
    label: 'Credits',
    paths: [
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    ],
  },
  {
    type: 'link',
    href: '/admin/audit-log',
    label: 'Audit Log',
    paths: [
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    ],
  },
  {
    type: 'link',
    href: '/admin/settings',
    label: 'Settings',
    paths: [
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [pendingSchools, setPendingSchools] = useState(0);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin/shop')) setShopOpen(true);
  }, [pathname]);

  useEffect(() => {
    async function fetchPendingSchools() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from('schools')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingSchools(count ?? 0);
    }
    fetchPendingSchools();
  }, [pathname]);

  useEffect(() => {
    async function checkMaintenance() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('site_settings')
        .select('key, value')
        .in('key', ['maintenance_mode_enabled', 'maintenance_mode_scheduled', 'maintenance_start_utc', 'maintenance_end_utc']);
      if (!data) return;
      const map: Record<string, string> = {};
      (data as Array<{ key: string; value: string }>).forEach(r => { map[r.key] = r.value ?? ''; });
      const enabled   = map.maintenance_mode_enabled === 'true';
      const scheduled = map.maintenance_mode_scheduled === 'true';
      const now = Date.now();
      let active = enabled;
      if (!active && scheduled) {
        const start = map.maintenance_start_utc ? new Date(map.maintenance_start_utc).getTime() : 0;
        const end   = map.maintenance_end_utc   ? new Date(map.maintenance_end_utc).getTime()   : 0;
        active = start > 0 && end > 0 && now >= start && now <= end;
      }
      setMaintenanceActive(active);
    }
    checkMaintenance();
  }, []);

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin-sidebar-collapsed', String(next));
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
              Admin
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            if (item.type === 'group') {
              const isAnyChildActive = item.children.some(child => pathname.startsWith(child.href));
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setShopOpen(prev => !prev)}
                    title={collapsed ? item.label : undefined}
                    className={[
                      'w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150 cursor-pointer',
                      collapsed ? 'justify-center' : '',
                      isAnyChildActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
                    ].join(' ')}
                  >
                    <div className="relative shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        {item.paths.map((d, i) => (
                          <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={isAnyChildActive ? 2 : 1.75} d={d} />
                        ))}
                      </svg>
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-sm whitespace-nowrap overflow-hidden text-left">
                          {item.label}
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {shopOpen && !collapsed && (
                    <div className="mt-0.5 space-y-0.5">
                      {item.children.map(child => {
                        const isChildActive = pathname.startsWith(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={[
                              'flex items-center gap-3 pl-9 pr-2 py-2 rounded-xl transition-all duration-150',
                              isChildActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
                            ].join(' ')}
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              {child.paths.map((d, i) => (
                                <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={isChildActive ? 2 : 1.75} d={d} />
                              ))}
                            </svg>
                            <span className="text-xs whitespace-nowrap overflow-hidden">
                              {child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // type === 'link'
            const isActive = pathname.startsWith(item.href);
            const badgeCount = item.badge ? pendingSchools : 0;
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
                ].join(' ')}
              >
                <div className="relative shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {item.paths.map((d, i) => (
                      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.75} d={d} />
                    ))}
                  </svg>
                  {badgeCount > 0 && collapsed && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="flex-1 text-sm whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
                {!collapsed && badgeCount > 0 && (
                  <span className="ml-auto shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-slate-200 shrink-0">
            <p className="text-[11px] font-bold text-primary-dark leading-none">GOYA Admin</p>
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
        {maintenanceActive && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="text-sm font-medium text-amber-800 flex-1">
              Maintenance mode is active — non-admin users are seeing the maintenance page.
            </p>
            <Link
              href="/admin/settings"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors shrink-0"
            >
              Manage →
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
