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

export default function NotFound() {
  const [headline, setHeadline] = useState('');

  useEffect(() => {
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-primary-50">
      <div className="text-center max-w-lg">
        {/* 404 with lotus */}
        <div className="relative inline-block mb-8">
          <span className="text-[10rem] sm:text-[12rem] font-bold leading-none tracking-tighter text-primary-200 select-none">
            4
            {/* Lotus flower in place of the 0 */}
            <span className="relative inline-block w-[0.65em]">
              <svg
                viewBox="0 0 120 120"
                className="w-full h-full absolute inset-0"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Center petal */}
                <ellipse cx="60" cy="50" rx="14" ry="30" className="fill-primary-light opacity-60" />
                {/* Left petal */}
                <ellipse cx="60" cy="50" rx="14" ry="30" transform="rotate(-30 60 60)" className="fill-primary opacity-40" />
                {/* Right petal */}
                <ellipse cx="60" cy="50" rx="14" ry="30" transform="rotate(30 60 60)" className="fill-primary opacity-40" />
                {/* Far left petal */}
                <ellipse cx="60" cy="50" rx="12" ry="26" transform="rotate(-55 60 60)" className="fill-primary-light opacity-30" />
                {/* Far right petal */}
                <ellipse cx="60" cy="50" rx="12" ry="26" transform="rotate(55 60 60)" className="fill-primary-light opacity-30" />
                {/* Center dot */}
                <circle cx="60" cy="56" r="6" className="fill-primary opacity-70" />
              </svg>
            </span>
            4
          </span>
        </div>

        {/* Headline */}
        <p className="text-lg sm:text-xl text-primary-dark font-medium leading-relaxed mb-3 min-h-[3.5rem]">
          {headline}
        </p>

        {/* Subtitle */}
        <p className="text-sm text-slate-500 mb-10">
          Let&apos;s guide you back to your practice.
        </p>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-soft hover:bg-primary-dark transition-colors duration-200"
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
