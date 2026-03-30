'use client'

import { useState } from 'react'
import { Search, ClipboardList } from 'lucide-react'
import type { FaqItem } from '@/lib/chatbot/types'
import FaqRow from './FaqRow'
import FaqModal from './FaqModal'

interface FaqTabProps {
  initialItems: FaqItem[]
}

export default function FaqTab({ initialItems }: FaqTabProps) {
  const [items, setItems] = useState<FaqItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredItems =
    search.trim().length > 0
      ? items.filter(
          (i) =>
            i.question.toLowerCase().includes(search.toLowerCase()) ||
            i.answer.toLowerCase().includes(search.toLowerCase()) ||
            i.category?.toLowerCase().includes(search.toLowerCase()),
        )
      : items

  function handleExpand(id: string | null) {
    setExpandedId(id)
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function handleUpdate(id: string, updated: FaqItem) {
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
  }

  function handleCreated(item: FaqItem) {
    setItems((prev) => [item, ...prev])
    setShowModal(false)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
            size={16}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQ entries..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] bg-white text-[#374151] placeholder-[#9CA3AF]"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#4e87a0] hover:bg-[#3d6f85] text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
        >
          Add FAQ
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && search.trim().length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList size={40} className="text-[#9CA3AF]" />
          <h3 className="text-base font-semibold text-[#1B3A5C] mt-4">No FAQ entries yet</h3>
          <p className="text-sm text-[#6B7280] mt-2">
            Add your first FAQ to help the chatbot answer common questions.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 bg-[#4e87a0] hover:bg-[#3d6f85] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Add FAQ
          </button>
        </div>
      )}

      {/* Table */}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                <th className="text-left px-4 py-3 w-[30%]">Question</th>
                <th className="text-left px-4 py-3 w-[25%]">Answer</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">By</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && search.trim().length > 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-[#6B7280] py-12">
                    No FAQ entries match your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <FaqRow
                    key={item.id}
                    item={item}
                    isExpanded={expandedId === item.id}
                    onExpand={handleExpand}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add FAQ Modal */}
      {showModal && (
        <FaqModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
