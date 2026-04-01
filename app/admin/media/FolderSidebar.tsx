'use client';

import { useState, useRef, useCallback } from 'react';
import { Image, Award, User, ChevronDown, ChevronRight } from 'lucide-react';
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
import { SIDEBAR_SECTIONS, type SidebarSectionKey } from './constants';
import type { MediaFolder } from './actions';
import { updateFolder, deleteFolder, reorderFolders, requestFolderDeletion, verifyAdminPassword } from './actions';
import CreateFolderModal from './components/CreateFolderModal';

interface FolderSidebarProps {
  folders: MediaFolder[];
  activeBucket: SidebarSectionKey | null;
  onBucketSelect: (bucket: SidebarSectionKey) => void;
  activeFolder: string | null;
  onFolderSelect: (folder: string | null) => void;
  collapsed: boolean;
  onCollapse: () => void;
  isAdmin: boolean;
  currentUserId: string;
  currentUserRole: string;
  currentUserEmail?: string;
  currentUserName?: string;
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

function FlagIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 21V4m0 0l18 6-18 6" />
    </svg>
  );
}

// ── Section icon map ──────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Image,
  Award,
  User,
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

// ── Request deletion dialog (moderator) ───────────────────────────────────────

interface RequestDeletionDialogProps {
  folder: MediaFolder;
  loading: boolean;
  submitted: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function RequestDeletionDialog({ folder, loading, submitted, onConfirm, onCancel }: RequestDeletionDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="request-deletion-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 id="request-deletion-title" className="text-base font-semibold text-primary-dark mb-2">
          Request deletion of &ldquo;{folder.name}&rdquo;?
        </h2>
        {submitted ? (
          <p className="mb-4 text-sm text-emerald-600">
            Deletion request submitted. Admins have been notified.
          </p>
        ) : (
          <p className="mb-4 text-sm text-slate-500">
            You don&rsquo;t have permission to delete folders directly. Submitting this request will notify all admins.
          </p>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitted ? 'Close' : 'Cancel'}
          </button>
          {!submitted && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="h-9 px-4 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Password confirm dialog (admin) ───────────────────────────────────────────

interface PasswordConfirmDialogProps {
  folder: MediaFolder;
  fileCount: number | null;
  email: string;
  loading: boolean;
  error: string | null;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

function PasswordConfirmDialog({ folder, fileCount, email, loading, error, onConfirm, onCancel }: PasswordConfirmDialogProps) {
  const [password, setPassword] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="password-confirm-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 id="password-confirm-title" className="text-base font-semibold text-primary-dark mb-2">
          Delete &ldquo;{folder.name}&rdquo;?
        </h2>

        {fileCount !== null && fileCount > 0 && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            This folder contains <strong>{fileCount} file{fileCount === 1 ? '' : 's'}</strong>. Deleting the folder will <strong>not</strong> delete the files — they will become unfoldered.
          </div>
        )}

        <p className="mb-3 text-sm text-slate-500">Re-enter your password to confirm deletion.</p>

        <div className="space-y-2 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full h-8 px-3 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && password) onConfirm(password); }}
              placeholder="Enter your password"
              autoFocus
              className="w-full h-8 px-3 text-sm text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

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
            onClick={() => onConfirm(password)}
            disabled={loading || !password}
            className="h-9 px-4 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Delete folder'}
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
  currentUserRole: string;
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
  currentUserRole,
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

      {/* Delete/request button (role-based, visible on hover) */}
      {currentUserRole === 'admin' && (
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteRequest(folder); }}
          title={`Delete ${folder.name}`}
          className="shrink-0 p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label={`Delete folder ${folder.name}`}
        >
          <TrashIcon />
        </button>
      )}
      {currentUserRole === 'moderator' && (
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteRequest(folder); }}
          title={`Request deletion of ${folder.name}`}
          className="shrink-0 p-1 rounded text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label={`Request deletion of folder ${folder.name}`}
        >
          <FlagIcon />
        </button>
      )}
    </div>
  );
}

// ── System folder item (Certificates — immutable, no DnD) ─────────────────────

interface SystemFolderItemProps {
  folder: MediaFolder;
  collapsed: boolean;
  isActive: boolean;
  onSelect: () => void;
}

function SystemFolderItem({ folder, collapsed, isActive, onSelect }: SystemFolderItemProps) {
  if (collapsed) {
    return (
      <button
        onClick={onSelect}
        title={folder.name}
        className={[
          'w-full flex items-center justify-center px-2 py-2 rounded-lg transition-colors duration-150 cursor-pointer',
          isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
        ].join(' ')}
      >
        <FolderIcon className="w-4 h-4 shrink-0" />
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      title={folder.name}
      className={[
        'w-full flex items-center gap-2 pl-6 pr-2 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer',
        isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
      ].join(' ')}
    >
      <FolderIcon className="w-4 h-4 shrink-0" />
      <span className="text-sm truncate text-left">{folder.name}</span>
    </button>
  );
}

// ── Main FolderSidebar ────────────────────────────────────────────────────────

export default function FolderSidebar({
  folders,
  activeBucket,
  onBucketSelect,
  activeFolder,
  onFolderSelect,
  collapsed,
  onCollapse,
  isAdmin,
  currentUserId,
  currentUserRole,
  currentUserEmail = '',
  currentUserName = '',
  onFoldersChange,
}: FolderSidebarProps) {

  // ── Create modal state ─────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createBucket, setCreateBucket] = useState<string>('media');

  // ── Delete state (admin path — password-gated) ─────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<MediaFolder | null>(null);
  const [deleteFileCount, setDeleteFileCount] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── Request deletion state (moderator path) ────────────────────────────────
  const [requestTarget, setRequestTarget] = useState<MediaFolder | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

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
    if (currentUserRole === 'moderator') {
      setRequestTarget(folder);
      setRequestSubmitted(false);
      return;
    }

    // Admin: show password-gated delete dialog
    setDeleteTarget(folder);
    setPasswordError(null);

    const result = await deleteFolder(folder.id, false);
    setDeleteFileCount(result.fileCount ?? 0);
  }, [currentUserRole]);

  const handleRequestSubmit = useCallback(async () => {
    if (!requestTarget) return;
    setRequestLoading(true);
    await requestFolderDeletion({
      folderId: requestTarget.id,
      folderName: requestTarget.name,
      requestedBy: currentUserId,
      requestedByName: currentUserName || 'A moderator',
    });
    setRequestLoading(false);
    setRequestSubmitted(true);
  }, [requestTarget, currentUserId, currentUserName]);

  const handleDeleteConfirm = useCallback(async (password: string) => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setPasswordError(null);

    const verify = await verifyAdminPassword({ email: currentUserEmail, password });
    if (!verify.success) {
      setPasswordError('Invalid password. Please try again.');
      setDeleteLoading(false);
      return;
    }

    const result = await deleteFolder(deleteTarget.id, true);

    setDeleteLoading(false);

    if (result.success) {
      onFoldersChange(folders.filter(f => f.id !== deleteTarget.id && f.parent_id !== deleteTarget.id));
      if (activeFolder === deleteTarget.id) {
        onFolderSelect(null);
      }
      setDeleteTarget(null);
      setDeleteFileCount(null);
      setPasswordError(null);
    }
  }, [deleteTarget, folders, onFoldersChange, activeFolder, onFolderSelect, currentUserEmail]);

  // ── DnD reorder handler (All Media user folders only) ─────────────────────
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Only user-created folders in the 'media' bucket are sortable
    const mediaFolders = folders.filter(f => f.bucket === 'media' && !f.is_system && !f.parent_id);
    const oldIndex = mediaFolders.findIndex(f => f.id === active.id);
    const newIndex = mediaFolders.findIndex(f => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(mediaFolders, oldIndex, newIndex);
    const otherFolders = folders.filter(f => !(f.bucket === 'media' && !f.is_system && !f.parent_id));

    onFoldersChange([...otherFolders, ...reordered]);
    await reorderFolders(reordered.map(f => f.id));
  }, [folders, onFoldersChange]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <aside
        style={{ width: collapsed ? '56px' : '240px' }}
        className="h-full flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
      >
        {/* Header */}
        <div className="flex items-center h-14 px-2 border-b border-slate-200 shrink-0">
          <button
            onClick={onCollapse}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-50 transition-colors cursor-pointer shrink-0"
            aria-label={collapsed ? 'Expand folder sidebar' : 'Collapse folder sidebar'}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
          {!collapsed && (
            <span className="ml-2 text-sm font-semibold text-primary-dark whitespace-nowrap overflow-hidden flex-1">
              Library
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {SIDEBAR_SECTIONS.map(section => {
            const SectionIcon = SECTION_ICONS[section.icon];
            const isSectionActive = activeBucket === section.key;
            // Section is "expanded" when it's the active bucket
            const isExpanded = isSectionActive;
            // A child subfolder is selected under this section
            const hasActiveChild = activeFolder !== null && isSectionActive;

            // Get folders for this section
            const sectionFolders = section.hasFolders
              ? folders.filter(f => {
                  if (section.key === 'media') {
                    return f.bucket === 'media' && f.is_system === false && !f.parent_id;
                  }
                  if (section.key === 'certificates') {
                    return f.bucket === 'certificates' && f.is_system === true && !f.parent_id;
                  }
                  return false;
                })
              : [];

            if (collapsed) {
              return (
                <button
                  key={section.key}
                  onClick={() => onBucketSelect(section.key)}
                  title={section.label}
                  className={[
                    'w-full flex items-center justify-center px-2 py-2 rounded-lg transition-colors duration-150 cursor-pointer',
                    isSectionActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
                  ].join(' ')}
                >
                  {SectionIcon && <SectionIcon size={16} />}
                </button>
              );
            }

            return (
              <div key={section.key} className="space-y-0.5">
                {/* Section header row */}
                <div className="flex items-center group/section">
                  <button
                    onClick={() => onBucketSelect(section.key)}
                    className={[
                      'flex-1 flex items-center gap-2 px-2 py-2 rounded-lg transition-colors duration-150 cursor-pointer min-w-0',
                      isSectionActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
                    ].join(' ')}
                  >
                    {SectionIcon && (
                      <SectionIcon
                        size={16}
                        className="shrink-0"
                      />
                    )}
                    <span className="text-sm truncate text-left flex-1">{section.label}</span>
                    {section.hasFolders && (
                      <span className="shrink-0 ml-auto">
                        {isExpanded
                          ? <ChevronDown size={14} />
                          : <ChevronRight size={14} />
                        }
                      </span>
                    )}
                  </button>

                  {/* (+) add folder — only for All Media when expanded */}
                  {section.key === 'media' && isSectionActive && (
                    <button
                      onClick={() => {
                        setCreateBucket('media');
                        setCreateModalOpen(true);
                      }}
                      title="New folder"
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-primary hover:bg-primary-50 opacity-0 group-hover/section:opacity-100 transition-opacity cursor-pointer ml-1"
                      aria-label="New folder in All Media"
                    >
                      <PlusIcon />
                    </button>
                  )}
                </div>

                {/* Subfolder list — shown when section is active and has folders */}
                {isExpanded && section.hasFolders && (
                  <div className="space-y-0.5">
                    {section.key === 'media' ? (
                      // All Media: user-created folders with DnD
                      sectionFolders.length > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={sectionFolders.map(f => f.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {sectionFolders.map(folder => (
                              <div key={folder.id} className="space-y-0.5">
                                <SortableFolderItem
                                  folder={folder}
                                  indent={true}
                                  collapsed={false}
                                  isActive={activeFolder === folder.id}
                                  isAdmin={isAdmin}
                                  currentUserRole={currentUserRole}
                                  onSelect={() => onFolderSelect(folder.id)}
                                  onRename={handleRename}
                                  onDeleteRequest={handleDeleteRequest}
                                />
                                {/* Sub-folders */}
                                {folders
                                  .filter(f => f.parent_id === folder.id)
                                  .map(sub => (
                                    <div key={sub.id} className="pl-4">
                                      <SortableFolderItem
                                        folder={sub}
                                        indent={true}
                                        collapsed={false}
                                        isActive={activeFolder === sub.id}
                                        isAdmin={isAdmin}
                                        currentUserRole={currentUserRole}
                                        onSelect={() => onFolderSelect(sub.id)}
                                        onRename={handleRename}
                                        onDeleteRequest={handleDeleteRequest}
                                      />
                                    </div>
                                  ))}
                              </div>
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <p className="pl-8 py-1.5 text-xs text-slate-400 italic">No folders yet</p>
                      )
                    ) : (
                      // Certificates: system subfolders (immutable)
                      sectionFolders.length > 0 ? (
                        sectionFolders.map(folder => (
                          <SystemFolderItem
                            key={folder.id}
                            folder={folder}
                            collapsed={false}
                            isActive={activeFolder === folder.id}
                            onSelect={() => onFolderSelect(folder.id)}
                          />
                        ))
                      ) : (
                        <p className="pl-8 py-1.5 text-xs text-slate-400 italic">No subfolders</p>
                      )
                    )}
                  </div>
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

      {/* Admin: password-gated delete dialog */}
      {deleteTarget && (
        <PasswordConfirmDialog
          folder={deleteTarget}
          fileCount={deleteFileCount}
          email={currentUserEmail}
          loading={deleteLoading}
          error={passwordError}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteFileCount(null);
            setPasswordError(null);
          }}
        />
      )}

      {/* Moderator: request deletion dialog */}
      {requestTarget && (
        <RequestDeletionDialog
          folder={requestTarget}
          loading={requestLoading}
          submitted={requestSubmitted}
          onConfirm={handleRequestSubmit}
          onCancel={() => {
            setRequestTarget(null);
            setRequestSubmitted(false);
          }}
        />
      )}
    </>
  );
}
