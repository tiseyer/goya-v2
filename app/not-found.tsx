'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const HEADLINES = [
  'This page has reached Nirvana — it no longer exists in this realm.',
  'Oops. Even the most enlightened yogi takes a wrong path sometimes.',
  'This page went on a silent retreat and forgot to come back.',
  '404: The page you seek is on a deeper spiritual journey.',
  'Your search has led you to the void. Breathe. Try again.',
  'This URL has transcended. It is one with the universe now.',
  'We looked everywhere. Even in Savasana. Still nothing.',
  'The page is not lost — it has simply let go of its attachment to existing.',
  'Wrong turn on the path to enlightenment. It happens to the best of us.',
  'This page is in deep meditation. Please do not disturb.',
  'Namaste. But this page? It\u2019s gone-aste.',
  'Your chakras are aligned, but this URL is not.',
];

function LotusIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer petals */}
      <ellipse cx="100" cy="90" rx="18" ry="52" transform="rotate(-50 100 90)" className="fill-primary-200 opacity-50" />
      <ellipse cx="100" cy="90" rx="18" ry="52" transform="rotate(50 100 90)" className="fill-primary-200 opacity-50" />
      <ellipse cx="100" cy="90" rx="16" ry="48" transform="rotate(-30 100 90)" className="fill-primary-100 opacity-70" />
      <ellipse cx="100" cy="90" rx="16" ry="48" transform="rotate(30 100 90)" className="fill-primary-100 opacity-70" />
      {/* Center petals */}
      <ellipse cx="100" cy="80" rx="14" ry="40" transform="rotate(-15 100 90)" className="fill-primary-light opacity-50" />
      <ellipse cx="100" cy="80" rx="14" ry="40" transform="rotate(15 100 90)" className="fill-primary-light opacity-50" />
      <ellipse cx="100" cy="78" rx="12" ry="36" className="fill-primary opacity-30" />
      {/* Center circle */}
      <circle cx="100" cy="82" r="8" className="fill-primary opacity-50" />
      <circle cx="100" cy="82" r="4" className="fill-primary-dark opacity-40" />
      {/* Base / water line */}
      <path d="M40 120 Q70 108 100 112 Q130 108 160 120" stroke="currentColor" strokeWidth="1.5" className="text-primary-200" fill="none" />
      <path d="M30 128 Q65 114 100 118 Q135 114 170 128" stroke="currentColor" strokeWidth="1" className="text-primary-100" fill="none" opacity="0.6" />
    </svg>
  );
}

export default function NotFound() {
  const [headline, setHeadline] = useState('');

  useEffect(() => {
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-b from-primary-50 via-white to-primary-50/30">
      <div className="text-center max-w-xl">
        {/* Lotus illustration */}
        <div className="flex justify-center mb-2">
          <LotusIllustration className="w-36 h-auto sm:w-44 opacity-80" />
        </div>

        {/* 404 number */}
        <h1 className="text-8xl sm:text-9xl font-bold tracking-tighter text-primary-200 select-none leading-none mb-6">
          404
        </h1>

        {/* Headline */}
        <p className="text-lg sm:text-xl text-primary-dark font-medium leading-relaxed mb-3 min-h-[3.5rem] italic">
          &ldquo;{headline}&rdquo;
        </p>

        {/* Subtitle */}
        <p className="text-sm text-primary-light/80 mb-10">
          Let&apos;s guide you back to your practice.
        </p>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-card hover:bg-primary-dark hover:shadow-elevated transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
