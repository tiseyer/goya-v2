import { getSupabaseService } from '@/lib/supabase/service'
import type { ApiKeyRow } from '@/lib/api/types'
import ApiKeysTable from './ApiKeysTable'

export default async function ApiKeysPage() {
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

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">API Keys</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            <span className="font-medium text-[#374151]">{apiKeys.length}</span>
            {' key'}
            {apiKeys.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <ApiKeysTable initialKeys={apiKeys} />
    </div>
  )
}
