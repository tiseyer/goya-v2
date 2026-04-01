'use client';

import { useState } from 'react';
import type { EventCategoryRow } from '@/lib/types';
import { getCategories, deleteCategory } from './actions';
import CategoryForm from './CategoryForm';

interface Props {
  initialCategories: EventCategoryRow[];
}

export default function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<EventCategoryRow[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<EventCategoryRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refreshCategories() {
    const fresh = await getCategories();
    setCategories(fresh);
  }

  function handleAdd() {
    setEditingCategory(null);
    setShowForm(true);
  }

  function handleEdit(cat: EventCategoryRow) {
    setEditingCategory(cat);
    setShowForm(true);
  }

  async function handleDelete(cat: EventCategoryRow) {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    setDeleteError(null);
    setDeletingId(cat.id);

    const result = await deleteCategory(cat.id);
    setDeletingId(null);

    if (!result.success) {
      setDeleteError(result.error ?? 'Failed to delete category.');
      return;
    }

    setCategories(prev => prev.filter(c => c.id !== cat.id));
  }

  function handleFormSave() {
    setShowForm(false);
    setEditingCategory(null);
    refreshCategories();
  }

  function handleFormCancel() {
    setShowForm(false);
    setEditingCategory(null);
  }

  const parentName = (parentId: string | null) => {
    if (!parentId) return '—';
    return categories.find(c => c.id === parentId)?.name ?? '—';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#1B3A5C]">Event Categories</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-slate-50 border border-[#E5E7EB] rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-[#1B3A5C] mb-4">
            {editingCategory ? `Edit — ${editingCategory.name}` : 'New Category'}
          </h3>
          <CategoryForm
            category={editingCategory ?? undefined}
            categories={categories}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#374151] font-medium">No categories yet</p>
            <p className="text-[#9CA3AF] text-sm mt-1">Add your first category above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Color</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Parent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className="inline-block w-5 h-5 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: cat.color }}
                        title={cat.color}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1B3A5C]">{cat.name}</td>
                    <td className="px-4 py-3 text-[#6B7280] font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3 text-[#6B7280] hidden md:table-cell">{parentName(cat.parent_id)}</td>
                    <td className="px-4 py-3 text-[#6B7280] hidden lg:table-cell max-w-[200px] truncate">
                      {cat.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{cat.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={deletingId === cat.id}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {deletingId === cat.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
