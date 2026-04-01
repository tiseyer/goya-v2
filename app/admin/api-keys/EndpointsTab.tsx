'use client'

import { useState } from 'react'
import {
  ENDPOINT_REGISTRY,
  ENDPOINT_CATEGORIES,
  type EndpointCategory,
  type HttpMethod,
  type AuthType,
} from './endpoint-registry'

const METHOD_BADGE: Record<HttpMethod, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PATCH: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
}

const AUTH_BADGE: Record<AuthType, string> = {
  none: 'bg-slate-100 text-slate-500',
  read: 'bg-emerald-50 text-emerald-600',
  write: 'bg-blue-50 text-blue-600',
  admin: 'bg-red-50 text-red-600',
}

/** Render path segments, dimming :param tokens */
function PathDisplay({ path }: { path: string }) {
  const segments = path.split('/')
  return (
    <span className="font-mono text-sm text-[#1B3A5C]">
      {segments.map((seg, i) => {
        const isParam = seg.startsWith(':')
        return (
          <span key={i}>
            {i > 0 && '/'}
            <span className={isParam ? 'text-slate-400' : ''}>{seg}</span>
          </span>
        )
      })}
    </span>
  )
}

export default function EndpointsTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<EndpointCategory | 'All'>('All')

  // Client-side filtering — category + search (path and description)
  const filtered = ENDPOINT_REGISTRY.filter((ep) => {
    const matchesCategory = selectedCategory === 'All' || ep.category === selectedCategory
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      q === '' ||
      ep.path.toLowerCase().includes(q) ||
      ep.description.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  // Group filtered endpoints by category in ENDPOINT_CATEGORIES order
  const grouped = ENDPOINT_CATEGORIES.map((cat) => ({
    category: cat,
    endpoints: filtered.filter((ep) => ep.category === cat),
  })).filter((g) => g.endpoints.length > 0)

  return (
    <div>
      {/* Toolbar: category filter pills + search + count */}
      <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
        {/* Category filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedCategory === 'All'
                ? 'bg-[#1B3A5C] text-white'
                : 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {ENDPOINT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1B3A5C] text-white'
                  : 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right side: search + count */}
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]"
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoints..."
              className="pl-8 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent w-48"
            />
          </div>

          {/* Endpoint count */}
          <span className="text-xs text-slate-400 whitespace-nowrap">{filtered.length} endpoints</span>
        </div>
      </div>

      {/* Content */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
          <svg
            className="w-8 h-8 text-slate-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm font-medium text-[#374151]">No endpoints match your search.</p>
        </div>
      ) : (
        <div>
          {grouped.map(({ category, endpoints }, groupIndex) => (
            <div key={category}>
              {/* Category header */}
              <h3
                className={`text-sm font-semibold text-[#1B3A5C] mb-2 ${groupIndex === 0 ? '' : 'mt-6'}`}
              >
                {category}{' '}
                <span className="text-slate-400 font-normal">({endpoints.length})</span>
              </h3>

              {/* Endpoint rows */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
                {endpoints.map((ep) => (
                  <div key={`${ep.method}-${ep.path}`} className="px-4 py-3 flex items-start gap-3">
                    {/* Method badge */}
                    <span
                      className={`w-16 inline-flex justify-center rounded text-xs font-bold py-1 flex-shrink-0 ${METHOD_BADGE[ep.method]}`}
                    >
                      {ep.method}
                    </span>

                    {/* Path */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <PathDisplay path={ep.path} />
                        {/* Auth badge */}
                        <span className={`text-xs rounded-full px-2 py-0.5 ${AUTH_BADGE[ep.auth]}`}>
                          {ep.auth}
                        </span>
                      </div>
                      {/* Description */}
                      <p className="text-sm text-[#6B7280]">{ep.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
