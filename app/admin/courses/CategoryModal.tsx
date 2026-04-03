'use client';

import { useState, useEffect, useCallback } from 'react';
import { createCategory, updateCategory } from './category-actions';
import { generateCategorySlug } from '@/lib/courses/categories';
import type { CourseCategory, CategoryFormData } from '@/lib/courses/categories';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (category: CourseCategory) => void;
  category: CourseCategory | null;
  allCategories: CourseCategory[];
}

const INPUT_CLS = 'w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] placeholder-[#9CA3AF]';
const LABEL_CLS = 'block text-sm font-semibold text-[#374151] mb-1';

const DEFAULT_COLOR = '#6E88B0';

export default function CategoryModal({
  open,
  onClose,
  onSaved,
  category,
  allCategories,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset / populate form when modal opens or category changes
  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setSlug(category.slug);
        setDescription(category.description ?? '');
        setParentId(category.parent_id ?? '');
        setColor(category.color ?? DEFAULT_COLOR);
        setSlugManuallyEdited(true); // don't auto-overwrite slug in edit mode
      } else {
        setName('');
        setSlug('');
        setDescription('');
        setParentId('');
        setColor(DEFAULT_COLOR);
        setSlugManuallyEdited(false);
      }
      setError(null);
    }
  }, [open, category]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  // Escape key listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  function handleNameBlur() {
    if (!slugManuallyEdited && name.trim()) {
      setSlug(generateCategorySlug(name));
    }
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required.');
      return;
    }

    const formData: CategoryFormData = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      color: color || DEFAULT_COLOR,
      parent_id: parentId || null,
    };

    setIsSaving(true);
    const result = category
      ? await updateCategory(category.id, formData)
      : await createCategory(formData);
    setIsSaving(false);

    if (result.success && result.category) {
      onSaved(result.category);
    } else {
      setError(result.error ?? 'An error occurred.');
    }
  }

  if (!open) return null;

  // Parent options: exclude self in edit mode
  const parentOptions = allCategories.filter(c => c.id !== category?.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="max-w-md w-full mx-4 bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className={LABEL_CLS}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="e.g. Yoga Sequence"
              className={INPUT_CLS}
            />
          </div>

          {/* Slug */}
          <div>
            <label className={LABEL_CLS}>Slug</label>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
              placeholder="e.g. yoga-sequence"
              className={`${INPUT_CLS} font-mono text-xs`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={LABEL_CLS}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className={`${INPUT_CLS} resize-y`}
            />
          </div>

          {/* Parent category */}
          <div>
            <label className={LABEL_CLS}>Parent Category</label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">None</option>
              {parentOptions.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className={LABEL_CLS}>Color</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="#6E88B0"
                maxLength={7}
                className={`${INPUT_CLS} flex-1`}
              />
              <div
                className="w-6 h-6 rounded-full border border-[#E5E7EB] flex-shrink-0"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#4e87a0] hover:bg-[#3d6f85] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Category'}
          </button>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
