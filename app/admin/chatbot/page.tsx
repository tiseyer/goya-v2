import Link from 'next/link'
import { getChatbotConfig, listFaqItems, listConversations, getEnabledTools } from './chatbot-actions'
import { listAiProviderKeys } from '../api-keys/secrets-actions'
import type { AiProviderKeyItem } from '../api-keys/secrets-actions'
import ConfigurationTab from './ConfigurationTab'
import FaqTab from './FaqTab'
import ConversationsTab from './ConversationsTab'
import ApiConnectionsTab from './ApiConnectionsTab'

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

  const [configResult, aiKeysResult, faqResult, conversationsResult, toolsResult] = await Promise.all([
    getChatbotConfig(),
    listAiProviderKeys(),
    listFaqItems(),
    listConversations(),
    getEnabledTools(),
  ])

  const config = configResult.success ? configResult.config : null
  const aiKeys: AiProviderKeyItem[] = aiKeysResult.success ? aiKeysResult.keys : []
  const initialFaqItems = faqResult.success ? faqResult.items : []
  const initialConversations = conversationsResult.success ? conversationsResult.conversations : []
  const enabledTools = toolsResult.success ? toolsResult.tools : ['faq']

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
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit overflow-x-auto">
        <Link
          href="/admin/chatbot?tab=config"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'config'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Configuration
        </Link>
        <Link
          href="/admin/chatbot?tab=faq"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'faq'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          FAQ
        </Link>
        <Link
          href="/admin/chatbot?tab=conversations"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'conversations'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Conversations
        </Link>
        <Link
          href="/admin/chatbot?tab=api-connections"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'api-connections'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          API Connections
        </Link>
      </div>

      {/* Tab content */}
      {activeTab === 'config' && <ConfigurationTab config={config} aiKeys={aiKeys} />}
      {activeTab === 'faq' && <FaqTab initialItems={initialFaqItems} />}
      {activeTab === 'conversations' && <ConversationsTab initialConversations={initialConversations} />}
      {activeTab === 'api-connections' && <ApiConnectionsTab initialTools={enabledTools} />}
    </div>
  )
}
