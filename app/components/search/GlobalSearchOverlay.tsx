'use client';
// GlobalSearchOverlay v2.1 — 9 useState hooks, no showMattea state
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/app/context/SearchContext';
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  groupByCategory,
} from '@/app/components/search/types';
import type { SearchResult, SearchCategory } from '@/app/components/search/types';
import SearchFilterPills from '@/app/components/search/SearchFilterPills';
import SearchResultRow from '@/app/components/search/SearchResultRow';
import MatteaSearchHint from '@/app/components/search/MatteaSearchHint';

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
  const { isOpen, open, close } = useSearch();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<SearchCategory | 'all'>('all');
  const [mounted, setMounted] = useState(false);
  const [cache, setCache] = useState<Record<string, SearchResult[]>>({});

  // Mattea AI hint state
  const [matteaAnswer, setMatteaAnswer] = useState<string | null>(null);
  const [matteaLoading, setMatteaLoading] = useState(false);

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
      setLoading(false);
      setMatteaAnswer(null);
      setMatteaLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
        mobileInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global keyboard shortcuts: Cmd+K / Ctrl+K to open, Escape to close
  useEffect(() => {
    function handleDocKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) { close(); } else { open(); }
        return;
      }
      if (e.key === 'Escape' && isOpen) close();
    }
    document.addEventListener('keydown', handleDocKeyDown);
    return () => document.removeEventListener('keydown', handleDocKeyDown);
  }, [isOpen, close, open]);

  // Fetch results from API
  const fetchResults = useCallback(async (q: string, cat: SearchCategory | 'all') => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSelectedIdx(0);
      setLoading(false);
      return;
    }

    const cacheKey = `${trimmed}:${cat}`;
    if (cache[cacheKey]) {
      setResults(cache[cacheKey]);
      setSelectedIdx(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const catParam = cat === 'all' ? 'members,events,courses,products,pages,help' : cat;
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&categories=${catParam}`);
      if (!res.ok) {
        setResults([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const allResults: SearchResult[] = [];
      for (const key of Object.keys(data.results)) {
        allResults.push(...(data.results[key] as SearchResult[]));
      }
      setResults(allResults);
      setSelectedIdx(0);
      setCache(prev => ({ ...prev, [cacheKey]: allResults }));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  // Mattea AI hint — fires 1200ms after user stops typing a question (>= 15 chars)
  // Render condition: matteaLoading || matteaAnswer !== null (no gating)
  useEffect(() => {
    const q = (query || '').trim();

    // Clear everything if query is very short
    if (q.length < 8) {
      setMatteaAnswer(null);
      setMatteaLoading(false);
      return;
    }

    // Only fire for question-like queries >= 15 chars
    const isQ = q.length >= 15 && (
      q.includes('?') ||
      /^(how |what |when |where |why |who |can |is |are |do |does |will |wie |was |wo |gibt es)/i.test(q)
    );

    if (!isQ) return;

    const questionText = q; // capture for closure
    const timer = setTimeout(async () => {
      setMatteaLoading(true);
      try {
        const body = JSON.stringify({ question: questionText });
        const res = await fetch('/api/search/mattea-hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        if (!res.ok) { setMatteaLoading(false); return; }
        const data = await res.json();
        if (data.answer) {
          setMatteaAnswer(data.answer);
        }
      } catch {
        // silent fail
      } finally {
        setMatteaLoading(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [query]);

  // Debounced input handler — normal search only (200ms)
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(val, activeCategory);
    }, 200);
  }

  // Category change: fetch immediately
  function handleCategoryChange(cat: SearchCategory | 'all') {
    setActiveCategory(cat);
    fetchResults(query, cat);
  }

  // Whether the Mattea hint is visible (adds 1 to the navigable items)
  const hasMatteaHint = matteaLoading || matteaAnswer !== null;
  const matteaOffset = hasMatteaHint ? 1 : 0;
  const totalItems = results.length + matteaOffset;

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (hasMatteaHint && selectedIdx === 0) {
        router.push(`/settings/help?q=${encodeURIComponent(query.trim())}`);
        close();
      } else {
        const hit = results[selectedIdx - matteaOffset];
        if (hit) {
          router.push(hit.href);
          close();
        }
      }
    } else if (e.key === 'Escape') {
      close();
    }
  }

  // Auto-scroll highlighted result into view
  useEffect(() => {
    if (!isOpen || results.length === 0) return;
    const el = document.querySelector('[role="option"][aria-selected="true"]');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIdx, isOpen, results.length]);

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
          <IconSearch size={40} className="text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Search GOYA</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Find members, events, courses, and pages.</p>
        </div>
      );
    }
    if (query.trim().length > 0 && query.trim().length < 2) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-400 dark:text-slate-500">Keep typing...</p>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="px-4 py-6 space-y-3">
          {[160, 200, 140, 180].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${w}px` }} />
                <div className="h-2.5 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" style={{ width: `${w * 0.7}px` }} />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (results.length === 0 && query.trim().length >= 2) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Try a different search term.</p>
        </div>
      );
    }

    let flatIndex = matteaOffset; // Start after Mattea hint if visible
    return (
      <div role="listbox" aria-label="Search results">
        {/* Mattea AI hint — v2 no-gating: renders when answer or loading */}
        {(matteaLoading || matteaAnswer !== null) && (
          <MatteaSearchHint
            query={query}
            answer={matteaAnswer}
            loading={matteaLoading}
            isHighlighted={selectedIdx === 0}
            onSelect={close}
          />
        )}

        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat}>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide px-4 pt-3 pb-1">
                {CATEGORY_LABELS[cat]}
              </p>
              {items.map((result) => {
                const idx = flatIndex++;
                return (
                  <SearchResultRow
                    key={result.id}
                    result={result}
                    isHighlighted={idx === selectedIdx}
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
    <div className={`flex items-center gap-3 ${
      isMobile
        ? 'mx-3 px-4 py-3 bg-white dark:bg-transparent rounded-xl'
        : 'px-4 py-3 border-b border-slate-100 dark:border-slate-700'
    }`}>
      <IconSearch
        size={20}
        className={query ? 'text-[#345c83]' : 'text-slate-400 dark:text-slate-500'}
      />
      <input
        ref={isMobile ? mobileInputRef : inputRef}
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Search members, events, courses, pages..."
        className="flex-1 border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-0 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent"
        style={{ outline: 'none', boxShadow: 'none' }}
        aria-label="Search GOYA"
        autoComplete="off"
      />
      {query.length > 0 && (
        <button
          onClick={clearQuery}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-sm transition-colors"
          aria-label="Clear search"
          tabIndex={-1}
        >
          Clear
        </button>
      )}
      <button
        onClick={close}
        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        aria-label="Close search"
      >
        <IconX size={20} />
      </button>
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
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden"
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
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
                  <span><kbd className="font-mono">⌘K</kbd> toggle</span>
                  <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                  <span><kbd className="font-mono">↵</kbd> open</span>
                  <span><kbd className="font-mono">Esc</kbd> close</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile layout (hidden on desktop) ── */}
          <div className="sm:hidden">
            <div
              className="fixed inset-0 z-[10000] flex flex-col bg-gray-50 dark:bg-slate-900"
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              {/* Input bar at top */}
              <div className="pt-3">
                {inputBar(true)}
              </div>

              {/* Filter pills */}
              <SearchFilterPills
                activeCategory={activeCategory}
                onSelect={handleCategoryChange}
                isMobile
              />

              {/* Divider */}
              <div className="mx-4 border-t border-slate-200 dark:border-slate-700" />

              {/* Results (scrollable, fills remaining space) */}
              <div className="flex-1 overflow-y-auto">
                {renderResults()}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  return createPortal(overlay, document.body);
}
