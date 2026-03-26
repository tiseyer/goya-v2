'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { getStripe } from '@/lib/stripe/client'

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB

export async function uploadCertificate(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File too large' }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: 'Invalid file type' }
  }

  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const path = `${user.id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('upgrade-certificates')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('upgrade-certificates')
    .getPublicUrl(path)

  return { url: publicUrl }
}

export async function createUpgradeCheckoutSession(
  certificateUrls: string[],
): Promise<{ url: string } | { error: string }> {
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: 'price_1TE4kfDLfij4i9P9sUpSD2Si', quantity: 1 }],
      payment_intent_data: { capture_method: 'manual' },
      metadata: {
        type: 'teacher_upgrade',
        user_id: user.id,
        certificate_urls: JSON.stringify(certificateUrls),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
    })

    return { url: session.url! }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { error: message }
  }
}
