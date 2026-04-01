'use client';

import type { MediaItem } from './actions';
import { getFileTypeColor, getFileTypeLabel, formatFileSize } from './mediaUtils';

// ── Shared props ──────────────────────────────────────────────────────────────

export interface MediaViewProps {
  items: MediaItem[];
  selectedId: string | null;
  onSelect: (item: MediaItem) => void;
  isLoading: boolean;
}

// ── File type icons ───────────────────────────────────────────────────────────

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function AudioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  );
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('video/')) return <VideoIcon className={className} />;
  if (mimeType.startsWith('audio/')) return <AudioIcon className={className} />;
  return <DocumentIcon className={className} />;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-slate-100">
      <div className="aspect-square w-full animate-pulse bg-slate-200" />
      <div className="px-2 py-1.5 border-t border-slate-100 space-y-1">
        <div className="h-3 bg-slate-200 animate-pulse rounded w-4/5" />
        <div className="h-2.5 bg-slate-100 animate-pulse rounded w-2/5" />
      </div>
    </div>
  );
}

// ── MediaGrid ─────────────────────────────────────────────────────────────────

export default function MediaGrid({
  items,
  selectedId,
  onSelect,
  isLoading,
}: MediaViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map((item) => {
        const isImage = item.file_type.startsWith('image/');
        const isSelected = item.id === selectedId;
        const colorClasses = getFileTypeColor(item.file_type);

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            aria-label={`Select ${item.file_name}`}
            aria-pressed={isSelected}
            className={[
              'group relative flex flex-col rounded-lg overflow-hidden border bg-white',
              'hover:shadow-sm transition-all duration-150 text-left cursor-pointer',
              isSelected
                ? 'ring-2 ring-primary border-primary'
                : 'border-slate-200 hover:border-primary/50',
            ].join(' ')}
          >
            {/* Image / icon area */}
            <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.file_url}
                  alt={item.alt_text ?? item.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className={[
                    'w-full h-full flex flex-col items-center justify-center gap-2',
                    colorClasses,
                  ].join(' ')}
                >
                  <FileTypeIcon mimeType={item.file_type} className="w-12 h-12" />
                  <span className="text-xs font-bold tracking-wide">
                    {getFileTypeLabel(item.file_type)}
                  </span>
                </div>
              )}
            </div>

            {/* Name row */}
            <div className="px-2 py-1.5 border-t border-slate-100">
              <p className="text-xs text-slate-700 truncate">{item.file_name}</p>
              <p className="text-[10px] text-slate-400">{formatFileSize(item.file_size)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
