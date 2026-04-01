// lib/media/register.ts
// Server-only. Uses service role so inserts bypass RLS.
// Do NOT import from client components.

import { getSupabaseService } from '@/lib/supabase/service'

export interface RegisterMediaItemInput {
  bucket: string
  folder?: string | null       // media_folders.id UUID or null
  fileName: string             // original file name e.g. "profile.jpg"
  filePath: string             // storage path e.g. "userId/1234567890.jpg"
  fileUrl: string              // public URL returned by getPublicUrl()
  fileType: string             // MIME type e.g. "image/jpeg"
  fileSize?: number | null     // bytes
  width?: number | null        // pixels, images only
  height?: number | null
  uploadedBy: string           // auth user UUID
  uploadedByRole?: string | null  // snapshot of role at time of upload
}

/**
 * Inserts a row into media_items after a successful storage upload.
 * Non-throwing: logs errors but does not fail the calling operation.
 * Callers should not await this if they want fire-and-forget behaviour,
 * but should await it if they need the returned ID.
 */
export async function registerMediaItem(
  input: RegisterMediaItemInput
): Promise<string | null> {
  try {
    const supabase = getSupabaseService()
    const { data, error } = await supabase
      .from('media_items')
      .insert({
        bucket:           input.bucket,
        folder:           input.folder ?? null,
        file_name:        input.fileName,
        file_path:        input.filePath,
        file_url:         input.fileUrl,
        file_type:        input.fileType,
        file_size:        input.fileSize ?? null,
        width:            input.width ?? null,
        height:           input.height ?? null,
        uploaded_by:      input.uploadedBy,
        uploaded_by_role: input.uploadedByRole ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[registerMediaItem] insert error:', error.message)
      return null
    }
    return data.id
  } catch (err) {
    console.error('[registerMediaItem] unexpected error:', err)
    return null
  }
}
