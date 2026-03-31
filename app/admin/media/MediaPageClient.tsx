'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FolderSidebar from './FolderSidebar';
import { MEDIA_BUCKETS, type MediaFolder } from './actions';

interface MediaPageClientProps {
  initialFolders: MediaFolder[];
  // searchParams forwarded from page.tsx for SSR-consistent initial state
  folder?: string;  // ?folder= param
  view?: string;    // ?view= param ('grid' | 'list')
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ activeFolder }: { activeFolder: string | null }) {
  const isBucket = activeFolder !== null &&
    MEDIA_BUCKETS.some(b => b.key === activeFolder);

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
      <svg
        className="w-12 h-12 text-slate-200 mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-sm text-slate-400 max-w-xs">{message}</p>
    </div>
  );
}

// ── View toggle icons ────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
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

// ── Main component ───────────────────────────────────────────────────────────

export default function MediaPageClient({
  initialFolders,
  folder: folderProp,
  view: viewProp,
}: MediaPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active folder: null = All Media, string = bucket key or folder UUID
  const [activeFolder, setActiveFolder] = useState<string | null>(
    folderProp ?? null
  );

  // View mode: read from prop, then localStorage, default to 'grid'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (viewProp === 'grid' || viewProp === 'list') return viewProp;
    // SSR-safe: return default, useEffect will read localStorage
    return 'grid';
  });

  // Sidebar collapsed state — read from localStorage after mount
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hydrate localStorage prefs on mount
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

  // Build updated search params string
  function buildParams(updates: Record<string, string | null>): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    return params.toString();
  }

  const handleFolderSelect = useCallback(
    (folder: string | null) => {
      setActiveFolder(folder);
      const qs = buildParams({ folder: folder ?? null });
      router.push(`/admin/media${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, router]
  );

  function handleViewMode(mode: 'grid' | 'list') {
    setViewMode(mode);
    localStorage.setItem('media-view-mode', mode);
    const qs = buildParams({ view: mode });
    router.push(`/admin/media${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  function handleSidebarCollapse() {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('media-sidebar-collapsed', String(next));
      return next;
    });
  }

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
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-200 bg-white flex items-center px-4 gap-3 shrink-0">
          {/* Search + filter placeholders — Plans 02-02 will fill these */}
          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
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

        {/* Content area — Plans 02-02 will replace EmptyState with actual grid/list */}
        <div className="flex-1 overflow-y-auto p-6">
          <EmptyState activeFolder={activeFolder} />
        </div>
      </div>

      {/* Detail panel placeholder — Plans 02-03 will render this (380px push-content) */}
      {/* Reserve the slot at 0 width so Plans 02-03 can animate it open */}
      <div className="w-0 shrink-0 border-l border-slate-200 overflow-hidden transition-[width] duration-200" />
    </div>
  );
}
