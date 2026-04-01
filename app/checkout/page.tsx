'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, type CartItem, type SavedOrder } from '@/app/context/CartContext';
import { ADDONS } from '@/lib/addons-data';
import GOYABadge from '@/app/components/GOYABadge';

// ─── Countries ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China',
  'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Finland',
  'France', 'Germany', 'Greece', 'Hong Kong', 'Hungary', 'India', 'Indonesia',
  'Ireland', 'Israel', 'Italy', 'Japan', 'Malaysia', 'Mexico', 'Netherlands',
  'New Zealand', 'Norway', 'Philippines', 'Poland', 'Portugal', 'Romania',
  'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden',
  'Switzerland', 'Taiwan', 'Thailand', 'Turkey', 'UAE', 'Ukraine',
  'United Kingdom', 'United States', 'Vietnam',
];

// ─── Per-item file upload ─────────────────────────────────────────────────────

function ItemUpload({ item }: { item: CartItem }) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fl: FileList | null) {
    if (!fl) return;
    const valid = Array.from(fl).filter(f =>
      ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  }

  return (
    <div className="mt-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border border-dashed border-slate-200 hover:border-[#1e3a5f]/40 rounded-lg px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors group"
      >
        <svg className="w-5 h-5 text-slate-300 group-hover:text-slate-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div>
          <p className="text-xs font-medium text-slate-500 group-hover:text-slate-600 transition-colors">
            {files.length === 0 ? 'Upload document' : `${files.length} file${files.length > 1 ? 's' : ''} selected`}
          </p>
          <p className="text-[10px] text-slate-400">PDF, JPG, PNG — max 5 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-1 space-y-1">
          {files.map(f => (
            <li key={f.name} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded px-2 py-1">
              <span className="truncate">{f.name}</span>
              <button onClick={() => setFiles(p => p.filter(x => x.name !== f.name))} className="ml-2 text-slate-400 hover:text-rose-500 shrink-0">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Checkout form ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, subtotal, totalSignUpFees, clearCart } = useCart();
  const router = useRouter();
  const total = subtotal + totalSignUpFees;

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', country: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => { const n = { ...p }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.email.trim())     e.email     = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email address';
    return e;
  }

  function generateOrderNumber() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return `GOYA-${new Date().getFullYear()}-${code}`;
  }

  async function handlePlaceOrder() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);

    const order: SavedOrder = {
      orderNumber: generateOrderNumber(),
      date: new Date().toISOString(),
      items: [...items],
      subtotal,
      signUpFees: totalSignUpFees,
      total,
      customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, country: form.country },
    };

    localStorage.setItem('goya-last-order', JSON.stringify(order));

    // Track purchase conversion + checkout initiated
    try {
      const { trackPurchase, trackCheckoutInitiated } = await import('@/lib/analytics/tracking');
      trackCheckoutInitiated();
      trackPurchase({
        value: total,
        currency: 'EUR',
        items: items.map(i => ({ item_name: i.name, item_category: 'addon' })),
      });
    } catch { /* analytics non-critical */ }

    await new Promise(r => setTimeout(r, 1500));

    clearCart();
    router.push('/order-confirmation');
  }

  // Items requiring document upload (all except donation type)
  const uploadItems = items.filter(i => {
    const addon = ADDONS.find(a => a.id === i.id);
    return addon && addon.priceType !== 'donation';
  });

  const inputCls = (field: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
      errors[field]
        ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400 bg-rose-50'
        : 'border-slate-200 focus:ring-[#1e3a5f]/15 focus:border-[#1e3a5f] bg-white'
    }`;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Your cart is empty.</p>
          <Link href="/addons" className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#162d4a] transition-colors">
            Browse Add-Ons
          </Link>
        </div>
      </div>
    );
  }

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
            <Link href="/cart" className="hover:text-[#1B3A5C] transition-colors">Cart</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-[#374151]">Checkout</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C]">Checkout</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── Left: Form ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Contact details */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1e3a5f] mb-5">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name <span className="text-rose-500">*</span></label>
                  <input type="text" placeholder="Jane" value={form.firstName} onChange={e => update('firstName', e.target.value)} className={inputCls('firstName')} />
                  {errors.firstName && <p className="text-xs text-rose-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name <span className="text-rose-500">*</span></label>
                  <input type="text" placeholder="Smith" value={form.lastName} onChange={e => update('lastName', e.target.value)} className={inputCls('lastName')} />
                  {errors.lastName && <p className="text-xs text-rose-500 mt-1">{errors.lastName}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                  <input type="email" placeholder="jane@example.com" value={form.email} onChange={e => update('email', e.target.value)} className={inputCls('email')} />
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country</label>
                  <select
                    value={form.country}
                    onChange={e => update('country', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15 focus:border-[#1e3a5f] transition-colors appearance-none"
                  >
                    <option value="">Select country…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Order Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                  <textarea
                    placeholder="Any additional information or notes for your order…"
                    value={form.notes}
                    onChange={e => update('notes', e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15 focus:border-[#1e3a5f] transition-colors resize-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Document uploads */}
            {uploadItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-[#1e3a5f] mb-1">Certification Documents</h2>
                <p className="text-xs text-slate-500 mb-5">
                  Upload your training certificates or credentials for each designation below. All documents are reviewed by the GOYA team within 2–3 business days.
                </p>
                <div className="space-y-5">
                  {uploadItems.map(item => (
                    <div key={item.id}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
                          <GOYABadge acronym={item.acronym} lines={item.badgeLines} size={40} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1e3a5f]">{item.name}</p>
                          <p className="text-[11px] text-[#8b1a1a] font-medium">Required for certification</p>
                        </div>
                      </div>
                      <ItemUpload item={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order summary ── */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
              <h2 className="text-base font-bold text-[#1e3a5f] mb-4">Order Summary</h2>

              {/* Items */}
              <ul className="space-y-3 mb-4 divide-y divide-slate-50">
                {items.map(item => (
                  <li key={item.id} className="flex items-start gap-3 pt-3 first:pt-0">
                    <div className="bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0">
                      <GOYABadge acronym={item.acronym} lines={item.badgeLines} size={38} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1e3a5f] leading-snug">{item.name}</p>
                      {item.quantity > 1 && <p className="text-xs text-slate-400">× {item.quantity}</p>}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="border-t border-slate-100 pt-3 space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-700">${subtotal.toFixed(2)}</span>
                </div>
                {items.filter(i => i.signUpFee).map(item => (
                  <div key={item.id} className="flex items-start justify-between text-xs">
                    <span className="text-slate-400 max-w-[160px] leading-relaxed">{item.name} sign-up fee</span>
                    <span className="font-medium text-slate-600 ml-2 shrink-0">${item.signUpFee!.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800">Total</span>
                  <span className="text-lg font-bold text-[#1e3a5f]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place order button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-[#1e3a5f] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#162d4a] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  'Place Order'
                )}
              </button>

              <p className="text-xs text-slate-400 text-center mt-3 leading-relaxed">
                By placing your order you agree to GOYA's{' '}
                <Link href="/terms" className="underline hover:text-slate-600">Terms of Use</Link>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
