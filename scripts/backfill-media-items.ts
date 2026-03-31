import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKETS = [
  'avatars',
  'event-images',
  'school-logos',
  'upgrade-certificates',
  'uploads',
] as const

function inferMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
  }
  return mimeMap[ext] ?? 'application/octet-stream'
}

interface StorageObject {
  id: string | null
  name: string
  metadata?: { size?: number } | null
}

async function listFilesRecursively(
  bucket: string,
  folderPath: string,
): Promise<Array<{ filePath: string; name: string; size: number | null }>> {
  const results: Array<{ filePath: string; name: string; size: number | null }> = []

  let offset = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath, { limit, offset })

    if (error) {
      console.error(`  Error listing ${bucket}/${folderPath || '(root)'}:`, error.message)
      break
    }

    if (!data || data.length === 0) break

    for (const item of data as StorageObject[]) {
      // Skip Supabase placeholder files
      if (item.name === '.emptyFolderPlaceholder') continue

      const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name

      if (item.id === null) {
        // It's a folder — recurse
        const subFiles = await listFilesRecursively(bucket, itemPath)
        results.push(...subFiles)
      } else {
        // It's a file
        results.push({
          filePath: itemPath,
          name: item.name,
          size: item.metadata?.size ?? null,
        })
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return results
}

async function main() {
  console.log('Starting media_items backfill...\n')

  let totalInserted = 0

  for (const bucket of BUCKETS) {
    console.log(`[${bucket}] Scanning...`)

    // List all files in this bucket recursively
    const files = await listFilesRecursively(bucket, '')
    console.log(`[${bucket}] Found ${files.length} files`)

    if (files.length === 0) {
      console.log(`[${bucket}] Found 0 files, 0 already registered, 0 inserted\n`)
      continue
    }

    // Get existing file_paths for this bucket to deduplicate
    const { data: existingRows, error: existingError } = await supabase
      .from('media_items')
      .select('file_path')
      .eq('bucket', bucket)

    if (existingError) {
      console.error(`[${bucket}] Error fetching existing records:`, existingError.message)
      continue
    }

    const existingPaths = new Set((existingRows ?? []).map((r: { file_path: string }) => r.file_path))
    const alreadyRegistered = files.filter((f) => existingPaths.has(f.filePath)).length
    const newFiles = files.filter((f) => !existingPaths.has(f.filePath))

    if (newFiles.length === 0) {
      console.log(
        `[${bucket}] Found ${files.length} files, ${alreadyRegistered} already registered, 0 inserted\n`,
      )
      continue
    }

    // Build insert rows
    const rows = newFiles.map((f) => {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(f.filePath)
      return {
        bucket,
        file_name: f.name,
        file_path: f.filePath,
        file_url: urlData.publicUrl,
        file_type: inferMimeType(f.name),
        file_size: f.size,
        uploaded_by: null,
        folder: null,
      }
    })

    // Batch insert in chunks of 50
    const CHUNK_SIZE = 50
    let bucketInserted = 0

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE)
      const { error: insertError } = await supabase.from('media_items').insert(chunk)

      if (insertError) {
        console.error(`[${bucket}] Insert error (chunk ${Math.floor(i / CHUNK_SIZE) + 1}):`, insertError.message)
      } else {
        bucketInserted += chunk.length
      }
    }

    totalInserted += bucketInserted
    console.log(
      `[${bucket}] Found ${files.length} files, ${alreadyRegistered} already registered, ${bucketInserted} inserted\n`,
    )
  }

  console.log(`Backfill complete: ${totalInserted} total files inserted across all buckets`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
