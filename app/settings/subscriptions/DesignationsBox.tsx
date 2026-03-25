'use client'

import { useState } from 'react'
import { softDeleteDesignation } from './actions'
import type { DesignationItem } from './queries'

interface DesignationsBoxProps {
  designations: DesignationItem[]
}

export function DesignationsBox({ designations: initialDesignations }: DesignationsBoxProps) {
  const [items, setItems] = useState(initialDesignations)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await softDeleteDesignation(id)
      setItems(prev => prev.filter(d => d.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
      <h2 className="text-base font-semibold text-[#1B3A5C] mb-1">Designations</h2>
      <p className="text-sm text-[#6B7280] mb-4">These cost you nothing to keep.</p>
      <ul className="space-y-3">
        {items.map(d => (
          <li key={d.id} className="flex items-center justify-between">
            <span className="text-sm text-[#1B3A5C] font-medium">{d.productName}</span>
            <button
              onClick={() => handleDelete(d.id)}
              disabled={deleting === d.id}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting === d.id ? 'Deleting…' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
