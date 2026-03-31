'use client';

import { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MEDIA_BUCKETS } from './constants';
import type { MediaFolder } from './actions';
import { updateFolder, deleteFolder, reorderFolders } from './actions';
import CreateFolderModal from './components/CreateFolderModal';

interface FolderSidebarProps {
  folders: MediaFolder[];
  activeFolder: string | null;
  onFolderSelect: (folder: string | null) => void;
  collapsed: boolean;
  onCollapse: () => void;
  isAdmin: boolean;
  currentUserId: string;
  onFoldersChange: (folders: MediaFolder[]) => void;
}

// ── Icon helpers ──────────────────────────────────────────────────────────────

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

function PlusIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="7" r="1.5" /><circle cx="15" cy="7" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="17" r="1.5" /><circle cx="15" cy="17" r="1.5" />
    </svg>
  );
}

// ── Bucket dot colors ─────────────────────────────────────────────────────────

const BUCKET_DOT_COLORS: Record<string, string> = {
  'avatars':              'bg-violet-400',
  'event-images':         'bg-blue-400',
  'school-logos':         'bg-emerald-400',
  'upgrade-certificates': 'bg-amber-400',
  'uploads':              'bg-slate-400',
};

// ── Delete confirmation dialog ────────────────────────────────────────────────

interface DeleteConfirmProps {
  folder: MediaFolder;
  fileCount: number | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ folder, fileCount, loading, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="delete-folder-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 id="delete-folder-title" className="text-base font-semibold text-primary-dark mb-2">
          Delete &ldquo;{folder.name}&rdquo;?
        </h2>

        {fileCount !== null && fileCount > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            This folder contains <strong>{fileCount} file{fileCount === 1 ? '' : 's'}</strong>. Deleting the folder will <strong>not</strong> delete the files — they will become unfoldered.
          </div>
        )}

        {(fileCount === null || fileCount === 0) && (
          <p className="mb-4 text-sm text-slate-500">This action cannot be undone.</p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-9 px-4 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-9 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Delete folder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SortableFolderItem ────────────────────────────────────────────────────────

interface SortableFolderItemProps {
  folder: MediaFolder;
  indent: boolean;
  collapsed: boolean;
  isActive: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onRename: (id: string, newName: string) => void;
  onDeleteRequest: (folder: MediaFolder) => void;
}

function SortableFolderItem({
  folder,
  indent,
  collapsed,
  isActive,
  isAdmin,
  onSelect,
  onRename,
  onDeleteRequest,
}: SortableFolderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  function startEditing() {
    setEditValue(folder.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitRename() {
    const trimmed = editValue.trim();
    setEditing(false);
    if (trimmed && trimmed !== folder.name) {
      onRename(folder.id, trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setEditValue(folder.name);
    }
  }

  if (collapsed) {
    return (
      <div ref={setNodeRef} style={style}>
        <button
          onClick={onSelect}
          title={folder.name}
          className={[
            'w-full flex items-center justify-center px-2 py-2 rounded-lg transition-colors duration-150 cursor-pointer',
            isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
          ].join(' ')}
        >
          <FolderIcon className="w-4 h-4 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group flex items-center gap-1 rounded-lg transition-colors duration-150',
        indent ? 'pl-6' : 'pl-1',
        'pr-1',
        isActive ? 'bg-primary/10' : 'hover:bg-primary-50',
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 p-0.5 rounded"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripIcon />
      </button>

      {/* Folder icon + name / inline edit */}
      <button
        onClick={onSelect}
        onDoubleClick={startEditing}
        title={folder.name}
        className={[
          'flex-1 flex items-center gap-2 py-1.5 min-w-0 cursor-pointer',
          isActive ? 'text-primary font-semibold' : 'text-slate-500',
        ].join(' ')}
      >
        <FolderIcon className="w-4 h-4 shrink-0" />
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="flex-1 text-sm bg-white border border-primary rounded px-1 py-0 outline-none min-w-0"
          />
        ) : (
          <span className="text-sm truncate text-left">{folder.name}</span>
        )}
      </button>

      {/* Delete button (admin only, visible on hover) */}
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteRequest(folder); }}
          title={`Delete ${folder.name}`}
          className="shrink-0 p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label={`Delete folder ${folder.name}`}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}

// ── Main FolderSidebar ────────────────────────────────────────────────────────

export default function FolderSidebar({
  folders,
  activeFolder,
  onFolderSelect,
  collapsed,
  onCollapse,
  isAdmin,
  currentUserId,
  onFoldersChange,
}: FolderSidebarProps) {
  const allMediaActive = activeFolder === null;

  // ── Create modal state ─────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // The bucket context for the create modal (from which bucket's (+) was clicked)
  const [createBucket, setCreateBucket] = useState<string>('uploads');

  // ── Delete state ───────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<MediaFolder | null>(null);
  const [deleteFileCount, setDeleteFileCount] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteForce, setDeleteForce] = useState(false);

  // ── DnD sensors ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Rename handler ─────────────────────────────────────────────────────────
  const handleRename = useCallback(async (id: string, newName: string) => {
    const result = await updateFolder(id, newName);
    if (result.success && result.folder) {
      onFoldersChange(
        folders.map(f => (f.id === id ? result.folder! : f))
      );
    }
  }, [folders, onFoldersChange]);

  // ── Delete handlers ────────────────────────────────────────────────────────
  const handleDeleteRequest = useCallback(async (folder: MediaFolder) => {
    setDeleteTarget(folder);
    setDeleteForce(false);

    // Pre-fetch file count — call with force=false just to get the count
    const result = await deleteFolder(folder.id, false);
    if (!result.success && result.fileCount !== undefined) {
      setDeleteFileCount(result.fileCount);
    } else {
      // Either success (0 files) or an error — show count as 0
      setDeleteFileCount(result.fileCount ?? 0);
      if (result.success) {
        // folder had 0 files and was already deleted — unlikely path, but handle it
        onFoldersChange(folders.filter(f => f.id !== folder.id));
        setDeleteTarget(null);
        return;
      }
    }
  }, [folders, onFoldersChange]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const result = await deleteFolder(deleteTarget.id, true);

    setDeleteLoading(false);

    if (result.success) {
      onFoldersChange(folders.filter(f => f.id !== deleteTarget.id && f.parent_id !== deleteTarget.id));
      if (activeFolder === deleteTarget.id) {
        onFolderSelect(null);
      }
      setDeleteTarget(null);
      setDeleteFileCount(null);
    }
  }, [deleteTarget, folders, onFoldersChange, activeFolder, onFolderSelect]);

  // ── DnD reorder handler ────────────────────────────────────────────────────
  const handleDragEnd = useCallback(async (event: DragEndEvent, bucketKey: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const bucketFolders = folders.filter(
      f => f.bucket === bucketKey && !f.parent_id
    );
    const oldIndex = bucketFolders.findIndex(f => f.id === active.id);
    const newIndex = bucketFolders.findIndex(f => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(bucketFolders, oldIndex, newIndex);
    const otherFolders = folders.filter(
      f => !(f.bucket === bucketKey && !f.parent_id)
    );

    // Optimistic update
    onFoldersChange([...otherFolders, ...reordered]);

    // Persist
    await reorderFolders(reordered.map(f => f.id));
  }, [folders, onFoldersChange]);

  // ── Render folder item via SortableFolderItem ──────────────────────────────
  function renderSortableFolder(folder: MediaFolder, indent: boolean) {
    return (
      <SortableFolderItem
        key={folder.id}
        folder={folder}
        indent={indent}
        collapsed={collapsed}
        isActive={activeFolder === folder.id}
        isAdmin={isAdmin}
        onSelect={() => onFolderSelect(folder.id)}
        onRename={handleRename}
        onDeleteRequest={handleDeleteRequest}
      />
    );
  }

  return (
    <>
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
            <span className="ml-2 text-sm font-semibold text-primary-dark whitespace-nowrap overflow-hidden flex-1">
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
                {/* Bucket row */}
                {collapsed ? (
                  <button
                    onClick={() => onFolderSelect(bucket.key)}
                    title={bucket.label}
                    className={[
                      'w-full flex items-center justify-center px-2 py-2 rounded-lg transition-colors duration-150 cursor-pointer',
                      bucketActive ? 'bg-primary/10' : 'hover:bg-primary-50',
                    ].join(' ')}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${BUCKET_DOT_COLORS[bucket.key] ?? 'bg-slate-400'}`}
                    />
                  </button>
                ) : (
                  <div className="flex items-center group/bucket">
                    <button
                      onClick={() => onFolderSelect(bucket.key)}
                      className={[
                        'flex-1 flex items-center px-2 py-1 rounded-lg transition-colors duration-150 cursor-pointer',
                        bucketActive ? 'bg-primary/10 text-primary' : 'hover:bg-primary-50',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'text-xs font-semibold uppercase tracking-wide',
                          bucketActive ? 'text-primary' : 'text-slate-400 group-hover/bucket:text-primary-dark',
                        ].join(' ')}
                      >
                        {bucket.label}
                      </span>
                    </button>

                    {/* (+) create folder button */}
                    <button
                      onClick={() => {
                        setCreateBucket(bucket.key);
                        setCreateModalOpen(true);
                      }}
                      title={`New folder in ${bucket.label}`}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-primary hover:bg-primary-50 opacity-0 group-hover/bucket:opacity-100 transition-opacity cursor-pointer mr-1"
                      aria-label={`New folder in ${bucket.label}`}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                )}

                {/* Sortable top-level folders */}
                {topLevelFolders.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, bucket.key)}
                  >
                    <SortableContext
                      items={topLevelFolders.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {topLevelFolders.map(folder => (
                        <div key={folder.id} className="space-y-0.5">
                          {renderSortableFolder(folder, !collapsed)}
                          {/* Sub-folders (not sortable independently for simplicity) */}
                          {folders
                            .filter(f => f.parent_id === folder.id)
                            .map(sub => (
                              <div key={sub.id} className={collapsed ? '' : 'pl-4'}>
                                {renderSortableFolder(sub, !collapsed)}
                              </div>
                            ))}
                        </div>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Create folder modal */}
      {createModalOpen && (
        <CreateFolderModal
          bucket={createBucket}
          folders={folders}
          createdBy={currentUserId}
          onCreated={(folder) => {
            onFoldersChange([...folders, folder]);
            setCreateModalOpen(false);
          }}
          onClose={() => setCreateModalOpen(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          folder={deleteTarget}
          fileCount={deleteFileCount}
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteFileCount(null);
            setDeleteForce(false);
          }}
        />
      )}
    </>
  );
}
