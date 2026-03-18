'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SavedOrder } from '@/app/context/CartContext';
import GOYABadge from '@/app/components/GOYABadge';

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('goya-last-order');
      if (saved) setOrder(JSON.parse(saved));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No order found.</p>
          <Link href="/" className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#162d4a] transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-16 px-4">
      <div className="w-full max-w-xl">

        {/* Success card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Hero */}
          <div className="bg-[#1e3a5f] px-8 pt-10 pb-8 text-center">
            {/* Checkmark */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400 mb-5">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* GOYA badge */}
            <div className="flex justify-center mb-5">
              <GOYABadge acronym="GOYA" lines={['GLOBAL ONLINE', 'YOGA ASSOC.']} size={120} />
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">Thank you for your order!</h1>
            <p className="text-slate-300 text-sm">
              Welcome, {order.customer.firstName}. Your designations are under review.
            </p>
          </div>

          {/* Order info */}
          <div className="px-8 py-6 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Order Number</p>
                <p className="text-lg font-bold text-[#1e3a5f] tracking-wide">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Date</p>
                <p className="text-sm font-medium text-slate-700">{orderDate}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Email</p>
              <p className="text-sm text-slate-700">{order.customer.email}</p>
            </div>
          </div>

          {/* Items */}
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Items Purchased</h2>
            <ul className="space-y-4">
              {order.items.map(item => (
                <li key={item.id} className="flex items-center gap-4">
                  <div className="shrink-0 bg-slate-50 rounded-xl p-2 border border-slate-100">
                    <GOYABadge acronym={item.acronym} lines={item.badgeLines} size={54} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1e3a5f]">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.priceType === 'free'     ? 'Free' :
                       item.priceType === 'donation'  ? `$${item.price.toFixed(2)}/year` :
                       item.priceType.includes('recurring') ? `$${item.price.toFixed(2)}/year` :
                       `$${item.price.toFixed(2)}`}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </p>
                    {item.signUpFee ? (
                      <p className="text-xs text-slate-400">+ ${item.signUpFee.toFixed(2)} sign-up fee</p>
                    ) : null}
                  </div>
                  <span className="text-sm font-bold text-slate-700 shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="px-8 py-5 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-700">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.signUpFees > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Sign-up fees</span>
                <span className="font-medium text-slate-700">${order.signUpFees.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-800">Total Charged</span>
              <span className="text-base font-bold text-[#1e3a5f]">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Status message */}
          <div className="px-8 py-6 bg-amber-50/50 border-b border-amber-100/60">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-amber-800 leading-relaxed">
                Your designations will be reviewed and added to your profile within{' '}
                <span className="font-semibold">2–3 business days</span>. A confirmation email has been sent to{' '}
                <span className="font-semibold">{order.customer.email}</span>.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="px-8 py-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="flex-1 text-center bg-[#1e3a5f] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#162d4a] transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/addons"
              className="flex-1 text-center border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-semibold hover:border-slate-300 hover:text-slate-800 transition-colors"
            >
              Browse More Add-Ons
            </Link>
          </div>
        </div>

        {/* Support note */}
        <p className="text-xs text-slate-400 text-center mt-6">
          Questions? Email us at{' '}
          <a href="mailto:support@goya.org" className="underline hover:text-slate-600">support@goya.org</a>
        </p>
      </div>
    </div>
  );
}
