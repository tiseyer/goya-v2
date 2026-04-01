'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { getSupabaseService } from '@/lib/supabase/service'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { encrypt, decrypt } from '@/lib/secrets/encryption'
import { isValidProvider, isValidModel, type AiProviderName } from '@/lib/secrets/ai-providers'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SecretCategory = 'Auth' | 'Analytics' | 'Payments' | 'AI' | 'Other'

export type SecretRow = {
  id: string
  key_name: string
  encrypted_value: string
  iv: string
  description: string
  category: SecretCategory
  created_at: string
  updated_at: string
  created_by: string | null
}

export type SecretListItem = {
  id: string
  key_name: string
  description: string
  category: SecretCategory
  updated_at: string
  has_value: boolean
}

export type AiProviderKeyItem = {
  id: string
  key_name: string
  provider: AiProviderName
  model: string
  created_at: string
  created_by: string | null
}

/**
 * List all secrets — returns metadata only, never decrypted values.
 */
export async function listSecrets(): Promise<
  { success: true; secrets: SecretListItem[] } | { success: false; error: string }
> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getSupabaseService() as any)
      .from('admin_secrets')
      .select('id, key_name, description, category, updated_at, encrypted_value')
      .is('provider', null)
      .order('updated_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    // Map to list items — check if value is a real key (not placeholder)
    const secrets: SecretListItem[] = (data ?? []).map((row: { id: string; key_name: string; description: string; category: SecretCategory; updated_at: string; encrypted_value: string }) => ({
      id: row.id,
      key_name: row.key_name,
      description: row.description,
      category: row.category,
      updated_at: row.updated_at,
      has_value: row.encrypted_value.length > 36, // Placeholder 'REPLACE_ME' encrypts to 36 chars
    }))

    return { success: true, secrets }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Create a new encrypted secret.
 */
export async function createSecret(
  name: string,
  value: string,
  category: SecretCategory,
  description: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!name || !name.trim()) {
      return { success: false, error: 'Name is required' }
    }
    if (!value) {
      return { success: false, error: 'Value is required' }
    }

    const supabase = await createSupabaseServerActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { encrypted, iv } = encrypt(value)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any).from('admin_secrets').insert({
      key_name: name.trim(),
      encrypted_value: encrypted,
      iv,
      category,
      description: description.trim(),
      created_by: user?.id ?? null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/api-keys')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get a single secret with its decrypted value.
 * Only call this when the user explicitly requests to view/edit a secret.
 */
export async function getSecret(
  id: string,
): Promise<
  { success: true; secret: SecretListItem & { value: string } } | { success: false; error: string }
> {
  try {
    if (!UUID_REGEX.test(id)) {
      return { success: false, error: 'Invalid secret ID format' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getSupabaseService() as any)
      .from('admin_secrets')
      .select('id, key_name, description, category, updated_at, encrypted_value, iv')
      .eq('id', id)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const row = data as SecretRow
    const value = decrypt(row.encrypted_value, row.iv)

    return {
      success: true,
      secret: {
        id: row.id,
        key_name: row.key_name,
        description: row.description,
        category: row.category,
        updated_at: row.updated_at,
        has_value: true,
        value,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Update a secret's fields. Re-encrypts value if provided.
 */
export async function updateSecret(
  id: string,
  fields: {
    key_name?: string
    value?: string
    category?: SecretCategory
    description?: string
  },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(id)) {
      return { success: false, error: 'Invalid secret ID format' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateObj: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (fields.key_name) {
      updateObj.key_name = fields.key_name.trim()
    }
    if (fields.value) {
      const { encrypted, iv } = encrypt(fields.value)
      updateObj.encrypted_value = encrypted
      updateObj.iv = iv
    }
    if (fields.category) {
      updateObj.category = fields.category
    }
    if (fields.description !== undefined) {
      updateObj.description = fields.description.trim()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('admin_secrets')
      .update(updateObj)
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/api-keys')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * List AI provider keys — returns metadata only, never decrypted values.
 * Only returns rows WHERE provider IS NOT NULL.
 */
export async function listAiProviderKeys(): Promise<
  { success: true; keys: AiProviderKeyItem[] } | { success: false; error: string }
> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getSupabaseService() as any)
      .from('admin_secrets')
      .select('id, key_name, provider, model, created_at, created_by')
      .not('provider', 'is', null)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, keys: data as AiProviderKeyItem[] }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Create a new AI provider key. Validates provider and model against constants.
 */
export async function createAiProviderKey(
  displayName: string,
  value: string,
  provider: string,
  model: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!value) return { success: false, error: 'API key is required' }
    if (!isValidProvider(provider)) return { success: false, error: 'Invalid provider' }
    if (!isValidModel(provider, model)) return { success: false, error: 'Invalid model for provider' }

    const supabase = await createSupabaseServerActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { encrypted, iv } = encrypt(value)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any).from('admin_secrets').insert({
      key_name: displayName.trim() || `${provider}-${model}`,
      encrypted_value: encrypted,
      iv,
      category: 'AI',
      provider,
      model,
      description: `${provider} ${model} API key`,
      created_by: user?.id ?? null,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/api-keys')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Update an AI provider key's fields. Re-encrypts value if provided.
 */
export async function updateAiProviderKey(
  id: string,
  fields: { key_name?: string; value?: string; model?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(id)) return { success: false, error: 'Invalid secret ID format' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateObj: Record<string, any> = { updated_at: new Date().toISOString() }

    if (fields.key_name !== undefined) updateObj.key_name = fields.key_name.trim()
    if (fields.value) {
      const { encrypted, iv } = encrypt(fields.value)
      updateObj.encrypted_value = encrypted
      updateObj.iv = iv
    }
    if (fields.model) updateObj.model = fields.model

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('admin_secrets')
      .update(updateObj)
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/api-keys')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Hard-delete a secret by ID.
 */
export async function deleteSecret(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(id)) {
      return { success: false, error: 'Invalid secret ID format' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('admin_secrets')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/api-keys')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
