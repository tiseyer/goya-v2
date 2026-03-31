'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FolderSidebar from './FolderSidebar';
import MediaToolbar from './MediaToolbar';
import MediaGrid from './MediaGrid';
import MediaList from './MediaList';
import { MEDIA_BUCKETS, getMediaItems, type MediaItem, type MediaFolder } from './actions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MediaPageClientProps {
  initialFolders: MediaFolder[];
  folder?: string;
  view?: string;
  q?: string;
  type?: string;
  date?: string;
  by?: string;
  sort?: string;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ activeFolder, hasFilters }: { activeFolder: string | null; hasFilters: boolean }) {
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

  const isBucket = activeFolder !== null && MEDIA_BUCKETS.some(b => b.key === activeFolder);
  let message: string;
  if (activeFolder === null) {
    message = 'No media files yet. Files uploaded across the platform will appear here.';
  } else if (isBucket) {
    message = 'No files in this bucket yet.';
  } else {
    message = 'This folder is empty.';
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-4">
      <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm text-slate-400 max-w-xs">{message}</p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function coerceType(v: string | undefined): 'all' | 'images' | 'pdfs' | 'videos' {
  if (v === 'images' || v === 'pdfs' || v === 'videos') return v;
  return 'all';
}
function coerceDate(v: string | undefined): 'all' | 'today' | 'week' | 'month' {
  if (v === 'today' || v === 'week' || v === 'month') return v;
  return 'all';
}
function coerceBy(v: string | undefined): 'all' | 'team' | 'members' {
  if (v === 'team' || v === 'members') return v;
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

// ── Main component ────────────────────────────────────────────────────────────

export default function MediaPageClient({
  initialFolders,
  folder: folderProp,
  view: viewProp,
  q: qProp,
  type: typeProp,
  date: dateProp,
  by: byProp,
  sort: sortProp,
}: MediaPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Filter / search / sort state ───────────────────────────────────────────
  const [activeFolder, setActiveFolder] = useState<string | null>(folderProp ?? null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(coerceView(viewProp));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [q, setQ] = useState(qProp ?? '');
  const [debouncedQ, setDebouncedQ] = useState(qProp ?? '');
  const [type, setType] = useState<'all' | 'images' | 'pdfs' | 'videos'>(coerceType(typeProp));
  const [date, setDate] = useState<'all' | 'today' | 'week' | 'month'>(coerceDate(dateProp));
  const [by, setBy] = useState<'all' | 'team' | 'members'>(coerceBy(byProp));
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name' | 'size'>(coerceSort(sortProp));

  // ── Media items state ──────────────────────────────────────────────────────
  const [items, setItems] = useState<MediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Hydrate localStorage prefs on mount ────────────────────────────────────
  useEffect(() => {
    const storedView = localStorage.getItem('media-view-mode');
    if (!viewProp && (storedView === 'grid' || storedView === 'list')) {
      setViewMode(storedView);
    }
    const storedCollapsed = localStorage.getItem('media-sidebar-collapsed');
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
      const result = await getMediaItems({
        folder: activeFolder,
        q: debouncedQ || undefined,
        type,
        date,
        by,
        sort,
        cursor: undefined,
      });
      setItems(result.items);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error('[MediaPageClient] Error loading media items:', err);
      setItems([]);
      setNextCursor(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, debouncedQ, type, date, by, sort]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── Update URL params when filters change (after debounce) ─────────────────
  useEffect(() => {
    const qs = buildParams({
      folder: activeFolder,
      q: debouncedQ || null,
      type: type !== 'all' ? type : null,
      date: date !== 'all' ? date : null,
      by: by !== 'all' ? by : null,
      sort: sort !== 'newest' ? sort : null,
      view: viewMode !== 'grid' ? viewMode : null,
    });
    router.replace(`/admin/media${qs ? `?${qs}` : ''}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder, debouncedQ, type, date, by, sort, viewMode]);

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
            const result = await getMediaItems({
              folder: activeFolder,
              q: debouncedQ || undefined,
              type,
              date,
              by,
              sort,
              cursor: nextCursor,
            });
            setItems(prev => [...prev, ...result.items]);
            setNextCursor(result.nextCursor);
          } catch (err) {
            console.error('[MediaPageClient] Error loading more items:', err);
          } finally {
            setIsFetchingMore(false);
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, isFetchingMore, isLoading, activeFolder, debouncedQ, type, date, by, sort]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFolderSelect = useCallback(
    (folder: string | null) => {
      setActiveFolder(folder);
    },
    []
  );

  function handleViewMode(mode: 'grid' | 'list') {
    setViewMode(mode);
    localStorage.setItem('media-view-mode', mode);
  }

  function handleSidebarCollapse() {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('media-sidebar-collapsed', String(next));
      return next;
    });
  }

  const hasFilters = !!(debouncedQ || type !== 'all' || date !== 'all' || by !== 'all');

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Folder sidebar */}
      <FolderSidebar
        folders={initialFolders}
        activeFolder={activeFolder}
        onFolderSelect={handleFolderSelect}
        collapsed={sidebarCollapsed}
        onCollapse={handleSidebarCollapse}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar with search, filters, sort, and view toggle */}
        <MediaToolbar
          q={q}
          type={type}
          date={date}
          by={by}
          sort={sort}
          viewMode={viewMode}
          onQChange={setQ}
          onTypeChange={setType}
          onDateChange={setDate}
          onByChange={setBy}
          onSortChange={setSort}
          onViewModeChange={handleViewMode}
        />

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            // Grid/list handles its own skeleton
            viewMode === 'grid' ? (
              <MediaGrid items={[]} selectedId={null} onSelect={() => {}} isLoading />
            ) : (
              <MediaList items={[]} selectedId={null} onSelect={() => {}} isLoading />
            )
          ) : items.length === 0 ? (
            <EmptyState activeFolder={activeFolder} hasFilters={hasFilters} />
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

      {/* Detail panel — reserved slot (w-0 → w-[380px] in Plan 02-03) */}
      {selectedItem ? (
        <div className="w-[380px] shrink-0 border-l border-slate-200 bg-white overflow-hidden transition-[width] duration-200" />
      ) : (
        <div className="w-0 shrink-0 border-l border-slate-200 overflow-hidden transition-[width] duration-200" />
      )}
    </div>
  );
}
