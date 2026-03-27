export type AiProviderName = 'openai' | 'anthropic'

export interface AiProviderDef {
  id: AiProviderName
  label: string
  models: { id: string; label: string }[]
}

export const AI_PROVIDERS: AiProviderDef[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    models: [
      { id: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    ],
  },
]

export function getModelsForProvider(providerId: AiProviderName) {
  return AI_PROVIDERS.find((p) => p.id === providerId)?.models ?? []
}

export function isValidProvider(provider: string): provider is AiProviderName {
  return AI_PROVIDERS.some((p) => p.id === provider)
}

export function isValidModel(provider: AiProviderName, model: string): boolean {
  return getModelsForProvider(provider).some((m) => m.id === model)
}
