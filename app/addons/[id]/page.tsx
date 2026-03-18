'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use } from 'react';
import { ADDONS, formatPrice, type Addon } from '@/lib/addons-data';
import GOYABadge from '@/app/components/GOYABadge';
import { useCart } from '@/app/context/CartContext';

// ─── File upload section ───────────────────────────────────────────────────────

function FileUploadSection() {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(f => {
      const ok = ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type);
      const small = f.size <= 5 * 1024 * 1024;
      return ok && small;
    });
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
  }

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  return (
    <div className="mt-8 border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-bold text-[#1e3a5f] mb-1">Upload Document(s)</h3>
      <p className="text-xs text-slate-500 mb-4">
        PDF, JPG, or PNG — max 5 MB per file. Accepted documents include certificates, transcripts, and training records.
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-slate-200 hover:border-[#1e3a5f]/40 rounded-lg p-6 text-center cursor-pointer transition-colors group"
      >
        <svg className="w-8 h-8 text-slate-300 group-hover:text-slate-400 mx-auto mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
          Click or drag &amp; drop to upload
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map(f => (
            <li key={f.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs text-slate-700 truncate">{f.name}</span>
                <span className="text-xs text-slate-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button
                onClick={() => removeFile(f.name)}
                className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                aria-label="Remove file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Price block ───────────────────────────────────────────────────────────────

function PriceBlock({ addon }: { addon: Addon }) {
  if (addon.priceType === 'free') {
    return <span className="text-2xl font-bold text-slate-700">Free</span>;
  }
  if (addon.priceType === 'donation') {
    return (
      <div>
        <span className="text-2xl font-bold text-[#1e3a5f]">from ${addon.price.toFixed(2)}</span>
        <span className="text-slate-500 text-base">/year</span>
      </div>
    );
  }
  if (addon.priceType === 'one-time') {
    return <span className="text-2xl font-bold text-[#1e3a5f]">${addon.price.toFixed(2)}</span>;
  }
  if (addon.priceType === 'recurring') {
    return (
      <div>
        <span className="text-2xl font-bold text-[#1e3a5f]">${addon.price.toFixed(2)}</span>
        <span className="text-slate-500 text-base">/year</span>
      </div>
    );
  }
  // recurring-with-signup
  return (
    <div className="flex flex-col gap-0.5">
      <div>
        <span className="text-2xl font-bold text-[#1e3a5f]">${addon.price.toFixed(2)}</span>
        <span className="text-slate-500 text-base">/year</span>
      </div>
      <span className="text-sm text-slate-500">+ ${addon.signupFee!.toFixed(2)} one-time sign-up fee</span>
    </div>
  );
}

// ─── Product detail ────────────────────────────────────────────────────────────

export default function AddonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const found = ADDONS.find(a => a.id === id);
  if (!found) notFound();
  const addon = found as Addon;

  const { addItem, removeItem, items } = useCart();
  const inCart = items.some(i => i.id === addon.id);

  function handleCart() {
    if (inCart) {
      removeItem(addon.id);
    } else {
      addItem({ id: addon.id, name: addon.name, acronym: addon.acronym, badgeLines: addon.badgeLines, price: addon.price, priceType: addon.priceType, signUpFee: addon.signupFee });
    }
  }

  // Build heading: e.g. "GOYA WELLNESS PRACTITIONER ADD-ON"
  const headingLabel = `GOYA ${addon.fullName.toUpperCase()} ADD-ON`;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb bar */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#1e3a5f] transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/addons" className="hover:text-[#1e3a5f] transition-colors">All Add-Ons &amp; Upgrades</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-800 font-medium">{addon.name}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16">

          {/* Left: Badge */}
          <div className="flex flex-col items-center gap-4 md:w-72 shrink-0">
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 flex items-center justify-center w-full">
              <GOYABadge acronym={addon.acronym} lines={addon.badgeLines} size={240} />
            </div>
            <p className="text-xs text-slate-400 text-center max-w-[200px] leading-relaxed">
              This badge will appear on your public GOYA member profile upon verification approval.
            </p>
          </div>

          {/* Right: Details */}
          <div className="flex-1 min-w-0">
            {/* Colored designation heading */}
            <p className="text-xs font-bold tracking-widest text-[#8b1a1a] uppercase mb-2">
              {headingLabel}
            </p>

            {/* Product name */}
            <h1 className="text-3xl font-bold text-[#1e3a5f] mb-4">{addon.name}</h1>

            {/* Price */}
            <div className="mb-6">
              <PriceBlock addon={addon} />
            </div>

            <hr className="border-slate-100 mb-6" />

            {/* Bullet points */}
            <ul className="space-y-3 mb-6">
              {addon.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <svg className="w-4 h-4 text-[#1e3a5f] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-700 leading-relaxed">
                    <span className="font-semibold text-[#8b1a1a]">{bullet.label}</span>{' '}
                    {bullet.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Description */}
            <div className="space-y-3 mb-8">
              {addon.description.map((para, i) => (
                <p key={i} className="text-sm text-slate-600 leading-relaxed">{para}</p>
              ))}
            </div>

            {/* File upload */}
            <FileUploadSection />

            {/* Add to cart */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <button
                onClick={handleCart}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  inCart
                    ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200'
                    : 'bg-[#1e3a5f] text-white hover:bg-[#162d4a] shadow-sm hover:shadow-md'
                }`}
              >
                {inCart ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Added to Cart
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>

              <Link
                href="/addons"
                className="text-sm text-slate-500 hover:text-[#1e3a5f] transition-colors"
              >
                ← Back to all add-ons
              </Link>
            </div>

            {/* Note about Stripe */}
            <p className="mt-4 text-xs text-slate-400">
              Secure checkout powered by Stripe. Payment processing coming soon.
            </p>
          </div>
        </div>
      </div>

      {/* Related / upsell row */}
      <div className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-base font-bold text-[#1e3a5f] mb-6">More Add-Ons &amp; Upgrades</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ADDONS.filter(a => a.id !== addon.id).slice(0, 4).map(related => (
              <Link
                key={related.id}
                href={`/addons/${related.id}`}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-[#1e3a5f]/20 transition-all group"
              >
                <GOYABadge acronym={related.acronym} lines={related.badgeLines} size={90} />
                <p className="text-xs font-bold text-[#1e3a5f] text-center group-hover:text-[#2d5a9e] transition-colors">{related.name}</p>
                <p className="text-xs text-slate-500">{formatPrice(related)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
