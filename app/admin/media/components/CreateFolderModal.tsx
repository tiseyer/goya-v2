'use client';

import { useState, useEffect, useRef } from 'react';
import { createFolder } from '../actions';
import type { MediaFolder } from '../actions';

interface CreateFolderModalProps {
  bucket: string;
  folders: MediaFolder[];
  createdBy: string;
  onCreated: (folder: MediaFolder) => void;
  onClose: () => void;
}

export default function CreateFolderModal({
  bucket,
  folders,
  createdBy,
  onCreated,
  onClose,
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the name input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Top-level folders in the current bucket only (no sub-sub nesting)
  const parentOptions = folders.filter(
    f => f.bucket === bucket && !f.parent_id
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Folder name is required.');
      return;
    }
    setError('');
    setLoading(true);

    const result = await createFolder({
      name: trimmed,
      bucket,
      parentId: parentId || null,
      createdBy,
    });

    setLoading(false);

    if (!result.success || !result.folder) {
      setError(result.error ?? 'Failed to create folder.');
      return;
    }

    onCreated(result.folder);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="create-folder-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2
          id="create-folder-title"
          className="text-base font-semibold text-primary-dark mb-4"
        >
          New Folder
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="folder-name"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Folder name
            </label>
            <input
              ref={inputRef}
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Workshop Photos"
              className={[
                'w-full h-9 px-3 text-sm rounded-lg border outline-none transition-colors',
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                  : 'border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20',
              ].join(' ')}
              disabled={loading}
            />
            {error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>

          {/* Parent folder (optional) */}
          {parentOptions.length > 0 && (
            <div>
              <label
                htmlFor="folder-parent"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Parent folder <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                id="folder-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
                disabled={loading}
              >
                <option value="">— Top level —</option>
                {parentOptions.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-9 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
