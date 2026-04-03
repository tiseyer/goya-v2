'use client';

import { useState, useEffect } from 'react';
import { fetchCategories, deleteCategory } from './category-actions';
import type { CourseCategory } from '@/lib/courses/categories';
import CategoryModal from './CategoryModal';

export default function AdminCategoriesTab() {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; courseCount: number } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(({ data, error: err }) => {
      setCategories(data);
      if (err) setError(err);
      setLoading(false);
    });
  }, []);

  function getCategoryName(id: string | null): string {
    if (!id) return '---';
    return categories.find(c => c.id === id)?.name ?? '---';
  }

  async function handleDelete(id: string, name: string) {
    setDeleteError(null);
    setDeleteConfirm(null);
    const result = await deleteCategory(id);
    if (result.success) {
      setCategories(prev => prev.filter(c => c.id !== id));
    } else if (result.courseCount > 0) {
      setDeleteConfirm({ id, name, courseCount: result.courseCount });
    } else {
      setDeleteError(result.error ?? 'Failed to delete category.');
    }
  }

  function handleSaved(category: CourseCategory) {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === category.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = category;
        return updated;
      }
      return [category, ...prev];
    });
    setModalOpen(false);
    setEditingCategory(null);
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-[#6B7280] text-sm">
        Loading categories...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
        Error loading categories: {error}
      </div>
    );
  }

  return (
    <>
      {/* Delete error */}
      {deleteError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="ml-4 text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete blocked notice */}
      {deleteConfirm && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-center justify-between">
          <span>
            <strong>&quot;{deleteConfirm.name}&quot;</strong> is used by {deleteConfirm.courseCount} course{deleteConfirm.courseCount !== 1 ? 's' : ''} and cannot be deleted.
          </span>
          <button onClick={() => setDeleteConfirm(null)} className="ml-4 text-amber-600 hover:text-amber-800 font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Top row */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => { setEditingCategory(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm text-center py-16">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-[#374151] font-medium">No categories yet</p>
          <p className="text-[#9CA3AF] text-sm mt-1 mb-4">Create your first course category to get started.</p>
          <button
            onClick={() => { setEditingCategory(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Color</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Parent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    {/* Color swatch */}
                    <td className="px-4 py-3">
                      <div
                        className="w-6 h-6 rounded-full border border-[#E5E7EB]"
                        style={{ backgroundColor: cat.color ?? '#6E88B0' }}
                      />
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-[#1B3A5C]">{cat.name}</td>
                    {/* Slug */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[#6B7280] font-mono text-xs">{cat.slug}</span>
                    </td>
                    {/* Parent */}
                    <td className="px-4 py-3 text-[#374151] hidden lg:table-cell">
                      {getCategoryName(cat.parent_id)}
                    </td>
                    {/* Description */}
                    <td className="px-4 py-3 text-[#6B7280] hidden lg:table-cell max-w-xs">
                      {cat.description
                        ? cat.description.length > 60
                          ? cat.description.slice(0, 60) + '…'
                          : cat.description
                        : '—'}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingCategory(cat); setModalOpen(true); }}
                          className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="px-2 py-1.5 border border-[#E5E7EB] text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete category"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCategory(null); }}
        onSaved={handleSaved}
        category={editingCategory}
        allCategories={categories}
      />
    </>
  );
}
