'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/members', label: 'Members' },
  { href: '#', label: 'Events' },
  { href: '#', label: 'Resources' },
  { href: '#', label: 'About' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a2744] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/GOYA Logo White.png"
              alt="GOYA"
              style={{ width: '120px', height: 'auto' }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'text-white bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-[#2dd4bf] text-[#1a2744] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#14b8a6] transition-colors"
            >
              Join GOYA
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
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
        <div className="md:hidden bg-[#1e2e56] border-t border-white/10 px-4 py-4 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/login"
              className="block px-4 py-2.5 text-slate-300 hover:text-white text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="block bg-[#2dd4bf] text-[#1a2744] px-4 py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-[#14b8a6] transition-colors"
            >
              Join GOYA
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
