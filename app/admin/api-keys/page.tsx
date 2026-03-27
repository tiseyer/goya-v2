import Link from 'next/link'
import { getSupabaseService } from '@/lib/supabase/service'
import type { ApiKeyRow } from '@/lib/api/types'
import OwnKeysTab from './OwnKeysTab'
import SecretsPlaceholder from './SecretsPlaceholder'
import EndpointsPlaceholder from './EndpointsPlaceholder'

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
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-4">API Settings</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-sm text-red-600">Failed to load API keys: {error.message}</p>
        </div>
      </div>
    )
  }

  const apiKeys = (keys ?? []) as ApiKeyRow[]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">API Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage API keys, secrets, and endpoint documentation
        </p>
      </div>

      {/* Tab bar */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-0">
            <Link
              href="/admin/api-keys?tab=keys"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'keys'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              Own Keys
            </Link>
            <Link
              href="/admin/api-keys?tab=secrets"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'secrets'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              Third Party Keys
            </Link>
            <Link
              href="/admin/api-keys?tab=endpoints"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'endpoints'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              Endpoints
            </Link>
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'keys' && <OwnKeysTab initialKeys={apiKeys} />}
      {activeTab === 'secrets' && <SecretsPlaceholder />}
      {activeTab === 'endpoints' && <EndpointsPlaceholder />}
    </div>
  )
}
