import type { ApiKeyRow } from '@/lib/api/types'
import ApiKeysTable from './ApiKeysTable'

export default function OwnKeysTab({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B3A5C]">API Keys</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            <span className="font-medium text-[#374151]">{initialKeys.length}</span>
            {' key'}
            {initialKeys.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <ApiKeysTable initialKeys={initialKeys} />
    </div>
  )
}
