'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MemberFolderSidebar from './MemberFolderSidebar';
import MemberMediaDetailPanel from './MemberMediaDetailPanel';
import MediaGrid from '@/app/admin/media/MediaGrid';
import MediaList from '@/app/admin/media/MediaList';
import type { MediaItem } from '@/app/admin/media/actions';
import { getMemberMediaItems } from './actions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemberMediaClientProps {
  currentUserId: string;
  folder?: string;
  view?: string;
  q?: string;
  type?: string;
  date?: string;
  sort?: string;
}

// ── Coercion helpers ──────────────────────────────────────────────────────────

function coerceType(v: string | undefined): 'all' | 'images' | 'pdfs' | 'videos' {
  if (v === 'images' || v === 'pdfs' || v === 'videos') return v;
  return 'all';
}
function coerceDate(v: string | undefined): 'all' | 'today' | 'week' | 'month' {
  if (v === 'today' || v === 'week' || v === 'month') return v;
  return 'all';
}
function coerceSort(v: string | undefined): 'newest' | 'oldest' | 'name' | 'size' {
  if (v === 'oldest' || v === 'name' || v === 'size') return v;
  return 'newest';
}
function coerceView(v: string | undefined): 'grid' | 'list' {
  if (v === 'list') return 'list';
  return 'grid';
}

// ── View icons ────────────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

// ── Select style constant ─────────────────────────────────────────────────────

const SELECT_CLS = [
  'h-8 pl-2.5 pr-7 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg',
  'appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2',
  'focus:ring-primary/30 focus:border-primary transition-colors duration-150',
].join(' ');

const CHEVRON_DOWN = (
  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-4">
        <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm text-slate-400 max-w-xs">No files match your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-4">
      <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm text-slate-400 max-w-xs">
        No media files yet. Files you upload (like certificates and profile photos) will appear here.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MemberMediaClient({
  currentUserId,
  folder: folderProp,
  view: viewProp,
  q: qProp,
  type: typeProp,
  date: dateProp,
  sort: sortProp,
}: MemberMediaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeFolder, setActiveFolder] = useState<string | null>(folderProp ?? null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(coerceView(viewProp));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [q, setQ] = useState(qProp ?? '');
  const [debouncedQ, setDebouncedQ] = useState(qProp ?? '');
  const [type, setType] = useState<'all' | 'images' | 'pdfs' | 'videos'>(coerceType(typeProp));
  const [date, setDate] = useState<'all' | 'today' | 'week' | 'month'>(coerceDate(dateProp));
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name' | 'size'>(coerceSort(sortProp));

  const [items, setItems] = useState<MediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Hydrate localStorage prefs on mount ────────────────────────────────────
  useEffect(() => {
    const storedView = localStorage.getItem('member-media-view-mode');
    if (!viewProp && (storedView === 'grid' || storedView === 'list')) {
      setViewMode(storedView);
    }
    const storedCollapsed = localStorage.getItem('member-media-sidebar-collapsed');
    if (storedCollapsed !== null) {
      setSidebarCollapsed(storedCollapsed === 'true');
    }
  }, [viewProp]);

  // ── Build URL params ───────────────────────────────────────────────────────
  function buildParams(updates: Record<string, string | null>): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    return params.toString();
  }

  // ── Debounce search query ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  // ── Load items whenever filters change ─────────────────────────────────────
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setSelectedItem(null);
    try {
      const result = await getMemberMediaItems({
        currentUserId,
        folder: activeFolder,
        q: debouncedQ || undefined,
        type,
        date,
        sort,
        cursor: undefined,
      });
      setItems(result.items);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error('[MemberMediaClient] Error loading media items:', err);
      setItems([]);
      setNextCursor(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, activeFolder, debouncedQ, type, date, sort]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── Update URL params when filters change ──────────────────────────────────
  useEffect(() => {
    const qs = buildParams({
      folder: activeFolder,
      q: debouncedQ || null,
      type: type !== 'all' ? type : null,
      date: date !== 'all' ? date : null,
      sort: sort !== 'newest' ? sort : null,
      view: viewMode !== 'grid' ? viewMode : null,
    });
    router.replace(`/settings/media${qs ? `?${qs}` : ''}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder, debouncedQ, type, date, sort, viewMode]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && nextCursor && !isFetchingMore && !isLoading) {
          setIsFetchingMore(true);
          try {
            const result = await getMemberMediaItems({
              currentUserId,
              folder: activeFolder,
              q: debouncedQ || undefined,
              type,
              date,
              sort,
              cursor: nextCursor,
            });
            setItems(prev => [...prev, ...result.items]);
            setNextCursor(result.nextCursor);
          } catch (err) {
            console.error('[MemberMediaClient] Error loading more items:', err);
          } finally {
            setIsFetchingMore(false);
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, isFetchingMore, isLoading, currentUserId, activeFolder, debouncedQ, type, date, sort]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFolderSelect = useCallback((folder: string | null) => {
    setActiveFolder(folder);
  }, []);

  function handleViewMode(mode: 'grid' | 'list') {
    setViewMode(mode);
    localStorage.setItem('member-media-view-mode', mode);
  }

  function handleSidebarCollapse() {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('member-media-sidebar-collapsed', String(next));
      return next;
    });
  }

  const hasFilters = !!(debouncedQ || type !== 'all' || date !== 'all');

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Folder sidebar */}
      <MemberFolderSidebar
        activeFolder={activeFolder}
        onFolderSelect={handleFolderSelect}
        collapsed={sidebarCollapsed}
        onCollapse={handleSidebarCollapse}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-200 bg-white flex items-center px-4 gap-2 shrink-0 w-full">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search files..."
              aria-label="Search files"
              className={[
                'w-full h-8 pl-8 pr-3 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg',
                'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30',
                'focus:border-primary transition-colors duration-150',
              ].join(' ')}
            />
          </div>

          {/* Filter: file type */}
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'all' | 'images' | 'pdfs' | 'videos')}
              aria-label="Filter by file type"
              className={SELECT_CLS}
            >
              <option value="all">All files</option>
              <option value="images">Images</option>
              <option value="pdfs">PDFs</option>
              <option value="videos">Videos</option>
            </select>
            {CHEVRON_DOWN}
          </div>

          {/* Filter: date */}
          <div className="relative">
            <select
              value={date}
              onChange={(e) => setDate(e.target.value as 'all' | 'today' | 'week' | 'month')}
              aria-label="Filter by date"
              className={SELECT_CLS}
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
            {CHEVRON_DOWN}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" aria-hidden="true" />

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'oldest' | 'name' | 'size')}
              aria-label="Sort order"
              className={SELECT_CLS}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A-Z</option>
              <option value="size">File size</option>
            </select>
            {CHEVRON_DOWN}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 ml-1">
            <button
              onClick={() => handleViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={[
                'w-7 h-7 flex items-center justify-center rounded transition-colors duration-150 cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => handleViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={[
                'w-7 h-7 flex items-center justify-center rounded transition-colors duration-150 cursor-pointer',
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="overflow-y-auto p-6 h-full">
          {isLoading ? (
            viewMode === 'grid' ? (
              <MediaGrid items={[]} selectedId={null} onSelect={() => {}} isLoading />
            ) : (
              <MediaList items={[]} selectedId={null} onSelect={() => {}} isLoading />
            )
          ) : items.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : viewMode === 'grid' ? (
            <MediaGrid
              items={items}
              selectedId={selectedItem?.id ?? null}
              onSelect={setSelectedItem}
              isLoading={false}
            />
          ) : (
            <MediaList
              items={items}
              selectedId={selectedItem?.id ?? null}
              onSelect={setSelectedItem}
              isLoading={false}
            />
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />

          {/* Fetch-more indicator */}
          {isFetchingMore && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" aria-label="Loading more" />
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedItem && (
        <MemberMediaDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
