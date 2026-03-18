'use client';

import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
import GOYABadge from './GOYABadge';

interface MiniCartProps {
  onClose: () => void;
}

export default function MiniCart({ onClose }: MiniCartProps) {
  const { items, removeItem, subtotal, totalSignUpFees } = useCart();
  const total = subtotal + totalSignUpFees;

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-[320px] bg-[#1e2e56] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Cart {items.length > 0 && <span className="text-slate-500">({items.length} {items.length === 1 ? 'item' : 'items'})</span>}
        </p>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors p-0.5 rounded"
          aria-label="Close cart"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="px-4 py-10 text-center">
          <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm font-medium text-slate-400 mb-1">Your cart is empty</p>
          <p className="text-xs text-slate-600 mb-4">Add designations and upgrades to get started.</p>
          <Link
            href="/addons"
            onClick={onClose}
            className="inline-block text-xs font-semibold text-[#2dd4bf] hover:underline"
          >
            Browse Add-Ons →
          </Link>
        </div>
      ) : (
        <>
          {/* Item list */}
          <ul className="max-h-64 overflow-y-auto divide-y divide-white/5">
            {items.map(item => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                {/* Badge thumbnail */}
                <div className="shrink-0 bg-white/5 rounded-lg p-1 border border-white/5">
                  <GOYABadge acronym={item.acronym} lines={item.badgeLines} size={46} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white leading-snug truncate">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ${item.price.toFixed(2)}
                    {item.priceType.includes('recurring') ? <span className="text-slate-500">/yr</span> : ''}
                    {item.quantity > 1 && <span className="text-slate-500"> × {item.quantity}</span>}
                  </p>
                  {item.signUpFee ? (
                    <p className="text-[10px] text-slate-500">+ ${item.signUpFee.toFixed(2)} sign-up</p>
                  ) : null}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-slate-600 hover:text-rose-400 transition-colors p-1 rounded hover:bg-rose-500/10"
                  aria-label={`Remove ${item.name}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-white/8 bg-black/10">
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-200 font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {totalSignUpFees > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sign-up fees</span>
                  <span className="text-slate-200 font-medium">${totalSignUpFees.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-white/8">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-sm font-bold text-white">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 text-center py-2.5 rounded-lg border border-white/15 text-xs font-semibold text-slate-300 hover:text-white hover:border-white/30 transition-colors"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 text-center py-2.5 rounded-lg bg-[#1e3a5f] text-xs font-semibold text-white hover:bg-[#2a4f7f] transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
