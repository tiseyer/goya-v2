'use client';

import {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from 'react';
import { uploadMediaItem } from './actions';
import type { MediaItem } from './actions';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UploadCard {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  done: boolean;
  item?: MediaItem;
}

export interface MediaUploaderHandle {
  /** Programmatically open the file picker dialog */
  openFilePicker: () => void;
}

export interface MediaUploaderProps {
  activeFolder: string | null;
  activeBucket: string;
  uploadedBy: string;
  uploadedByRole: string;
  onUploadComplete: (item: MediaItem) => void;
  onUploadProgress: (fileId: string, progress: number) => void;
  onUploadStart: (fileId: string, fileName: string) => void;
  children: ReactNode;
}

// ── Accepted MIME types ───────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// ── Helpers ───────────────────────────────────────────────────────────────────

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// ── Upload progress card ──────────────────────────────────────────────────────

export function UploadProgressCard({ card }: { card: UploadCard }) {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
      <div className="aspect-square w-full flex flex-col items-center justify-center gap-2 px-2 animate-pulse">
        <svg
          className="w-8 h-8 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        <p className="text-[10px] text-slate-400 text-center truncate w-full px-1">{card.fileName}</p>
      </div>
      <div className="px-2 py-1.5 border-t border-slate-100">
        <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${card.progress}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">{card.progress < 100 ? 'Uploading…' : 'Processing…'}</p>
      </div>
    </div>
  );
}

// ── MediaUploader ─────────────────────────────────────────────────────────────
// Exposes openFilePicker() via forwardRef so the toolbar Upload button can
// trigger it without needing to be a descendant of this component.

const MediaUploader = forwardRef<MediaUploaderHandle, MediaUploaderProps>(
  function MediaUploader(
    {
      activeFolder,
      activeBucket,
      uploadedBy,
      uploadedByRole,
      onUploadComplete,
      onUploadProgress,
      onUploadStart,
      children,
    },
    ref
  ) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Expose openFilePicker to parent via ref
    useImperativeHandle(ref, () => ({
      openFilePicker: () => fileInputRef.current?.click(),
    }));

    const handleFiles = useCallback(
      async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        // Filter by type and size
        const validFiles: File[] = [];
        for (const file of Array.from(fileList)) {
          if (!ACCEPTED_TYPES.includes(file.type)) {
            console.warn(`[MediaUploader] Skipping unsupported type: ${file.type} (${file.name})`);
            continue;
          }
          if (file.size > MAX_SIZE_BYTES) {
            console.warn(`[MediaUploader] Skipping file over 50MB: ${file.name} (${file.size} bytes)`);
            continue;
          }
          validFiles.push(file);
        }

        // Process sequentially
        for (const file of validFiles) {
          const fileId = crypto.randomUUID();
          onUploadStart(fileId, file.name);
          onUploadProgress(fileId, 15);

          // Extract image dimensions client-side
          const dims = await extractImageDimensions(file);
          onUploadProgress(fileId, 30);

          // Encode to base64 for server action transfer
          let fileData: string;
          try {
            fileData = await readFileAsBase64(file);
          } catch (err) {
            console.error('[MediaUploader] Failed to read file:', err);
            continue;
          }

          onUploadProgress(fileId, 50);

          const result = await uploadMediaItem({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData,
            bucket: activeBucket,
            folder: activeFolder,
            width: dims?.width ?? null,
            height: dims?.height ?? null,
            uploadedBy,
            uploadedByRole,
          });

          onUploadProgress(fileId, 100);

          if (result.success && result.item) {
            onUploadComplete(result.item);
          } else {
            console.error('[MediaUploader] Upload failed:', result.error);
          }
        }
      },
      [activeFolder, activeBucket, uploadedBy, uploadedByRole, onUploadComplete, onUploadProgress, onUploadStart]
    );

    // Drag-and-drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      },
      [handleFiles]
    );

    return (
      <>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="sr-only"
          aria-hidden="true"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Drag-drop wrapper around the content area */}
        <div
          className="relative flex-1 overflow-hidden"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {children}

          {/* Drag-over overlay */}
          {isDragOver && (
            <div
              className={[
                'absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-20',
                'flex items-center justify-center pointer-events-none',
              ].join(' ')}
              aria-hidden="true"
            >
              <div className="text-center">
                <svg
                  className="w-10 h-10 text-primary mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <p className="mt-2 text-sm font-medium text-primary">Drop files to upload</p>
                <p className="text-xs text-primary/70 mt-0.5">JPEG, PNG, WebP, GIF, PDF, MP4 — max 50 MB</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
);

export default MediaUploader;
