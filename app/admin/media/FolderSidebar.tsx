'use client';

import { MEDIA_BUCKETS } from './constants';
import type { MediaFolder } from './actions';

interface FolderSidebarProps {
  folders: MediaFolder[];
  activeFolder: string | null; // null = All Media
  onFolderSelect: (folder: string | null) => void;
  collapsed: boolean;
  onCollapse: () => void;
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// Small colored dot used in collapsed mode for each bucket
const BUCKET_DOT_COLORS: Record<string, string> = {
  'avatars':              'bg-violet-400',
  'event-images':         'bg-blue-400',
  'school-logos':         'bg-emerald-400',
  'upgrade-certificates': 'bg-amber-400',
  'uploads':              'bg-slate-400',
};

export default function FolderSidebar({
  folders,
  activeFolder,
  onFolderSelect,
  collapsed,
  onCollapse,
}: FolderSidebarProps) {
  const allMediaActive = activeFolder === null;

  function renderFolderItem(folder: MediaFolder, indent: boolean) {
    const isActive = activeFolder === folder.id;
    return (
      <button
        key={folder.id}
        onClick={() => onFolderSelect(folder.id)}
        title={collapsed ? folder.name : undefined}
        className={[
          'w-full flex items-center gap-2 rounded-lg transition-colors duration-150 cursor-pointer',
          collapsed ? 'justify-center px-2 py-2' : `${indent ? 'pl-6' : 'pl-2'} pr-2 py-1.5`,
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
        ].join(' ')}
      >
        <FolderIcon className="w-4 h-4 shrink-0" />
        {!collapsed && (
          <span className="text-sm truncate text-left">{folder.name}</span>
        )}
      </button>
    );
  }

  return (
    <aside
      style={{ width: collapsed ? '56px' : '240px' }}
      className="h-full flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
    >
      {/* Header */}
      <div className="flex items-center h-12 px-2 border-b border-slate-200 shrink-0">
        <button
          onClick={onCollapse}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-50 transition-colors cursor-pointer shrink-0"
          aria-label={collapsed ? 'Expand folder sidebar' : 'Collapse folder sidebar'}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
        {!collapsed && (
          <span className="ml-2 text-sm font-semibold text-primary-dark whitespace-nowrap overflow-hidden">
            Folders
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* All Media */}
        <button
          onClick={() => onFolderSelect(null)}
          title={collapsed ? 'All Media' : undefined}
          className={[
            'w-full flex items-center gap-2 rounded-lg transition-colors duration-150 cursor-pointer',
            collapsed ? 'justify-center px-2 py-2' : 'px-2 py-2',
            allMediaActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
          ].join(' ')}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={allMediaActive ? 2 : 1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {!collapsed && (
            <span className="text-sm font-medium">All Media</span>
          )}
        </button>

        {/* Divider */}
        <div className="my-2 mx-1 border-t border-slate-100" />

        {/* Bucket sections */}
        {MEDIA_BUCKETS.map(bucket => {
          const bucketActive = activeFolder === bucket.key;
          const topLevelFolders = folders.filter(
            f => f.bucket === bucket.key && !f.parent_id
          );

          return (
            <div key={bucket.key} className="space-y-0.5">
              {/* Bucket row — clicking sets activeFolder to bucket key */}
              {collapsed ? (
                <button
                  onClick={() => onFolderSelect(bucket.key)}
                  title={bucket.label}
                  className={[
                    'w-full flex items-center justify-center px-2 py-2 rounded-lg transition-colors duration-150 cursor-pointer',
                    bucketActive
                      ? 'bg-primary/10'
                      : 'hover:bg-primary-50',
                  ].join(' ')}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${BUCKET_DOT_COLORS[bucket.key] ?? 'bg-slate-400'}`}
                  />
                </button>
              ) : (
                <button
                  onClick={() => onFolderSelect(bucket.key)}
                  className={[
                    'w-full flex items-center px-2 py-1 rounded-lg transition-colors duration-150 cursor-pointer group',
                    bucketActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary-50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'text-xs font-semibold uppercase tracking-wide',
                      bucketActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary-dark',
                    ].join(' ')}
                  >
                    {bucket.label}
                  </span>
                </button>
              )}

              {/* Top-level folders under this bucket */}
              {topLevelFolders.map(folder => (
                <div key={folder.id} className="space-y-0.5">
                  {renderFolderItem(folder, !collapsed)}
                  {/* Sub-folders */}
                  {folders
                    .filter(f => f.parent_id === folder.id)
                    .map(sub => (
                      <div key={sub.id} className={collapsed ? '' : 'pl-4'}>
                        {renderFolderItem(sub, !collapsed)}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
