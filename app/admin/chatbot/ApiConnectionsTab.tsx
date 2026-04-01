'use client'

import { useState } from 'react'
import type { ToolSlug } from '@/lib/chatbot/types'
import { updateEnabledTools } from './chatbot-actions'

const TOOL_DEFINITIONS: { slug: ToolSlug; name: string; description: string; locked: boolean }[] = [
  {
    slug: 'faq',
    name: 'FAQ Knowledge Base',
    description: 'Searches published FAQ items to answer common questions. Always active.',
    locked: true,
  },
  {
    slug: 'events',
    name: 'Events Search',
    description: 'Searches upcoming events and workshops from the GOYA calendar.',
    locked: false,
  },
  {
    slug: 'teachers',
    name: 'Teacher Directory',
    description: 'Searches registered teacher profiles by name, specialty, or location.',
    locked: false,
  },
  {
    slug: 'courses',
    name: 'Course Catalog',
    description: 'Searches available academy courses and training programs.',
    locked: false,
  },
]

const TOOL_ICONS: Record<ToolSlug, string> = {
  faq: '💬',
  events: '📅',
  teachers: '👩‍🏫',
  courses: '🎓',
}

interface Props {
  initialTools: string[]
}

export default function ApiConnectionsTab({ initialTools }: Props) {
  const [enabledTools, setEnabledTools] = useState<string[]>(initialTools)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle(slug: ToolSlug, currentlyEnabled: boolean) {
    setSaving(true)
    setError(null)

    const newTools = currentlyEnabled
      ? enabledTools.filter((t) => t !== slug)
      : [...enabledTools, slug]

    // Optimistic update
    setEnabledTools(newTools)

    const result = await updateEnabledTools(newTools)
    if (!result.success) {
      // Revert on failure
      setEnabledTools(enabledTools)
      setError(result.error)
    }

    setSaving(false)
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#1B3A5C]">Tool Connections</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Control which data sources Mattea can search when answering questions.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F3F4F6]">
          {TOOL_DEFINITIONS.map((tool) => {
            const isEnabled = tool.locked || enabledTools.includes(tool.slug)

            return (
              <div key={tool.slug} className="flex items-center gap-4 px-5 py-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                  {TOOL_ICONS[tool.slug]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1B3A5C]">{tool.name}</span>
                    {tool.locked && (
                      <span className="text-xs text-slate-400">(Always enabled)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{tool.description}</p>
                </div>

                {/* Toggle */}
                <div className="flex-shrink-0">
                  <button
                    role="switch"
                    aria-checked={isEnabled}
                    aria-label={`${tool.locked ? 'Always enabled' : isEnabled ? 'Disable' : 'Enable'} ${tool.name}`}
                    onClick={() => !tool.locked && handleToggle(tool.slug, isEnabled)}
                    disabled={tool.locked || saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:ring-offset-2 ${
                      isEnabled ? 'bg-[#00B5A3]' : 'bg-slate-200'
                    } ${tool.locked ? 'opacity-60 cursor-not-allowed' : saving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
