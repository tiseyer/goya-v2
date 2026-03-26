'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  toggleProductStatus,
  bulkProductAction,
  reorderProducts,
  softDeleteProduct,
} from './actions'

export type ProductRow = {
  id: string
  name: string
  slug: string
  priceCents: number
  priceDisplay: string
  imagePath: string | null
  isActive: boolean
  priority: number | null
  stripeProductId: string | null
  stripeActive: boolean | null
  priceType: 'one_time' | 'recurring' | null
  salesCount: number
  derivedStatus: 'Published' | 'Draft' | 'Deleted'
}

const STATUS_PILL: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-700',
  Draft: 'bg-amber-100 text-amber-700',
  Deleted: 'bg-red-100 text-red-700',
}

const TYPE_PILL: Record<string, string> = {
  one_time: 'bg-slate-100 text-slate-600',
  recurring: 'bg-blue-100 text-blue-700',
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

// ---- Sortable row ----

function SortableProductRow({
  product,
  isSelected,
  onSelect,
  onStatusToggle,
  onDelete,
}: {
  product: ProductRow
  isSelected: boolean
  onSelect: (id: string) => void
  onStatusToggle: (product: ProductRow) => void
  onDelete: (product: ProductRow) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-slate-50 transition-colors"
    >
      {/* Drag handle */}
      <td className="px-2 py-3 w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#9CA3AF] hover:text-[#6B7280] p-1 rounded"
          aria-label="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </button>
      </td>

      {/* Checkbox */}
      <td className="px-2 py-3 w-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(product.id)}
          className="rounded border-[#E5E7EB] text-[#00B5A3] focus:ring-[#00B5A3]"
          aria-label={`Select ${product.name}`}
        />
      </td>

      {/* Name + thumbnail */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {product.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imagePath}
              alt=""
              className="w-8 h-8 rounded object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1B3A5C] truncate max-w-[200px]">{product.name}</p>
            <p className="text-xs text-[#9CA3AF] truncate max-w-[200px]">{product.slug}</p>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <span className="text-sm text-[#374151]">{formatCents(product.priceCents)}</span>
      </td>

      {/* Type pill */}
      <td className="px-4 py-3">
        {product.priceType ? (
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_PILL[product.priceType] ?? 'bg-slate-100 text-slate-600'}`}>
            {product.priceType === 'one_time' ? 'One-time' : 'Recurring'}
          </span>
        ) : (
          <span className="text-[#9CA3AF] text-xs">—</span>
        )}
      </td>

      {/* Status pill — clickable to toggle (not for Deleted) */}
      <td className="px-4 py-3">
        <button
          disabled={product.derivedStatus === 'Deleted'}
          onClick={() => onStatusToggle(product)}
          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full transition-opacity ${STATUS_PILL[product.derivedStatus] ?? ''} ${product.derivedStatus === 'Deleted' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
          title={product.derivedStatus === 'Deleted' ? 'Deleted product' : `Click to ${product.derivedStatus === 'Published' ? 'draft' : 'publish'}`}
        >
          {product.derivedStatus}
        </button>
      </td>

      {/* Sales count */}
      <td className="px-4 py-3">
        <span className="text-sm text-[#374151]">{product.salesCount}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button
          onClick={() => onDelete(product)}
          disabled={product.derivedStatus === 'Deleted'}
          className="p-1.5 rounded text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Soft delete product"
          aria-label={`Delete ${product.name}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  )
}

// ---- Main table ----

export default function ProductsTable({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = products.findIndex((p) => p.id === active.id)
      const newIndex = products.findIndex((p) => p.id === over.id)
      const newOrder = arrayMove(products, oldIndex, newIndex)
      setProducts(newOrder)

      const stripeIds = newOrder
        .map((p) => p.stripeProductId)
        .filter((id): id is string => Boolean(id))
      await reorderProducts(stripeIds)
    },
    [products],
  )

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setSelectAll(false)
  }

  function handleSelectAll() {
    if (selectAll) {
      setSelected(new Set())
      setSelectAll(false)
    } else {
      setSelected(new Set(products.map((p) => p.id)))
      setSelectAll(true)
    }
  }

  async function handleStatusToggle(product: ProductRow) {
    if (!product.stripeProductId) return
    const newIsActive = !product.isActive
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              isActive: newIsActive,
              derivedStatus: newIsActive ? 'Published' : 'Draft',
            }
          : p,
      ),
    )
    await toggleProductStatus(product.id, product.stripeProductId, newIsActive)
  }

  async function handleDelete(product: ProductRow) {
    if (!product.stripeProductId) return
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, isActive: false, derivedStatus: 'Deleted' } : p,
      ),
    )
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(product.id)
      return next
    })
    await softDeleteProduct(product.id, product.stripeProductId)
  }

  async function handleBulkAction(action: 'publish' | 'draft' | 'delete') {
    const items = products
      .filter((p) => selected.has(p.id) && p.stripeProductId)
      .map((p) => ({ productId: p.id, stripeProductId: p.stripeProductId! }))

    if (items.length === 0) return

    if (action === 'publish') {
      setProducts((prev) =>
        prev.map((p) =>
          selected.has(p.id) ? { ...p, isActive: true, derivedStatus: 'Published' } : p,
        ),
      )
    } else if (action === 'draft') {
      setProducts((prev) =>
        prev.map((p) =>
          selected.has(p.id) ? { ...p, isActive: false, derivedStatus: 'Draft' } : p,
        ),
      )
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          selected.has(p.id) ? { ...p, isActive: false, derivedStatus: 'Deleted' } : p,
        ),
      )
    }

    setSelected(new Set())
    setSelectAll(false)
    await bulkProductAction(items, action)
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
        <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-sm font-medium text-[#374151]">No products found</p>
        <p className="text-xs text-[#6B7280] mt-1">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-[#1B3A5C] rounded-xl text-white text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkAction('draft')}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
            >
              Draft
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => { setSelected(new Set()); setSelectAll(false) }}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                  <th className="px-2 py-3 w-8" />
                  <th className="px-2 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-[#E5E7EB] text-[#00B5A3] focus:ring-[#00B5A3]"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sales</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {products.map((product) => (
                    <SortableProductRow
                      key={product.id}
                      product={product}
                      isSelected={selected.has(product.id)}
                      onSelect={toggleSelect}
                      onStatusToggle={handleStatusToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
