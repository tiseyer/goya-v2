'use server'
import 'server-only'
import { createHash, randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { getSupabaseService } from '@/lib/supabase/service'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import type { ApiKeyPermission } from '@/lib/api/types'

/**
 * Create a new API key.
 * Generates a random 64-char hex key, stores SHA-256 hash + prefix.
 * Returns the raw key exactly once — caller must display and copy it.
 */
export async function createApiKey(
  name: string,
  permissions: ApiKeyPermission[],
): Promise<{ success: true; rawKey: string } | { success: false; error: string }> {
  try {
    // Get current user for created_by
    const supabase = await createSupabaseServerActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Generate raw key and compute hash
    const rawKey = randomBytes(32).toString('hex')
    const keyPrefix = rawKey.slice(0, 8)
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('api_keys')
      .insert({
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name,
        permissions,
        created_by: user?.id ?? null,
        active: true,
        request_count: 0,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/api-keys')
    return { success: true, rawKey }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Revoke an API key by setting active=false.
 * The row remains in the table with status "Revoked".
 */
export async function revokeApiKey(
  keyId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('api_keys')
      .update({ active: false })
      .eq('id', keyId)

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
