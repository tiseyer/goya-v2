import Link from 'next/link'
import { getSupabaseService } from '@/lib/supabase/service'
import type { ApiKeyRow } from '@/lib/api/types'
import OwnKeysTab from './OwnKeysTab'
import SecretsTab from './SecretsTab'
import EndpointsTab from './EndpointsTab'
import { listSecrets, seedSecrets, listAiProviderKeys } from './secrets-actions'
import type { SecretListItem, AiProviderKeyItem } from './secrets-actions'

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'secrets' ? 'secrets' : tab === 'endpoints' ? 'endpoints' : 'keys'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: keys, error } = await (getSupabaseService() as any)
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-4">API Keys</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-sm text-red-600">Failed to load API keys: {error.message}</p>
        </div>
      </div>
    )
  }

  const apiKeys = (keys ?? []) as ApiKeyRow[]

  // Seed placeholder entries on first visit (no-op if already seeded)
  await seedSecrets()
  const [secretsResult, aiKeysResult] = await Promise.all([
    listSecrets(),
    listAiProviderKeys(),
  ])
  const initialSecrets: SecretListItem[] = secretsResult.success ? secretsResult.secrets : []
  const initialAiKeys: AiProviderKeyItem[] = aiKeysResult.success ? aiKeysResult.keys : []

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">API Keys</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage API keys and third-party integrations</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit overflow-x-auto">
        <Link
          href="/admin/api-keys?tab=keys"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'keys'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Own Keys
        </Link>
        <Link
          href="/admin/api-keys?tab=secrets"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'secrets'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Third Party Keys
        </Link>
        <Link
          href="/admin/api-keys?tab=endpoints"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'endpoints'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Endpoints
        </Link>
      </div>

      {/* Tab content */}
      {activeTab === 'keys' && <OwnKeysTab initialKeys={apiKeys} />}
      {activeTab === 'secrets' && <SecretsTab initialSecrets={initialSecrets} initialAiKeys={initialAiKeys} />}
      {activeTab === 'endpoints' && <EndpointsTab />}
    </div>
  )
}
