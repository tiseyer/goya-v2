import { NextResponse } from 'next/server'
import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId'

export async function POST(request: Request) {
  let userId: string
  try {
    userId = await getEffectiveUserId()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await getEffectiveClient()

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = file.type || 'image/jpeg'
  const path = `${userId}/${Date.now()}.jpg`

  const { error: uploadError } = await client.storage
    .from('avatars')
    .upload(path, buffer, { contentType, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data: publicData } = client.storage.from('avatars').getPublicUrl(path)

  return NextResponse.json({ url: publicData.publicUrl })
}
