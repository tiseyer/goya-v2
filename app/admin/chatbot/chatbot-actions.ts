'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { getSupabaseService } from '@/lib/supabase/service'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import type { ChatbotConfig, FaqItem, FaqStatus } from '@/lib/chatbot/types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MATTEA_AVATAR_URL =
  'https://globalonlineyogaassociation.org/wp-content/uploads/2026/03/mattea.jpg'

/**
 * Fetch the single chatbot_config row.
 */
export async function getChatbotConfig(): Promise<
  { success: true; config: ChatbotConfig } | { success: false; error: string }
> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getSupabaseService() as any)
      .from('chatbot_config')
      .select('*')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, config: data as ChatbotConfig }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Upsert chatbot config. On first save, auto-fetch Mattea default avatar if none is set.
 */
export async function saveChatbotConfig(data: {
  name: string
  is_active: boolean
  system_prompt: string
  selected_key_id: string | null
  guest_retention_days: number
  avatar_url?: string | null
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'Name is required' }
    }
    if (data.name.trim().length > 100) {
      return { success: false, error: 'Name must be 100 characters or fewer' }
    }
    if (!data.system_prompt || !data.system_prompt.trim()) {
      return { success: false, error: 'System prompt is required' }
    }
    if (
      !Number.isInteger(data.guest_retention_days) ||
      data.guest_retention_days < 1 ||
      data.guest_retention_days > 365
    ) {
      return { success: false, error: 'Guest retention days must be between 1 and 365' }
    }

    const supabase = getSupabaseService()

    // Fetch existing config to get id and current avatar_url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('chatbot_config')
      .select('id, avatar_url')
      .single()

    let avatarUrl = data.avatar_url ?? existing?.avatar_url ?? null

    // ADMIN-04: Auto-fetch Mattea avatar on first save if no avatar is set
    if (!avatarUrl) {
      try {
        const resp = await fetch(MATTEA_AVATAR_URL)
        if (resp.ok) {
          const buffer = await resp.arrayBuffer()
          const uint8 = new Uint8Array(buffer)
          const contentType = resp.headers.get('content-type') || 'image/jpeg'
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
          const fileName = `avatar-default.${ext}`

          // Ensure bucket exists (idempotent)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: bucketErr } = await (supabase as any).storage.createBucket('chatbot-avatars', {
            public: true,
          })
          // Ignore error if bucket already exists
          void bucketErr

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: uploadErr } = await (supabase as any).storage
            .from('chatbot-avatars')
            .upload(fileName, uint8, { contentType, upsert: true })

          if (!uploadErr) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: urlData } = (supabase as any).storage
              .from('chatbot-avatars')
              .getPublicUrl(fileName)
            avatarUrl = urlData?.publicUrl ?? null
          }
        }
      } catch {
        // Non-fatal — proceed without avatar
      }
    }

    const updatePayload: Record<string, unknown> = {
      name: data.name.trim(),
      is_active: data.is_active,
      system_prompt: data.system_prompt.trim(),
      selected_key_id: data.selected_key_id,
      guest_retention_days: data.guest_retention_days,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }

    if (existing?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('chatbot_config')
        .update(updatePayload)
        .eq('id', existing.id)

      if (error) return { success: false, error: error.message }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('chatbot_config').insert(updatePayload)
      if (error) return { success: false, error: error.message }
    }

    revalidatePath('/admin/chatbot')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Upload a new avatar image to the chatbot-avatars storage bucket.
 */
export async function uploadChatbotAvatar(
  formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const file = formData.get('file')
    if (!file || !(file instanceof Blob)) {
      return { success: false, error: 'No file provided' }
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Only JPG, PNG, and WebP images are supported' }
    }

    const MAX_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Image must be 2MB or smaller' }
    }

    const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
    const fileName = `avatar-${Date.now()}.${ext}`

    const supabase = getSupabaseService()

    // Ensure bucket exists (idempotent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).storage.createBucket('chatbot-avatars', { public: true })

    const buffer = await file.arrayBuffer()
    const uint8 = new Uint8Array(buffer)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: uploadErr } = await (supabase as any).storage
      .from('chatbot-avatars')
      .upload(fileName, uint8, { contentType: file.type, upsert: false })

    if (uploadErr) {
      return { success: false, error: uploadErr.message }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: urlData } = (supabase as any).storage
      .from('chatbot-avatars')
      .getPublicUrl(fileName)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      return { success: false, error: 'Failed to get public URL for uploaded image' }
    }

    // Update chatbot_config.avatar_url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase as any)
      .from('chatbot_config')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .not('id', 'is', null)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    revalidatePath('/admin/chatbot')
    return { success: true, url: publicUrl }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * List all FAQ items ordered by created_at DESC, with creator display name joined.
 */
export async function listFaqItems(): Promise<
  { success: true; items: FaqItem[] } | { success: false; error: string }
> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getSupabaseService() as any)
      .from('faq_items')
      .select('*, profiles!created_by(full_name)')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    // Map joined profiles to flat FaqItem with creator_name
    const items: FaqItem[] = (data ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (row: any) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        status: row.status as FaqStatus,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        creator_name: row.profiles?.full_name ?? undefined,
      }),
    )

    return { success: true, items }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Create a new FAQ item with status 'draft'.
 */
export async function createFaqItem(
  question: string,
  answer: string,
): Promise<{ success: true; item: FaqItem } | { success: false; error: string }> {
  try {
    if (!question || !question.trim()) {
      return { success: false, error: 'Question is required' }
    }
    if (!answer || !answer.trim()) {
      return { success: false, error: 'Answer is required' }
    }

    const supabase = await createSupabaseServerActionClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (getSupabaseService() as any)
      .from('faq_items')
      .insert({
        question: question.trim(),
        answer: answer.trim(),
        status: 'draft',
        created_by: user?.id ?? null,
      })
      .select('*')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/chatbot')
    return {
      success: true,
      item: {
        id: data.id,
        question: data.question,
        answer: data.answer,
        status: data.status as FaqStatus,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
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
 * Update an existing FAQ item's question and answer.
 */
export async function updateFaqItem(
  id: string,
  question: string,
  answer: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(id)) {
      return { success: false, error: 'Invalid FAQ item ID format' }
    }
    if (!question || !question.trim()) {
      return { success: false, error: 'Question is required' }
    }
    if (!answer || !answer.trim()) {
      return { success: false, error: 'Answer is required' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('faq_items')
      .update({
        question: question.trim(),
        answer: answer.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/chatbot')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Delete a FAQ item by ID.
 */
export async function deleteFaqItem(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(id)) {
      return { success: false, error: 'Invalid FAQ item ID format' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('faq_items')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/chatbot')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Toggle a FAQ item between 'published' and 'draft' status.
 */
export async function toggleFaqStatus(
  id: string,
  newStatus: FaqStatus,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(id)) {
      return { success: false, error: 'Invalid FAQ item ID format' }
    }
    if (newStatus !== 'published' && newStatus !== 'draft') {
      return { success: false, error: 'Status must be "published" or "draft"' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (getSupabaseService() as any)
      .from('faq_items')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/chatbot')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
