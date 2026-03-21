'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/app/context/CartContext';
import MiniCart from './MiniCart';
import { useConnections } from '@/app/context/ConnectionsContext';
import type { NotifRecord } from '@/app/context/ConnectionsContext';
import { useImpersonation } from '@/app/context/ImpersonationContext';
import { endImpersonation } from '@/app/actions/impersonation';

// ─── config ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/members', label: 'Members' },
  { href: '/events',  label: 'Events'  },
  { href: '/academy', label: 'Academy' },
  { href: '/addons',  label: 'Add-Ons' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

// ─── hook: close on outside click ────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

// ─── dropdown shell ───────────────────────────────────────────────────────────

function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute right-0 top-full mt-2 z-50 min-w-[220px] bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden">
      {children}
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

function SearchWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useClickOutside(ref, () => { setOpen(false); setQuery(''); });

  function toggle() {
    setOpen(o => {
      if (!o) setTimeout(() => inputRef.current?.focus(), 50);
      else setQuery('');
      return !o;
    });
  }

  return (
    <div ref={ref} className="relative flex items-center">
      {/* Expanding input */}
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'w-52' : 'w-0'}`}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search GOYA…"
          className="w-full bg-slate-50 border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm text-[#1B3A5C] placeholder:text-[#6B7280] focus:outline-none focus:border-[#4E87A0] focus:ring-1 focus:ring-[#4E87A0]/40 mr-2"
        />
      </div>

      {/* Icon button */}
      <button
        onClick={toggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          open ? 'bg-[#4E87A0] text-white' : 'text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-100'
        }`}
        aria-label="Search"
      >
        {open ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </button>

      {/* Results dropdown */}
      {open && (
        <Dropdown>
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Search</p>
          </div>
          <div className="px-4 py-6 text-center">
            {query.trim() === '' ? (
              <p className="text-sm text-[#6B7280]">Start typing to search…</p>
            ) : (
              <>
                <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm text-[#6B7280] font-medium">No results yet</p>
                <p className="text-xs text-slate-400 mt-1">Search is coming soon.</p>
              </>
            )}
          </div>
        </Dropdown>
      )}
    </div>
  );
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Single notification item ─────────────────────────────────────────────────

function NotifItem({ notif, onAccept, onDecline }: {
  notif: NotifRecord;
  onAccept: () => void;
  onDecline: () => void;
}) {
  if (notif.type === 'connection_request') {
    return (
      <div className={`px-4 py-3 flex gap-3 items-start ${notif.read ? '' : 'bg-[#4E87A0]/5'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={notif.fromPhoto} alt={notif.fromName} className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#374151] leading-snug mb-2">
            <span className="font-semibold text-[#1B3A5C]">{notif.fromName}</span> wants to connect with you
          </p>
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="flex-1 bg-[#4E87A0] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-[#3A7190] transition-colors"
            >
              Accept
            </button>
            <button
              onClick={onDecline}
              className="flex-1 border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">{relativeTime(notif.createdAt)}</span>
      </div>
    );
  }

  if (notif.type === 'connection_accepted') {
    return (
      <div className="px-4 py-3 flex gap-3 items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={notif.fromPhoto} alt={notif.fromName} className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#374151] leading-snug">
            <span className="font-semibold text-[#1B3A5C]">{notif.fromName}</span>
            {' '}accepted your connection request
            {' '}<svg className="w-3.5 h-3.5 text-emerald-500 inline-block ml-0.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </p>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">{relativeTime(notif.createdAt)}</span>
      </div>
    );
  }

  if (notif.type === 'connection_declined') {
    return (
      <div className="px-4 py-3 flex gap-3 items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={notif.fromPhoto} alt={notif.fromName} className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#374151] leading-snug">
            <span className="font-semibold text-[#1B3A5C]">{notif.fromName}</span>
            {' '}declined your connection request
          </p>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">{relativeTime(notif.createdAt)}</span>
      </div>
    );
  }

  return null;
}

// ─── Notifications / Messages widget ─────────────────────────────────────────

function MessagesWidget() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, acceptRequest, declineRequest, markAllRead } = useConnections();
  useClickOutside(ref, () => setOpen(false));

  function handleOpen() {
    setOpen(o => !o);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          open ? 'bg-[#4E87A0] text-white' : 'text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-100'
        }`}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[340px] bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-[#4E87A0] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </p>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-[#4E87A0] hover:text-[#3A7190] font-semibold transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#E5E7EB]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0l-8 5-8-5" />
                </svg>
                <p className="text-sm text-[#6B7280] font-medium">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">Connection requests will appear here.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onAccept={() => { acceptRequest(notif.connectionId, notif.fromSlug); }}
                  onDecline={() => { declineRequest(notif.connectionId, notif.fromSlug); }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User menu ────────────────────────────────────────────────────────────────

function UserMenu({
  userName,
  userMrn,
  userInitials,
  userRole,
  userId,
  userMemberType,
  userSchoolId,
  onLogout,
  isImpersonating,
  adminName,
  impersonatedName,
  impersonatedInitials,
}: {
  userName: string;
  userMrn: string;
  userInitials: string;
  userRole?: string;
  userId?: string;
  userMemberType?: string;
  userSchoolId?: string;
  onLogout: () => void;
  isImpersonating?: boolean;
  adminName?: string;
  impersonatedName?: string;
  impersonatedInitials?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const displayName = isImpersonating && impersonatedName ? impersonatedName : userName;
  const displayInitials = isImpersonating && impersonatedInitials ? impersonatedInitials : userInitials;

  const menuItems = [
    { label: 'My Profile',      href: userId ? `/members/${userId}` : '#', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Profile Settings', href: '/profile/settings',  icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: 'Credits & Hours',  href: '/credits',            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ...(userMemberType === 'teacher' ? [{ label: 'Teaching Hours', href: '/teaching-hours', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }] : []),
    { label: 'Subscriptions',   href: '#',                   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Messages',        href: '#',                   icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
          open ? 'bg-slate-100' : 'hover:bg-slate-100'
        }`}
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isImpersonating ? 'bg-amber-500' : 'bg-[#4E87A0]'}`}>
          <span className="text-white text-[10px] font-black">{displayInitials}</span>
        </div>
        <span className="text-sm font-medium text-[#1B3A5C] hidden lg:block">{displayName}</span>
        <svg className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <Dropdown>
          {/* User header */}
          <div className="px-4 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isImpersonating ? 'bg-amber-500' : 'bg-[#4E87A0]'}`}>
              <span className="text-white text-xs font-black">{displayInitials}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1B3A5C]">{displayName}</p>
              {isImpersonating ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full mt-0.5">
                  Viewing as — admin: {adminName ?? 'Admin'}
                </span>
              ) : (
                userMrn && <p className="text-[11px] text-[#6B7280]">MRN: {userMrn}</p>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {menuItems.map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 text-[#6B7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Admin Settings — hidden when impersonating */}
          {!isImpersonating && (userRole === 'admin' || userRole === 'moderator') && (
            <div className="border-t border-[#E5E7EB] py-1.5">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 text-[#6B7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Settings
              </Link>
            </div>
          )}

          {/* School Settings / Register School (teacher role) — hidden when impersonating */}
          {!isImpersonating && userRole === 'teacher' && (
            <div className="border-t border-[#E5E7EB] py-1.5">
              {userSchoolId ? (
                <Link
                  href={`/schools/${userSchoolId}/settings`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#6B7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h6" />
                  </svg>
                  School Settings
                </Link>
              ) : (
                <Link
                  href="/schools/create"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#6B7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
                  </svg>
                  Register School
                </Link>
              )}
            </div>
          )}

          {/* Switch Back — only shown when impersonating */}
          {isImpersonating && (
            <div className="border-t border-[#E5E7EB] py-1.5">
              <form action={endImpersonation}>
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                  Switch Back to Admin
                </button>
              </form>
            </div>
          )}

          {/* Logout */}
          <div className="border-t border-[#E5E7EB] py-1.5">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </Dropdown>
      )}
    </div>
  );
}

// ─── Mobile cart link (used inside hamburger menu) ───────────────────────────

function MobileCartLink({ onClose }: { onClose: () => void }) {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      onClick={onClose}
      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 text-sm font-medium transition-colors"
    >
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Cart
      </span>
      {itemCount > 0 && (
        <span className="bg-[#8b1a1a] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  );
}

// ─── Cart widget (button + mini-cart dropdown) ────────────────────────────────

function CartWidget() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          open ? 'bg-[#4E87A0] text-white' : 'text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-100'
        }`}
        aria-label={`Cart (${itemCount} items)`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8b1a1a] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>
      {open && <MiniCart onClose={() => setOpen(false)} />}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const { isImpersonating, targetProfile, adminProfile } = useImpersonation();

  function checkMaintenance(role: string | undefined) {
    if (role !== 'admin' && role !== 'moderator') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('site_settings')
      .select('key, value')
      .in('key', ['maintenance_mode_enabled', 'maintenance_mode_scheduled', 'maintenance_start_utc', 'maintenance_end_utc'])
      .then(({ data }: { data: Array<{ key: string; value: string }> | null }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value ?? ''; });
        const enabled = map.maintenance_mode_enabled === 'true';
        const scheduled = map.maintenance_mode_scheduled === 'true';
        const now = Date.now();
        let active = enabled;
        if (!active && scheduled) {
          const start = map.maintenance_start_utc ? new Date(map.maintenance_start_utc).getTime() : 0;
          const end   = map.maintenance_end_utc   ? new Date(map.maintenance_end_utc).getTime()   : 0;
          active = start > 0 && end > 0 && now >= start && now <= end;
        }
        setMaintenanceActive(active);
      });
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single()
          .then(({ data: p }) => {
            setProfile(p);
            checkMaintenance(p?.role);
            if (p?.role === 'teacher') {
              (supabase as any).from('schools').select('id').eq('owner_id', data.user!.id).maybeSingle()
                .then(({ data: s }: { data: { id: string } | null }) => setSchoolId(s?.id ?? null));
            }
          });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data: p }) => {
            setProfile(p);
            checkMaintenance(p?.role);
            if (p?.role === 'teacher') {
              (supabase as any).from('schools').select('id').eq('owner_id', session.user!.id).maybeSingle()
                .then(({ data: s }: { data: { id: string } | null }) => setSchoolId(s?.id ?? null));
            } else {
              setSchoolId(null);
            }
          });
      } else {
        setProfile(null);
        setMaintenanceActive(false);
        setSchoolId(null);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoggedIn = !!user;
  const userName = profile?.full_name ?? user?.email?.split('@')[0] ?? '';
  const userMrn = profile?.mrn ?? '';
  const userInitials = getInitials(profile?.full_name, user?.email);
  const handleLogout = () => {
    supabase.auth.signOut().then(() => {
      setUser(null);
      setProfile(null);
      router.push('/');
    });
  };

  const impersonatedName = isImpersonating && targetProfile
    ? (targetProfile.full_name ?? targetProfile.email ?? 'User')
    : undefined;
  const impersonatedInitials = isImpersonating && targetProfile
    ? getInitials(targetProfile.full_name, targetProfile.email)
    : undefined;

  return (
    <header className={`fixed ${isImpersonating ? 'top-10' : 'top-0'} left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/GOYA Logo Blue.png" alt="GOYA" style={{ width: '120px', height: 'auto' }} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {isLoggedIn && (
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === '/dashboard'
                    ? 'text-[#1B3A5C] bg-slate-100'
                    : 'text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
            )}
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === href
                    ? 'text-[#1B3A5C] bg-slate-100'
                    : 'text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            {isLoggedIn ? (
              <>
                <SearchWidget />
                <MessagesWidget />
                <CartWidget />
                {(profile?.role === 'admin' || profile?.role === 'moderator') && maintenanceActive && (
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Maintenance
                  </Link>
                )}
                <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
                <UserMenu
                  userName={userName}
                  userMrn={userMrn}
                  userInitials={userInitials}
                  userRole={profile?.role}
                  userId={isImpersonating && targetProfile ? targetProfile.id : profile?.id}
                  userMemberType={isImpersonating && targetProfile ? (targetProfile.member_type ?? undefined) : profile?.member_type}
                  userSchoolId={schoolId ?? undefined}
                  onLogout={handleLogout}
                  isImpersonating={isImpersonating}
                  adminName={adminProfile?.full_name ?? 'Admin'}
                  impersonatedName={impersonatedName}
                  impersonatedInitials={impersonatedInitials}
                />
              </>
            ) : (
              <>
                <CartWidget />
                <Link href="/sign-in" className="text-[#374151] hover:text-[#1B3A5C] text-sm font-medium transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link href="/register" className="bg-[#4E87A0] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#3A7190] transition-colors">
                  Join GOYA
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-[#374151] hover:text-[#1B3A5C] p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E5E7EB] px-4 py-4 space-y-1">
          {/* Mobile cart link */}
          <MobileCartLink onClose={() => setMenuOpen(false)} />
          {isLoggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'text-[#1B3A5C] bg-slate-100'
                  : 'text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50'
              }`}
            >
              Dashboard
            </Link>
          )}
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
          {isLoggedIn ? (
            <div className="pt-3 mt-3 border-t border-[#E5E7EB] space-y-1">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isImpersonating ? 'bg-amber-500' : 'bg-[#4E87A0]'}`}>
                  <span className="text-white text-xs font-black">{impersonatedInitials ?? userInitials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1B3A5C]">{impersonatedName ?? userName}</p>
                  {isImpersonating ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full mt-0.5">
                      Viewing as — admin: {adminProfile?.full_name ?? 'Admin'}
                    </span>
                  ) : (
                    userMrn && <p className="text-[11px] text-[#6B7280]">MRN: {userMrn}</p>
                  )}
                </div>
              </div>
              {[
                { label: 'My Profile', href: (isImpersonating && targetProfile ? targetProfile.id : profile?.id) ? `/members/${isImpersonating && targetProfile ? targetProfile.id : profile?.id}` : '#' },
                { label: 'Profile Settings', href: '/profile/settings' },
                { label: 'Credits & Hours', href: '/credits' },
                ...((isImpersonating ? targetProfile?.member_type : profile?.member_type) === 'teacher' ? [{ label: 'Teaching Hours', href: '/teaching-hours' }] : []),
                { label: 'Subscriptions', href: '#' },
                { label: 'Messages', href: '#' },
              ].map(item => (
                <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 text-sm transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              {!isImpersonating && (profile?.role === 'admin' || profile?.role === 'moderator') && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 text-sm transition-colors"
                >
                  Admin Settings
                </Link>
              )}
              {!isImpersonating && profile?.role === 'teacher' && (
                schoolId ? (
                  <Link href={`/schools/${schoolId}/settings`} onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 rounded-lg text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 text-sm transition-colors"
                  >
                    School Settings
                  </Link>
                ) : (
                  <Link href="/schools/create" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 rounded-lg text-[#374151] hover:text-[#1B3A5C] hover:bg-slate-50 text-sm transition-colors"
                  >
                    Register School
                  </Link>
                )
              )}
              {isImpersonating && (
                <form action={endImpersonation}>
                  <button
                    type="submit"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-4 py-2 rounded-lg text-amber-700 hover:bg-amber-50 text-sm transition-colors"
                  >
                    ↩ Switch Back to Admin
                  </button>
                </form>
              )}
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg text-rose-500 hover:bg-rose-50 text-sm transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 mt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
              <Link href="/sign-in" className="block px-4 py-2.5 text-[#374151] hover:text-[#1B3A5C] text-sm font-medium">Sign In</Link>
              <Link href="/register" className="block bg-[#4E87A0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-[#3A7190] transition-colors">Join GOYA</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
