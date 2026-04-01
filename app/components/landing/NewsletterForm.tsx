'use client';

import { useState } from 'react';
import { subscribeNewsletter } from '@/app/actions/newsletter';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const result = await subscribeNewsletter(email);
    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Something went wrong.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-primary font-semibold text-lg">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        You&apos;re in! 🙏
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500 sm:absolute sm:bottom-0 sm:translate-y-full sm:pt-1">{errorMsg}</p>
      )}
    </form>
  );
}
