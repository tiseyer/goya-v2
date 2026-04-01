'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
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
  arrayMove,
} from '@dnd-kit/sortable'
import type { Flow } from '@/lib/flows/types'
import FlowCard, { type FlowStats } from './FlowCard'
import CreateFlowModal from './CreateFlowModal'

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'paused', label: 'Paused' },
  { key: 'archived', label: 'Archived' },
  { key: 'templates', label: 'Templates' },
] as const

type TabKey = (typeof TABS)[number]['key']

// ─── Props ───────────────────────────────────────────────────────────────────

interface FlowListTabsProps {
  initialFlows: Flow[]
  initialTemplates: Flow[]
  activeTab: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlowListTabs({
  initialFlows,
  initialTemplates,
  activeTab: initialActiveTab,
}: FlowListTabsProps) {
  const [flows, setFlows] = useState<Flow[]>(initialFlows)
  const [templates, setTemplates] = useState<Flow[]>(initialTemplates)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [stats, setStats] = useState<Record<string, FlowStats>>({})
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeTab = (TABS.some(t => t.key === initialActiveTab) ? initialActiveTab : 'active') as TabKey

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Compute flows for the active tab
  const tabFlows: Flow[] =
    activeTab === 'templates'
      ? templates
      : flows.filter(f => f.status === activeTab)

  // ─── Fetch stats ──────────────────────────────────────────────────────────

  const loadStats = useCallback(async (flowIds: string[]) => {
    if (flowIds.length === 0) return
    setStatsLoading(true)
    try {
      const res = await fetch(`/api/admin/flows/stats?ids=${flowIds.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        setStats(prev => ({ ...prev, ...data }))
      }
    } catch {
      // stats are non-critical, ignore errors
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Load stats for all flows on mount
  useEffect(() => {
    const allIds = [...initialFlows, ...initialTemplates].map(f => f.id)
    if (allIds.length > 0) {
      loadStats(allIds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Drag & drop ──────────────────────────────────────────────────────────

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const isTemplateTab = activeTab === 'templates'
    const currentList = isTemplateTab ? templates : flows

    // Find indices within currentList (for templates) or within filtered tab (for status flows)
    if (isTemplateTab) {
      const oldIndex = templates.findIndex(f => f.id === active.id)
      const newIndex = templates.findIndex(f => f.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(templates, oldIndex, newIndex)
      setTemplates(reordered)
      await persistPriorityReorder(reordered)
    } else {
      // Find within filtered view
      const filtered = flows.filter(f => f.status === activeTab)
      const oldIndex = filtered.findIndex(f => f.id === active.id)
      const newIndex = filtered.findIndex(f => f.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reorderedFiltered = arrayMove(filtered, oldIndex, newIndex)

      // Reconstruct full flows array preserving other-status flows
      const otherFlows = flows.filter(f => f.status !== activeTab)
      setFlows([...otherFlows, ...reorderedFiltered])
      await persistPriorityReorder(reorderedFiltered)
    }
  }

  async function persistPriorityReorder(orderedFlows: Flow[]) {
    // Update priority for each flow in the new order (lower index = lower priority number = higher priority)
    await Promise.all(
      orderedFlows.map((flow, index) =>
        fetch(`/api/admin/flows/${flow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: index }),
        })
      )
    )
  }

  // ─── CRUD actions ─────────────────────────────────────────────────────────

  async function handleAction(
    action: 'duplicate' | 'pause' | 'activate' | 'archive' | 'delete',
    flowId: string
  ) {
    setError(null)
    try {
      if (action === 'duplicate') {
        const res = await fetch(`/api/admin/flows/${flowId}/duplicate`, { method: 'POST' })
        if (!res.ok) throw new Error('Failed to duplicate flow')
        const newFlow: Flow = await res.json()
        if (newFlow.is_template) {
          setTemplates(prev => [newFlow, ...prev])
        } else {
          setFlows(prev => [newFlow, ...prev])
        }
        // Load stats for the new flow
        loadStats([newFlow.id])
      } else if (action === 'pause' || action === 'activate') {
        const newStatus = action === 'pause' ? 'paused' : 'active'
        const res = await fetch(`/api/admin/flows/${flowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) throw new Error(`Failed to ${action} flow`)
        const updated: Flow = await res.json()
        setFlows(prev => prev.map(f => (f.id === flowId ? updated : f)))
      } else if (action === 'archive') {
        const res = await fetch(`/api/admin/flows/${flowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' }),
        })
        if (!res.ok) throw new Error('Failed to archive flow')
        const updated: Flow = await res.json()
        setFlows(prev => prev.map(f => (f.id === flowId ? updated : f)))
      } else if (action === 'delete') {
        const flow = [...flows, ...templates].find(f => f.id === flowId)
        if (!confirm(`Delete flow "${flow?.name ?? flowId}"? This cannot be undone.`)) return
        const res = await fetch(`/api/admin/flows/${flowId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete flow')
        setFlows(prev => prev.filter(f => f.id !== flowId))
        setTemplates(prev => prev.filter(f => f.id !== flowId))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  function handleFlowCreated(newFlow: Flow) {
    if (newFlow.is_template) {
      setTemplates(prev => [newFlow, ...prev])
    } else {
      setFlows(prev => [newFlow, ...prev])
    }
    loadStats([newFlow.id])
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const statusLabel = activeTab === 'templates' ? 'template' : activeTab

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs + Create button */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
          {TABS.map(tab => (
            <Link
              key={tab.key}
              href={`/admin/flows?tab=${tab.key}`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-[#1B3A5C] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Flow
        </button>
      </div>

      {/* Flow list */}
      {tabFlows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-slate-500 text-sm">No {statusLabel} flows yet</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-3 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Create your first flow
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabFlows.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tabFlows.map(flow => (
                <FlowCard
                  key={flow.id}
                  flow={flow}
                  stats={stats[flow.id]}
                  statsLoading={statsLoading && !stats[flow.id]}
                  onAction={handleAction}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create flow modal */}
      <CreateFlowModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleFlowCreated}
      />
    </>
  )
}
