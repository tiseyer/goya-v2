'use client';

import { useState, useRef, useEffect } from 'react';
import type { EventCategoryRow } from '@/lib/types';
import { createCategory, updateCategory } from './actions';

interface Props {
  category?: EventCategoryRow;
  categories: EventCategoryRow[];
  onSave: () => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, categories, onSave, onCancel }: Props) {
  const isEdit = !!category;

  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [color, setColor] = useState(category?.color ?? '#345c83');
  const [parentId, setParentId] = useState(category?.parent_id ?? '');
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slugInputRef = useRef<HTMLInputElement>(null);

  function generateSlug(n: string) {
    return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setSlugManuallyEdited(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData();
    formData.set('name', name);
    formData.set('slug', slug);
    formData.set('description', description);
    formData.set('color', color);
    formData.set('parent_id', parentId);
    formData.set('sort_order', sortOrder);

    const result = isEdit
      ? await updateCategory(category.id, formData)
      : await createCategory(formData);

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? 'An error occurred.');
      return;
    }

    onSave();
  }

  // Available parents: exclude self and any descendants (simple: just exclude self for now)
  const availableParents = categories.filter(c => c.id !== category?.id);

  const inputCls = 'w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-white text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#4E87A0] focus:border-[#4E87A0]';
  const labelCls = 'block text-xs font-semibold text-[#374151] mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls} htmlFor="cat-name">Name <span className="text-red-500">*</span></label>
          <input
            id="cat-name"
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Workshop"
            className={inputCls}
          />
        </div>

        {/* Slug */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls} htmlFor="cat-slug">Slug <span className="text-red-500">*</span></label>
          <input
            id="cat-slug"
            type="text"
            required
            ref={slugInputRef}
            value={slug}
            onChange={handleSlugChange}
            placeholder="e.g. workshop"
            className={inputCls}
          />
          <p className="text-[10px] text-[#9CA3AF] mt-1">Lowercase letters, numbers, hyphens only</p>
        </div>

        {/* Color */}
        <div>
          <label className={labelCls} htmlFor="cat-color">Color</label>
          <div className="flex items-center gap-3">
            <input
              id="cat-color"
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-[#E5E7EB] cursor-pointer p-0.5 bg-white"
            />
            <span className="text-sm text-[#374151] font-mono">{color}</span>
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label className={labelCls} htmlFor="cat-sort">Sort Order</label>
          <input
            id="cat-sort"
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            min={0}
            className={inputCls}
          />
        </div>

        {/* Parent Category */}
        <div className="col-span-2">
          <label className={labelCls} htmlFor="cat-parent">Parent Category</label>
          <select
            id="cat-parent"
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            className={inputCls}
          >
            <option value="">None (top level)</option>
            {availableParents.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className={labelCls} htmlFor="cat-desc">Description</label>
          <textarea
            id="cat-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description of this category"
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[#E5E7EB] text-[#374151] text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
