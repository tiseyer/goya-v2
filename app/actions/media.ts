'use server'

import { registerMediaItem, RegisterMediaItemInput } from '@/lib/media/register'

/**
 * Server action wrapper around registerMediaItem.
 * Called from client-side upload flows after getPublicUrl() succeeds.
 * Input shape mirrors RegisterMediaItemInput exactly.
 */
export async function registerMediaItemAction(
  input: RegisterMediaItemInput
): Promise<{ id: string | null }> {
  const id = await registerMediaItem(input)
  return { id }
}
