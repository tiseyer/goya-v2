'use client';

import Link from 'next/link';
import { useCart, VARIABLE_QTY_IDS } from '@/app/context/CartContext';
import GOYABadge from '@/app/components/GOYABadge';

// ─── Quantity control ─────────────────────────────────────────────────────────

function QtyControl({ id, quantity }: { id: string; quantity: number }) {
  const { setQuantity, removeItem } = useCart();
  const isVariable = VARIABLE_QTY_IDS.includes(id);

  if (!isVariable) {
    return <span className="text-sm text-slate-700 font-medium">1</span>;
  }

  return (
    <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden w-24">
      <button
        onClick={() => quantity === 1 ? removeItem(id) : setQuantity(id, quantity - 1)}
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors text-lg font-medium"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="flex-1 text-center text-sm font-semibold text-slate-800">{quantity}</span>
      <button
        onClick={() => setQuantity(id, quantity + 1)}
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors text-lg font-medium"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

// ─── Price label for a cart item ──────────────────────────────────────────────

function PriceLabel({ price, priceType }: { price: number; priceType: string }) {
  if (price === 0) return <span className="text-slate-600">Free</span>;
  const suffix = priceType.includes('recurring') ? <span className="text-slate-400 text-xs">/yr</span> : null;
  return <span>${price.toFixed(2)}{suffix}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { items, removeItem, subtotal, totalSignUpFees } = useCart();
  const total = subtotal + totalSignUpFees;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header band */}
      <div className="bg-[#F7F8FA] pt-20 pb-8 px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-[#6B7280] mb-4">
            <Link href="/" className="hover:text-[#1B3A5C] transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-[#374151]">Cart</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C]">Your Cart</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 ? (
          /* Empty cart */
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <svg className="w-14 h-14 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 mb-6">Add designations and upgrades to your cart to get started.</p>
            <Link
              href="/addons"
              className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#162d4a] transition-colors"
            >
              Browse Add-Ons &amp; Upgrades
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* ── Items ── */}
            <div className="flex-1 min-w-0">

              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-4">Product</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-4">Price</th>
                      <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-4">Qty</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-4">Subtotal</th>
                      <th className="px-4 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Product */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="shrink-0 bg-slate-50 rounded-xl p-2 border border-slate-100">
                              <GOYABadge acronym={item.acronym} lines={item.badgeLines} size={60} />
                            </div>
                            <div>
                              <Link
                                href={`/addons/${item.id}`}
                                className="text-sm font-bold text-[#1e3a5f] hover:text-[#2d5a9e] transition-colors"
                              >
                                {item.name}
                              </Link>
                              {item.signUpFee ? (
                                <p className="text-xs text-slate-400 mt-0.5">+ ${item.signUpFee.toFixed(2)} one-time sign-up fee</p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-5 text-right">
                          <span className="text-sm font-semibold text-slate-700">
                            <PriceLabel price={item.price} priceType={item.priceType} />
                          </span>
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-5">
                          <div className="flex justify-center">
                            <QtyControl id={item.id} quantity={item.quantity} />
                          </div>
                        </td>

                        {/* Subtotal */}
                        <td className="px-4 py-5 text-right">
                          <span className="text-sm font-bold text-[#1e3a5f]">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </td>

                        {/* Remove */}
                        <td className="px-4 py-5">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50"
                            aria-label={`Remove ${item.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex gap-4 mb-3">
                      <div className="shrink-0 bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <GOYABadge acronym={item.acronym} lines={item.badgeLines} size={56} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/addons/${item.id}`} className="text-sm font-bold text-[#1e3a5f]">{item.name}</Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <PriceLabel price={item.price} priceType={item.priceType} />
                        </p>
                        {item.signUpFee ? <p className="text-xs text-slate-400">+ ${item.signUpFee.toFixed(2)} sign-up</p> : null}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors self-start p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <QtyControl id={item.id} quantity={item.quantity} />
                      <span className="text-sm font-bold text-[#1e3a5f]">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue shopping */}
              <div className="mt-4">
                <Link
                  href="/addons"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1e3a5f] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* ── Order Summary Sidebar ── */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
                <h2 className="text-base font-bold text-[#1e3a5f] mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-800">${subtotal.toFixed(2)}</span>
                  </div>

                  {/* Sign-up fees breakdown */}
                  {items.filter(i => i.signUpFee).map(item => (
                    <div key={item.id} className="flex items-start justify-between text-sm">
                      <span className="text-slate-400 text-xs leading-relaxed max-w-[180px]">
                        {item.name} sign-up fee
                      </span>
                      <span className="font-medium text-slate-700 shrink-0 ml-2">${item.signUpFee!.toFixed(2)}</span>
                    </div>
                  ))}

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Total</span>
                    <span className="text-lg font-bold text-[#1e3a5f]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {totalSignUpFees > 0 && (
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Sign-up fees are charged once at the time of first purchase.
                  </p>
                )}

                <Link
                  href="/checkout"
                  className="block w-full text-center bg-[#1e3a5f] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#162d4a] transition-colors shadow-sm"
                >
                  Proceed to Checkout
                </Link>

                <p className="text-xs text-slate-400 text-center mt-3">
                  Secure checkout · Payment powered by Stripe (coming soon)
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
