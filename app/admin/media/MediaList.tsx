'use client';

import type { MediaItem } from './actions';
import type { MediaViewProps } from './MediaGrid';
import { getFileTypeColor, getFileTypeLabel, formatFileSize } from './mediaUtils';

// ── File type icon (small, for table rows) ────────────────────────────────────

function SmallDocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SmallVideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function SmallAudioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

function RowFileIcon({ mimeType }: { mimeType: string }) {
  const colors = getFileTypeColor(mimeType);
  const isImage = mimeType.startsWith('image/');

  if (isImage) {
    return (
      <div className={`w-8 h-8 rounded flex items-center justify-center text-[9px] font-bold tracking-wide ${colors}`}>
        IMG
      </div>
    );
  }
  if (mimeType.startsWith('video/')) {
    return (
      <div className={`w-8 h-8 rounded flex items-center justify-center ${colors}`}>
        <SmallVideoIcon className="w-4 h-4" />
      </div>
    );
  }
  if (mimeType.startsWith('audio/')) {
    return (
      <div className={`w-8 h-8 rounded flex items-center justify-center ${colors}`}>
        <SmallAudioIcon className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className={`w-8 h-8 rounded flex items-center justify-center ${colors}`}>
      <SmallDocIcon className="w-4 h-4" />
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pl-4 pr-3">
        <div className="w-10 h-10 rounded animate-pulse bg-slate-200" />
      </td>
      <td className="py-2 px-3">
        <div className="h-3 bg-slate-200 animate-pulse rounded w-40 mb-1.5" />
        <div className="h-2.5 bg-slate-100 animate-pulse rounded w-24" />
      </td>
      <td className="py-2 px-3">
        <div className="h-5 bg-slate-200 animate-pulse rounded w-12" />
      </td>
      <td className="py-2 px-3">
        <div className="h-3 bg-slate-200 animate-pulse rounded w-16" />
      </td>
      <td className="py-2 px-3">
        <div className="h-3 bg-slate-200 animate-pulse rounded w-24" />
      </td>
      <td className="py-2 pl-3 pr-4">
        <div className="h-3 bg-slate-200 animate-pulse rounded w-20" />
      </td>
    </tr>
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────

function TypeBadge({ mimeType }: { mimeType: string }) {
  const colors = getFileTypeColor(mimeType);
  const label = getFileTypeLabel(mimeType);
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${colors}`}>
      {label}
    </span>
  );
}

// ── MediaList ─────────────────────────────────────────────────────────────────

export default function MediaList({
  items,
  selectedId,
  onSelect,
  isLoading,
}: MediaViewProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="py-2 pl-4 pr-3 text-xs font-semibold text-slate-500 w-14">
              <span className="sr-only">Thumbnail</span>
            </th>
            <th className="py-2 px-3 text-xs font-semibold text-slate-500">Name</th>
            <th className="py-2 px-3 text-xs font-semibold text-slate-500 w-20">Type</th>
            <th className="py-2 px-3 text-xs font-semibold text-slate-500 w-20">Size</th>
            <th className="py-2 px-3 text-xs font-semibold text-slate-500 w-32">Date</th>
            <th className="py-2 pl-3 pr-4 text-xs font-semibold text-slate-500 w-36">Uploaded by</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
            : items.map((item) => {
                const isSelected = item.id === selectedId;
                const isImage = item.file_type.startsWith('image/');

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={[
                      'cursor-pointer border-b border-slate-100 transition-colors duration-100',
                      isSelected
                        ? 'bg-primary-50 border-l-2 border-l-primary'
                        : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {/* Thumbnail cell */}
                    <td className="py-2 pl-4 pr-3">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.file_url}
                          alt={item.alt_text ?? item.file_name}
                          className="w-10 h-10 object-cover rounded"
                          loading="lazy"
                        />
                      ) : (
                        <RowFileIcon mimeType={item.file_type} />
                      )}
                    </td>

                    {/* Name cell */}
                    <td className="py-2 px-3 max-w-xs">
                      <p className="text-slate-800 font-medium truncate">{item.file_name}</p>
                      {item.title && (
                        <p className="text-xs text-slate-400 truncate">{item.title}</p>
                      )}
                    </td>

                    {/* Type */}
                    <td className="py-2 px-3">
                      <TypeBadge mimeType={item.file_type} />
                    </td>

                    {/* Size */}
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {formatFileSize(item.file_size)}
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Uploaded by */}
                    <td className="py-2 pl-3 pr-4 text-slate-500 whitespace-nowrap">
                      {item.uploader_name ?? 'Unknown'}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
