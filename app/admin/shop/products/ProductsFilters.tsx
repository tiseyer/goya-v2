'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  initialSearch: string
  initialStatus: string
  initialType: string
  initialSort: string
}

export default function ProductsFilters({
  initialSearch,
  initialStatus,
  initialType,
  initialSort,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('search', search)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== 'page' && key !== 'pageSize') {
      params.set('page', '1')
    }
    startTransition(() => {
      router.replace(`/admin/shop/products?${params.toString()}`)
    })
  }

  function handleReset() {
    setSearch('')
    startTransition(() => {
      router.replace('/admin/shop/products')
    })
  }

  const selectClass =
    'h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3] cursor-pointer'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9 pr-3 w-64 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3]"
        />
      </div>

      {/* Status */}
      <select
        defaultValue={initialStatus}
        onChange={(e) => updateParam('status', e.target.value)}
        className={selectClass}
      >
        <option value="">All Status</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="deleted">Deleted</option>
      </select>

      {/* Type */}
      <select
        defaultValue={initialType}
        onChange={(e) => updateParam('type', e.target.value)}
        className={selectClass}
      >
        <option value="">All Types</option>
        <option value="one_time">One-time</option>
        <option value="recurring">Recurring</option>
      </select>

      {/* Sort */}
      <select
        defaultValue={initialSort}
        onChange={(e) => updateParam('sort', e.target.value)}
        className={selectClass}
      >
        <option value="priority">Priority</option>
        <option value="name_asc">Name A–Z</option>
        <option value="name_desc">Name Z–A</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="h-9 px-3 text-sm font-medium text-[#6B7280] hover:text-[#1B3A5C] border border-[#E5E7EB] bg-white rounded-lg hover:bg-slate-50 transition-colors"
      >
        Reset
      </button>
    </div>
  )
}
