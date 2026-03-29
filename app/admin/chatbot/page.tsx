import Link from 'next/link'
import { getChatbotConfig } from './chatbot-actions'
import { listAiProviderKeys } from '../api-keys/secrets-actions'
import type { AiProviderKeyItem } from '../api-keys/secrets-actions'
import ConfigurationTab from './ConfigurationTab'
import PlaceholderTab from './PlaceholderTab'

export default async function ChatbotPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab =
    tab === 'faq'
      ? 'faq'
      : tab === 'conversations'
      ? 'conversations'
      : tab === 'api-connections'
      ? 'api-connections'
      : 'config'

  const [configResult, aiKeysResult] = await Promise.all([
    getChatbotConfig(),
    listAiProviderKeys(),
  ])

  const config = configResult.success ? configResult.config : null
  const aiKeys: AiProviderKeyItem[] = aiKeysResult.success ? aiKeysResult.keys : []

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1B3A5C]">Chatbot Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your AI support chatbot configuration and FAQ
        </p>
      </div>

      {/* Tab bar */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-0">
            <Link
              href="/admin/chatbot?tab=config"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'config'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              Configuration
            </Link>
            <Link
              href="/admin/chatbot?tab=faq"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'faq'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              FAQ
            </Link>
            <Link
              href="/admin/chatbot?tab=conversations"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'conversations'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              Conversations
            </Link>
            <Link
              href="/admin/chatbot?tab=api-connections"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'api-connections'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              API Connections
            </Link>
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'config' && <ConfigurationTab config={config} aiKeys={aiKeys} />}
      {activeTab === 'faq' && (
        <PlaceholderTab title="FAQ tab loading..." body="FAQ management will be available here." />
      )}
      {activeTab === 'conversations' && (
        <PlaceholderTab
          title="Coming in Phase 15"
          body="Conversation history viewer will be available here."
        />
      )}
      {activeTab === 'api-connections' && (
        <PlaceholderTab
          title="Coming in Phase 15"
          body="Tool connection toggles will be available here."
        />
      )}
    </div>
  )
}
