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
    <div className="absolute right-0 top-full mt-2 z-50 w-[320px] bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">
          Cart {items.length > 0 && <span className="text-slate-400">({items.length} {items.length === 1 ? 'item' : 'items'})</span>}
        </p>
        <button
          onClick={onClose}
          className="text-[#6B7280] hover:text-[#1B3A5C] transition-colors p-0.5 rounded"
          aria-label="Close cart"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="px-4 py-8 text-center">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm font-medium text-[#374151] mb-1">Your cart is empty</p>
          <p className="text-xs text-[#6B7280] mb-5">Add designations and upgrades to get started.</p>
          <div className="flex flex-col gap-2 px-2">
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full text-center py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:text-[#1B3A5C] hover:border-slate-300 transition-colors"
            >
              View Cart
            </Link>
            <Link
              href="/addons"
              onClick={onClose}
              className="block w-full text-center py-2.5 rounded-lg bg-[#1B3A5C] text-xs font-semibold text-white hover:bg-[#162d4a] transition-colors"
            >
              Browse Add-Ons
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Item list */}
          <ul className="max-h-64 overflow-y-auto divide-y divide-[#E5E7EB]">
            {items.map(item => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                {/* Badge thumbnail */}
                <div className="shrink-0 bg-slate-50 rounded-lg p-1 border border-[#E5E7EB]">
                  <GOYABadge acronym={item.acronym} lines={item.badgeLines} size={46} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1B3A5C] leading-snug truncate">{item.name}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    ${item.price.toFixed(2)}
                    {item.priceType.includes('recurring') ? <span className="text-slate-400">/yr</span> : ''}
                    {item.quantity > 1 && <span className="text-slate-400"> × {item.quantity}</span>}
                  </p>
                  {item.signUpFee ? (
                    <p className="text-[10px] text-slate-400">+ ${item.signUpFee.toFixed(2)} sign-up</p>
                  ) : null}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50"
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
          <div className="px-4 py-4 border-t border-[#E5E7EB] bg-slate-50">
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">Subtotal</span>
                <span className="text-[#374151] font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {totalSignUpFees > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Sign-up fees</span>
                  <span className="text-[#374151] font-medium">${totalSignUpFees.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E7EB]">
                <span className="text-sm font-semibold text-[#1B3A5C]">Total</span>
                <span className="text-sm font-bold text-[#1B3A5C]">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 text-center py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:text-[#1B3A5C] hover:border-slate-300 transition-colors"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 text-center py-2.5 rounded-lg bg-[#1B3A5C] text-xs font-semibold text-white hover:bg-[#162d4a] transition-colors"
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
