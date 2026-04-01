import { listFlows } from '@/lib/flows/flow-service'
import FlowListTabs from './components/FlowListTabs'

export default async function FlowsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab =
    tab === 'draft'
      ? 'draft'
      : tab === 'paused'
      ? 'paused'
      : tab === 'archived'
      ? 'archived'
      : tab === 'templates'
      ? 'templates'
      : 'active'

  // Fetch regular flows (non-template)
  const { data: flows } = await listFlows({ is_template: false })
  // Fetch template flows
  const { data: templates } = await listFlows({ is_template: true })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B3A5C]">Flows</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage interactive user flows
          </p>
        </div>
      </div>

      <FlowListTabs
        initialFlows={flows ?? []}
        initialTemplates={templates ?? []}
        activeTab={activeTab}
      />
    </div>
  )
}
