'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/app/context/SearchContext';
import {
  MOCK_RESULTS,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  groupByCategory,
} from '@/app/components/search/types';
import type { SearchResult, SearchCategory } from '@/app/components/search/types';
import SearchFilterPills from '@/app/components/search/SearchFilterPills';
import SearchResultRow from '@/app/components/search/SearchResultRow';

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function IconSearch({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconX({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GlobalSearchOverlay() {
  const { isOpen, close } = useSearch();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<SearchCategory | 'all'>('all');
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount guard for createPortal (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-focus and reset state when overlay opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      setActiveCategory('all');
      setTimeout(() => {
        inputRef.current?.focus();
        mobileInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Escape key listener on document
  useEffect(() => {
    if (!isOpen) return;
    function handleDocKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleDocKeyDown);
    return () => document.removeEventListener('keydown', handleDocKeyDown);
  }, [isOpen, close]);

  // Filter results (shared logic)
  const filterResults = useCallback((q: string, cat: SearchCategory | 'all') => {
    const trimmed = q.trim().toLowerCase();
    if (trimmed.length < 2) {
      setResults([]);
      setSelectedIdx(0);
      return;
    }
    const filtered = MOCK_RESULTS.filter(
      (r) =>
        r.title.toLowerCase().includes(trimmed) &&
        (cat === 'all' || r.category === cat)
    );
    setResults(filtered);
    setSelectedIdx(0);
  }, []);

  // Debounced input handler
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      filterResults(val, activeCategory);
    }, 200);
  }

  // Category change: update immediately
  function handleCategoryChange(cat: SearchCategory | 'all') {
    setActiveCategory(cat);
    filterResults(query, cat);
  }

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const hit = results[selectedIdx];
      if (hit) {
        router.push(hit.href);
        close();
      }
    } else if (e.key === 'Escape') {
      close();
    }
  }

  // Clear query
  function clearQuery() {
    setQuery('');
    setResults([]);
    setSelectedIdx(0);
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  }

  // Build grouped results with flat index tracking
  const grouped = groupByCategory(results);

  // Render results area (shared between desktop + mobile)
  function renderResults() {
    if (query === '') {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <IconSearch size={40} className="text-slate-300" />
          <p className="text-sm font-medium text-slate-700">Search GOYA</p>
          <p className="text-xs text-slate-400">Find members, events, courses, and pages.</p>
        </div>
      );
    }
    if (query.trim().length < 2) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-400">Keep typing...</p>
        </div>
      );
    }
    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-1">
          <p className="text-sm font-medium text-slate-600">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-slate-400">Try a different search term.</p>
        </div>
      );
    }

    let flatIndex = 0;
    return (
      <div role="listbox" aria-label="Search results">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat}>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide px-4 pt-3 pb-1">
                {CATEGORY_LABELS[cat]}
              </p>
              {items.map((result) => {
                const idx = flatIndex++;
                return (
                  <SearchResultRow
                    key={result.id}
                    result={result}
                    isHighlighted={idx === selectedIdx}
                    isBestMatch={idx === 0}
                    onClick={() => {
                      router.push(result.href);
                      close();
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  if (!mounted) return null;

  const inputBar = (isMobile: boolean) => (
    <div className={`flex items-center gap-3 ${isMobile ? 'border-t border-slate-200 px-4 py-3' : 'px-4 py-3 border-b border-slate-100'}`}>
      <IconSearch
        size={20}
        className={query ? 'text-[#345c83]' : 'text-slate-400'}
      />
      <input
        ref={isMobile ? mobileInputRef : inputRef}
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Search members, events, courses, pages..."
        className="flex-1 outline-none text-base text-slate-900 placeholder:text-slate-400 bg-transparent"
        aria-label="Search GOYA"
        autoComplete="off"
      />
      {query.length > 0 && (
        <button
          onClick={clearQuery}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Clear search"
          tabIndex={-1}
        >
          <IconX size={16} />
        </button>
      )}
      {!isMobile && (
        <button
          onClick={close}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close search"
        >
          <IconX size={20} />
        </button>
      )}
    </div>
  );

  const overlay = (
    <>
      {isOpen && (
        <>
          {/* ── Desktop layout (hidden on mobile) ── */}
          <div className="hidden sm:block">
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />
            {/* Panel container */}
            <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] pointer-events-none">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Search"
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Input bar */}
                {inputBar(false)}

                {/* Filter pills */}
                <SearchFilterPills
                  activeCategory={activeCategory}
                  onSelect={handleCategoryChange}
                />

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {renderResults()}
                </div>

                {/* Keyboard hints */}
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-4 text-[10px] text-slate-400">
                  <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                  <span><kbd className="font-mono">↵</kbd> open</span>
                  <span><kbd className="font-mono">Esc</kbd> close</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile layout (hidden on desktop) ── */}
          <div className="sm:hidden">
            <div className="fixed inset-0 z-[10000] bg-white flex flex-col-reverse">
              {/* Close button */}
              <button
                onClick={close}
                className="absolute top-3 right-4 z-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close search"
              >
                <IconX size={20} />
              </button>

              {/* Input bar at visual bottom (last in DOM = first visual in flex-col-reverse) */}
              {inputBar(true)}

              {/* Above input: scrollable content */}
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Filter pills */}
                <SearchFilterPills
                  activeCategory={activeCategory}
                  onSelect={handleCategoryChange}
                />

                {/* Results */}
                <div>
                  {renderResults()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  return createPortal(overlay, document.body);
}
