'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ADDONS, formatPrice, PAGE_SIZE, type Addon } from '@/lib/addons-data';
import GOYABadge from '@/app/components/GOYABadge';
import { useCart } from '@/app/context/CartContext';

// ─── Price display ────────────────────────────────────────────────────────────

function PriceDisplay({ addon }: { addon: Addon }) {
  if (addon.priceType === 'free') {
    return <span className="text-slate-600 font-semibold text-sm">Free</span>;
  }
  if (addon.priceType === 'donation') {
    return (
      <span className="text-slate-800 font-semibold text-sm">
        from <span className="text-[#1e3a5f]">${addon.price.toFixed(2)}</span>/year
      </span>
    );
  }
  if (addon.priceType === 'one-time') {
    return (
      <span className="text-slate-800 font-semibold text-sm">
        ${addon.price.toFixed(2)}
      </span>
    );
  }
  if (addon.priceType === 'recurring') {
    return (
      <span className="text-slate-800 font-semibold text-sm">
        ${addon.price.toFixed(2)}<span className="text-slate-500 font-normal">/year</span>
      </span>
    );
  }
  // recurring-with-signup
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-slate-800 font-semibold text-sm">
        ${addon.price.toFixed(2)}<span className="text-slate-500 font-normal">/year</span>
      </span>
      <span className="text-slate-500 text-xs">+ ${addon.signupFee!.toFixed(2)} sign-up fee</span>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function AddonCard({ addon }: { addon: Addon }) {
  const { addItem, items } = useCart();
  const inCart = items.some(i => i.id === addon.id);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({ id: addon.id, name: addon.name, acronym: addon.acronym, badgeLines: addon.badgeLines, price: addon.price, priceType: addon.priceType, signUpFee: addon.signupFee });
  }

  return (
    <Link
      href={`/addons/${addon.id}`}
      className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Badge area */}
      <div className="flex items-center justify-center pt-7 pb-4 px-4 bg-white">
        <GOYABadge acronym={addon.acronym} lines={addon.badgeLines} size={130} />
      </div>

      {/* Content */}
      <div className="px-4 pb-5 flex flex-col flex-1 gap-2">
        <h3 className="text-sm font-bold text-[#1e3a5f] leading-snug group-hover:text-[#2d5a9e] transition-colors text-center">
          {addon.name}
        </h3>
        <p className="text-xs text-slate-500 text-center leading-relaxed line-clamp-2 flex-1">
          {addon.fullName}
        </p>

        {/* Price */}
        <div className="text-center mt-1">
          <PriceDisplay addon={addon} />
        </div>

        {/* CTA */}
        <div className="mt-2 text-center" onClick={e => e.preventDefault()}>
          {addon.cta === 'SELECT_OPTIONS' ? (
            <Link
              href={`/addons/${addon.id}`}
              className="text-xs font-semibold text-[#1e3a5f] underline underline-offset-2 hover:text-[#2d5a9e] transition-colors"
            >
              Select Options
            </Link>
          ) : inCart ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              In Cart
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              className="text-xs font-semibold text-slate-600 hover:text-[#1e3a5f] border border-slate-300 hover:border-[#1e3a5f] rounded-lg px-3 py-1.5 transition-colors"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AddonsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('default');

  const page1 = ADDONS.filter(a => a.page === 1);
  const page2 = ADDONS.filter(a => a.page === 2);
  const visibleAddons = currentPage === 1 ? page1 : page2;

  const sorted = [...visibleAddons].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const startIndex = currentPage === 1 ? 1 : PAGE_SIZE + 1;
  const endIndex   = currentPage === 1 ? page1.length : ADDONS.length;

  return (
    <div className="min-h-screen bg-white">

      {/* Page header */}
      <div className="bg-[#1e3a5f] pt-12 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-300">All Add-Ons &amp; Upgrades</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">All Add-Ons &amp; Upgrades</h1>
          <p className="mt-2 text-slate-300 text-sm max-w-2xl">
            Enhance your GOYA profile with verified designation badges, continuing education credits, and more.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{startIndex}–{endIndex}</span> of{' '}
            <span className="font-semibold text-slate-800">{ADDONS.length}</span> results
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-xs text-slate-500 whitespace-nowrap">Sort by:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
            >
              <option value="default">Default Sorting</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {sorted.map(addon => (
            <AddonCard key={addon.id} addon={addon} />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
              currentPage === 1
                ? 'bg-[#1e3a5f] text-white'
                : 'border border-slate-200 text-slate-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
            }`}
          >
            1
          </button>
          <button
            onClick={() => setCurrentPage(2)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
              currentPage === 2
                ? 'bg-[#1e3a5f] text-white'
                : 'border border-slate-200 text-slate-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
            }`}
          >
            2
          </button>

          {currentPage < 2 && (
            <button
              onClick={() => setCurrentPage(p => Math.min(2, p + 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors ml-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
