import { NextResponse } from 'next/server'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = file.type || 'image/jpeg'
  const path = `${user.id}/${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, { contentType, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)

  return NextResponse.json({ url: publicData.publicUrl })
}
