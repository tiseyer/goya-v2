'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/app/context/CartContext';
import MiniCart from './MiniCart';

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
    <div className="absolute right-0 top-full mt-2 z-50 min-w-[220px] bg-[#1e2e56] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
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
          className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/40 mr-2"
        />
      </div>

      {/* Icon button */}
      <button
        onClick={toggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          open ? 'bg-[#2dd4bf] text-[#1a2744]' : 'text-slate-300 hover:text-white hover:bg-white/10'
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
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Search</p>
          </div>
          <div className="px-4 py-6 text-center">
            {query.trim() === '' ? (
              <p className="text-sm text-slate-500">Start typing to search…</p>
            ) : (
              <>
                <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm text-slate-400 font-medium">No results yet</p>
                <p className="text-xs text-slate-600 mt-1">Search is coming soon.</p>
              </>
            )}
          </div>
        </Dropdown>
      )}
    </div>
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function MessagesWidget() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          open ? 'bg-[#2dd4bf] text-[#1a2744]' : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
        aria-label="Messages"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {open && (
        <Dropdown>
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Messages</p>
            <span className="text-[10px] bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">0</span>
          </div>
          <div className="px-4 py-8 text-center">
            <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0l-8 5-8-5" />
            </svg>
            <p className="text-sm text-slate-400 font-medium">No messages yet</p>
            <p className="text-xs text-slate-600 mt-1">Your inbox is empty.</p>
          </div>
        </Dropdown>
      )}
    </div>
  );
}

// ─── User menu ────────────────────────────────────────────────────────────────

function UserMenu({ userName, userMrn, userInitials, userRole, onLogout }: { userName: string; userMrn: string; userInitials: string; userRole?: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const menuItems = [
    { label: 'My Profile',      href: '/profile',            icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Profile Settings', href: '/profile/settings',  icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: 'Subscriptions',   href: '#',                   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Messages',        href: '#',                   icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
          open ? 'bg-white/10' : 'hover:bg-white/10'
        }`}
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-[#2dd4bf] flex items-center justify-center shrink-0">
          <span className="text-[#1a2744] text-[10px] font-black">{userInitials}</span>
        </div>
        <span className="text-sm font-medium text-slate-200 hidden lg:block">{userName}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <Dropdown>
          {/* User header */}
          <div className="px-4 py-4 border-b border-white/8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2dd4bf] flex items-center justify-center shrink-0">
              <span className="text-[#1a2744] text-xs font-black">{userInitials}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{userName}</p>
              {userMrn && <p className="text-[11px] text-slate-400">MRN: {userMrn}</p>}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {menuItems.map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Admin Settings */}
          {(userRole === 'admin' || userRole === 'moderator') && (
            <div className="border-t border-white/8 py-1.5">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Settings
              </Link>
            </div>
          )}

          {/* Logout */}
          <div className="border-t border-white/8 py-1.5">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/8 transition-colors"
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
      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
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
          open ? 'bg-[#2dd4bf] text-[#1a2744]' : 'text-slate-300 hover:text-white hover:bg-white/10'
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single()
          .then(({ data: p }) => setProfile(p));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data: p }) => setProfile(p));
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a2744] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/GOYA Logo White.png" alt="GOYA" style={{ width: '120px', height: 'auto' }} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === href
                    ? 'text-white bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
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
                <div className="w-px h-5 bg-white/15 mx-1" />
                <UserMenu userName={userName} userMrn={userMrn} userInitials={userInitials} userRole={profile?.role} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <CartWidget />
                <Link href="/sign-in" className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link href="/register" className="bg-[#2dd4bf] text-[#1a2744] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#14b8a6] transition-colors">
                  Join GOYA
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
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
        <div className="lg:hidden bg-[#1e2e56] border-t border-white/10 px-4 py-4 space-y-1">
          {/* Mobile cart link */}
          <MobileCartLink onClose={() => setMenuOpen(false)} />
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
          {isLoggedIn ? (
            <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-[#2dd4bf] flex items-center justify-center">
                  <span className="text-[#1a2744] text-xs font-black">{userInitials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{userName}</p>
                  {userMrn && <p className="text-[11px] text-slate-400">MRN: {userMrn}</p>}
                </div>
              </div>
              {[
                { label: 'My Profile', href: '/profile' },
                { label: 'Profile Settings', href: '/profile/settings' },
                { label: 'Subscriptions', href: '#' },
                { label: 'Messages', href: '#' },
              ].map(item => (
                <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm transition-colors"
                >
                  Admin Settings
                </Link>
              )}
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 text-sm transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 mt-3 border-t border-white/10 flex flex-col gap-2">
              <Link href="/sign-in" className="block px-4 py-2.5 text-slate-300 hover:text-white text-sm font-medium">Sign In</Link>
              <Link href="/register" className="block bg-[#2dd4bf] text-[#1a2744] px-4 py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-[#14b8a6] transition-colors">Join GOYA</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
