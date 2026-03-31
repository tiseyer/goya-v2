'use client';

// Read-only detail panel for member media library.
// No editable fields, no delete button, no "Uploaded by" row.

import { useState, useCallback } from 'react';
import type { MediaItem } from '@/app/admin/media/actions';
import { getFileTypeColor, getFileTypeLabel, formatFileSize } from '@/app/admin/media/mediaUtils';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MemberMediaDetailPanelProps {
  item: MediaItem;
  onClose: () => void;
  /** When true the panel animates out. Parent controls this before unmounting. */
  isClosing?: boolean;
  /** Render as a bottom sheet (mobile) instead of a side panel (desktop default). */
  asSheet?: boolean;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function AudioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('video/')) return <VideoIcon className={className} />;
  if (mimeType.startsWith('audio/')) return <AudioIcon className={className} />;
  return <DocumentIcon className={className} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 text-right break-all">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MemberMediaDetailPanel({
  item,
  onClose,
  isClosing = false,
  asSheet = false,
}: MemberMediaDetailPanelProps) {
  const isImage = item.file_type.startsWith('image/');
  const colorClasses = getFileTypeColor(item.file_type);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(item.file_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: ignore silently
    }
  }, [item.file_url]);

  // POLISH-03 + POLISH-04: animate in/out and support bottom sheet on mobile
  const panelCls = asSheet
    ? [
        'fixed inset-x-0 bottom-0 z-40 flex flex-col bg-white rounded-t-2xl shadow-2xl',
        'max-h-[80vh] overflow-y-auto overflow-x-hidden',
        'transition-transform duration-200 ease-in-out',
        isClosing ? 'translate-y-full' : 'translate-y-0',
      ].join(' ')
    : [
        'w-[340px] shrink-0 flex flex-col border-l border-slate-200 bg-white overflow-y-auto overflow-x-hidden',
        'transition-transform duration-200 ease-in-out',
        isClosing ? 'translate-x-full' : 'translate-x-0',
      ].join(' ');

  return (
    <div className={panelCls}>

      {/* ── Header ── */}
      <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
        <p className="text-sm font-medium text-slate-800 truncate pr-2" title={item.file_name}>
          {item.file_name}
        </p>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
        >
          <CloseIcon />
        </button>
      </div>

      {/* ── Preview ── */}
      <div className="h-52 shrink-0 bg-slate-50 border-b border-slate-200 flex items-center justify-center overflow-hidden">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.file_url}
            alt={item.alt_text ?? item.file_name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className={['flex flex-col items-center justify-center gap-3', colorClasses].join(' ')}>
            <FileTypeIcon mimeType={item.file_type} className="w-20 h-20" />
            <span className="text-sm font-bold tracking-wide">{getFileTypeLabel(item.file_type)}</span>
          </div>
        )}
      </div>

      {/* ── Read-only metadata ── */}
      <div className="px-4 py-4 space-y-2 text-sm">
        <MetaRow label="File name" value={item.file_name} />
        <MetaRow label="Type" value={item.file_type} />
        <MetaRow label="Size" value={formatFileSize(item.file_size)} />
        {item.width && item.height && (
          <MetaRow label="Dimensions" value={`${item.width} × ${item.height} px`} />
        )}
        <MetaRow label="Uploaded" value={formatDate(item.created_at)} />

        {/* URL row with copy button */}
        <div className="flex items-center gap-1.5 pt-1">
          <p className="text-slate-500 shrink-0 text-xs">URL</p>
          <p className="text-slate-700 text-xs truncate flex-1 font-mono">{item.file_url}</p>
          <button
            onClick={handleCopyUrl}
            aria-label="Copy file URL"
            title={copied ? 'Copied!' : 'Copy URL'}
            className={[
              'shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors duration-150 cursor-pointer',
              copied ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
