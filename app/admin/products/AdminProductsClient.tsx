'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface AdminProduct {
  id: string
  slug: string
  name: string
  full_name: string
  category: string
  price_display: string
  image_path: string | null
  priority: number
  is_active: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  teacher_designation: 'bg-blue-50 text-blue-700',
  experienced_teacher: 'bg-purple-50 text-purple-700',
  school_designation: 'bg-amber-50 text-amber-700',
  special: 'bg-emerald-50 text-emerald-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  teacher_designation: 'Teacher',
  experienced_teacher: 'Experienced',
  school_designation: 'School',
  special: 'Special',
}

export default function AdminProductsClient({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts)
  const [editingPriority, setEditingPriority] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSaveOrder = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const updated = products.map(p => ({
        ...p,
        priority: editingPriority[p.slug] !== undefined
          ? parseInt(editingPriority[p.slug]) || p.priority
          : p.priority
      }))

      await Promise.all(
        updated.map(p =>
          supabase.from('products').update({ priority: p.priority }).eq('id', p.id)
        )
      )

      setProducts(updated.sort((a, b) => a.priority - b.priority))
      setEditingPriority({})
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError('Failed to save order. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (product: AdminProduct) => {
    setToggleLoading(prev => ({ ...prev, [product.slug]: true }))
    const newValue = !product.is_active

    setProducts(prev => prev.map(p => p.slug === product.slug ? { ...p, is_active: newValue } : p))

    const { error } = await supabase
      .from('products')
      .update({ is_active: newValue })
      .eq('id', product.id)

    if (error) {
      setProducts(prev => prev.map(p => p.slug === product.slug ? { ...p, is_active: !newValue } : p))
    }

    setToggleLoading(prev => ({ ...prev, [product.slug]: false }))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">{products.length} products</p>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-sm text-emerald-600 font-medium">✓ Saved!</span>
          )}
          {saveError && (
            <span className="text-sm text-red-600">{saveError}</span>
          )}
          <button
            onClick={handleSaveOrder}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B3A5C] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Save Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-24">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-12">Image</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-32">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-36">Price</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-20">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {products.map(product => (
                <tr key={product.slug} className="hover:bg-slate-50/50 transition-colors">
                  {/* Priority */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={editingPriority[product.slug] ?? product.priority}
                      onChange={e => setEditingPriority(prev => ({ ...prev, [product.slug]: e.target.value }))}
                      className="w-16 px-2 py-1 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1B3A5C] text-center"
                      min={1}
                      max={999}
                    />
                  </td>

                  {/* Image */}
                  <td className="px-4 py-3">
                    {product.image_path ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                        <Image
                          src={product.image_path}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100" />
                    )}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1B3A5C] text-sm">{product.name}</p>
                    <p className="text-xs text-[#9CA3AF] truncate max-w-xs">{product.full_name}</p>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[product.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#374151]">{product.price_display}</span>
                  </td>

                  {/* Active toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(product)}
                      disabled={toggleLoading[product.slug]}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        product.is_active ? 'bg-[#00B5A3]' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          product.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#9CA3AF]">
        Tip: Edit priority numbers and click &quot;Save Order&quot; to reorder products. Lower numbers appear first.
      </p>
    </div>
  )
}
