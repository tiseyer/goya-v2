import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Try loading from project root (works both in main repo and worktrees)
config({ path: resolve(process.cwd(), '.env.local') })
// Also try relative to script dir (fallback)
config({ path: resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const isDryRun = process.argv.includes('--dry-run')

if (isDryRun) {
  console.log('[DRY RUN] No uploads, inserts, or updates will be performed.\n')
}

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

function getExtFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  }
  return map[contentType.split(';')[0].trim()] ?? 'jpg'
}

function getExtFromUrl(url: string): string {
  const match = url.split('?')[0].match(/\.(\w+)$/)
  return match ? match[1].toLowerCase() : 'jpg'
}

interface Profile {
  id: string
  avatar_url: string
}

async function migrateAvatars(): Promise<{ migrated: number; failed: number; skipped: number }> {
  console.log('=== Migrating WordPress Avatar URLs ===\n')

  let migrated = 0
  let failed = 0
  let skipped = 0
  const batchSize = 50

  while (true) {
    // Always query from offset 0: migrated profiles drop out of the WHERE filter,
    // so the next batch automatically starts with the first unmigrated profile.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .like('avatar_url', '%members.globalonlineyogaassociation.org%')
      .range(0, batchSize - 1)

    if (error) {
      console.error('Error querying profiles:', error.message)
      break
    }

    if (!profiles || profiles.length === 0) {
      if (migrated === 0 && failed === 0) {
        console.log('No profiles with WordPress avatar URLs found.\n')
      }
      break
    }

    console.log(`Processing batch: ${profiles.length} profiles (${migrated + failed + skipped} processed so far)`)

    for (const profile of profiles as Profile[]) {
      const { id: userId, avatar_url: oldUrl } = profile

      // Resumability: skip if already migrated to Supabase Storage
      if (oldUrl.includes(supabaseUrl)) {
        console.log(`  [SKIP] User ${userId}: already migrated`)
        skipped++
        continue
      }

      if (isDryRun) {
        console.log(`  [DRY RUN] Would migrate user ${userId}: ${oldUrl}`)
        migrated++
        continue
      }

      try {
        // Fetch image from WordPress
        const response = await fetch(oldUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} fetching ${oldUrl}`)
        }

        const contentType = response.headers.get('content-type') ?? ''
        const ext = contentType.startsWith('image/')
          ? getExtFromContentType(contentType)
          : getExtFromUrl(oldUrl)
        const mimeType = contentType.startsWith('image/')
          ? contentType.split(';')[0].trim()
          : inferMimeType(`file.${ext}`)

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const filePath = `${userId}/avatar.${ext}`

        // Upload to avatars bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        const newUrl = urlData.publicUrl

        // Update profile avatar_url
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: newUrl })
          .eq('id', userId)

        if (updateError) {
          throw new Error(`Profile update failed: ${updateError.message}`)
        }

        // Insert into media_items
        const { error: insertError } = await supabase.from('media_items').insert({
          bucket: 'avatars',
          folder: null,
          file_name: `avatar.${ext}`,
          file_path: filePath,
          file_url: newUrl,
          file_type: mimeType,
          file_size: buffer.length,
          uploaded_by: userId,
        })

        if (insertError) {
          // Non-fatal: log but don't fail the migration
          console.warn(`  [WARN] User ${userId}: media_items insert failed: ${insertError.message}`)
        }

        console.log(`  [OK] Migrated user ${userId}: ${oldUrl} -> ${newUrl}`)
        migrated++
      } catch (err) {
        console.error(`  [ERROR] User ${userId}: ${err instanceof Error ? err.message : String(err)}`)
        failed++
      }
    }

    if (profiles.length < batchSize) break
  }

  return { migrated, failed, skipped }
}

const LOGO_FILES = [
  'Favicon.png',
  'GOYA Logo Black.png',
  'GOYA Logo Blue.png',
  'GOYA Logo Short.png',
  'GOYA Logo White.png',
]

async function migrateLogos(): Promise<{ uploaded: number; skipped: number }> {
  console.log('=== Uploading GOYA Brand Logos ===\n')

  let uploaded = 0
  let skipped = 0

  for (const filename of LOGO_FILES) {
    const filePath = `brand/${filename}`

    // Resumability: check if already in media_items
    const { data: existing } = await supabase
      .from('media_items')
      .select('id')
      .eq('bucket', 'uploads')
      .eq('file_path', filePath)
      .maybeSingle()

    if (existing) {
      console.log(`  [SKIP] ${filename}: already in media_items`)
      skipped++
      continue
    }

    if (isDryRun) {
      console.log(`  [DRY RUN] Would upload ${filename} to uploads/brand/${filename}`)
      uploaded++
      continue
    }

    try {
      const localPath = resolve(process.cwd(), 'public', 'images', filename)
      const buffer = readFileSync(localPath)

      // Upload to uploads bucket
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, buffer, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      // Insert into media_items (folder is null — UUID FK, not text)
      const { error: insertError } = await supabase.from('media_items').insert({
        bucket: 'uploads',
        folder: null,
        file_name: filename,
        file_path: filePath,
        file_url: publicUrl,
        file_type: 'image/png',
        file_size: buffer.length,
        uploaded_by: null,
      })

      if (insertError) {
        throw new Error(`media_items insert failed: ${insertError.message}`)
      }

      console.log(`  [OK] Uploaded ${filename} -> ${publicUrl}`)
      uploaded++
    } catch (err) {
      console.error(`  [ERROR] ${filename}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { uploaded, skipped }
}

async function main() {
  console.log('Starting WordPress avatar migration...\n')

  const avatarStats = await migrateAvatars()
  console.log()
  const logoStats = await migrateLogos()

  console.log('\n=== Migration Summary ===')
  console.log(`Avatars: ${avatarStats.migrated} migrated, ${avatarStats.failed} failed, ${avatarStats.skipped} skipped`)
  console.log(`Logos:   ${logoStats.uploaded} uploaded, ${logoStats.skipped} skipped`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
