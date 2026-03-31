// app/admin/media/mediaUtils.ts
// Shared helpers for media type display, colors, and size formatting.
// Safe to import from both client and server components.

export type { MediaItem } from './actions';

// ── File type color helper ────────────────────────────────────────────────────

/**
 * Returns Tailwind text + background color classes for a given MIME type.
 * Used for colored file-type icons in grid cards and list rows.
 */
export function getFileTypeColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'text-emerald-500 bg-emerald-50';
  if (mimeType === 'application/pdf') return 'text-red-500 bg-red-50';
  if (mimeType.startsWith('video/')) return 'text-blue-500 bg-blue-50';
  if (mimeType.startsWith('audio/')) return 'text-purple-500 bg-purple-50';
  return 'text-slate-400 bg-slate-100';
}

// ── File type label ───────────────────────────────────────────────────────────

/**
 * Returns a short uppercase label for a given MIME type.
 * E.g. 'image/jpeg' → 'JPEG', 'application/pdf' → 'PDF', 'video/mp4' → 'VIDEO'
 */
export function getFileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return mimeType.split('/')[1].toUpperCase();
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  return 'FILE';
}

// ── File size formatter ───────────────────────────────────────────────────────

/**
 * Formats bytes into a human-readable string.
 * E.g. 1500 → '1.5 KB', 2100000 → '2.0 MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Generic file icon SVG paths ───────────────────────────────────────────────

/**
 * Returns the appropriate icon SVG path for a MIME type.
 * Used inline in components to avoid extra dependencies.
 */
export type FileIconVariant = 'image' | 'pdf' | 'video' | 'audio' | 'generic';

export function getFileIconVariant(mimeType: string): FileIconVariant {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'generic';
}
