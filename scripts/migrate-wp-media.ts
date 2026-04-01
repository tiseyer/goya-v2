/**
 * WordPress Media Library Migration Script
 *
 * Migrates all WordPress media items to Supabase Storage + media_items table.
 * Deduplicates via wp_media_id (partial unique index).
 *
 * Usage:
 *   npm run media:migrate-wp               # full run
 *   npm run media:migrate-wp -- --dry-run  # simulate, no writes
 *   npm run media:migrate-wp -- --resume   # continue from last completed page
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

// Load .env.local from project root (works in main repo and worktrees)
config({ path: resolve(process.cwd(), '.env.local') })
// Fallback: relative to script dir
config({ path: resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const isDryRun = process.argv.includes('--dry-run')
const isResume = process.argv.includes('--resume')

if (isDryRun) {
  console.log('[DRY RUN] No uploads, inserts, or updates will be performed.\n')
}

// ─── WordPress API Config ─────────────────────────────────────────────────────

const WP_BASE_URL = 'https://members.globalonlineyogaassociation.org'
const WP_AUTH_USER = 'WP-Media-Library-Migration'
const WP_AUTH_PASS = 'hUfe NTr9 tk1z sCcE qTnp CnvB'
const WP_AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_AUTH_USER}:${WP_AUTH_PASS}`).toString('base64')

// ─── Progress / Failure Tracking ─────────────────────────────────────────────

const STATE_DIR = resolve(process.cwd(), '.migration-state')
const PROGRESS_FILE = resolve(STATE_DIR, 'wp-media-progress.json')
const FAILURES_FILE = resolve(STATE_DIR, 'wp-media-failures.json')

interface ProgressState {
  lastCompletedPage: number
  totalProcessed: number
  totalSkipped: number
  totalFailed: number
  lastUpdated: string
}

interface FailureEntry {
  wp_media_id: number
  source_url: string
  error: string
  timestamp: string
}

function ensureStateDir() {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true })
  }
}

function readProgress(): ProgressState | null {
  if (!existsSync(PROGRESS_FILE)) return null
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8')) as ProgressState
  } catch {
    return null
  }
}

function writeProgress(state: ProgressState) {
  ensureStateDir()
  writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

function writeFailures(failures: FailureEntry[]) {
  ensureStateDir()
  writeFileSync(FAILURES_FILE, JSON.stringify(failures, null, 2), 'utf-8')
}

// ─── HTML Stripping ───────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

// ─── Mime-type to subfolder ───────────────────────────────────────────────────

function subfolderFromMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images/'
  if (mimeType.startsWith('video/')) return 'videos/'
  if (mimeType.startsWith('audio/')) return 'audio/'
  if (mimeType === 'application/pdf') return 'documents/'
  return 'other/'
}

// ─── Retry with Exponential Backoff ──────────────────────────────────────────

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      if (response.status >= 400 && response.status < 500) {
        // Client errors: don't retry
        throw new Error(`HTTP ${response.status} from ${url}`)
      }
      throw new Error(`HTTP ${response.status} from ${url}`)
    } catch (err) {
      if (attempt === retries - 1) throw err
      const delay = 1000 * Math.pow(2, attempt) // 1s, 2s, 4s
      console.log(`    [RETRY ${attempt + 1}/${retries - 1}] Waiting ${delay}ms before retry...`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error(`Exhausted retries for ${url}`)
}

// ─── WP User / Author Resolution ─────────────────────────────────────────────

// Cache: WP user ID -> email
const wpUserEmailCache = new Map<number, string>()
// Cache: email -> Supabase profile ID (null = not found)
const emailProfileCache = new Map<string, string | null>()

async function resolveUploadedBy(wpAuthorId: number): Promise<string | null> {
  if (wpAuthorId === 0) return null

  // Resolve WP user email
  let email: string
  if (wpUserEmailCache.has(wpAuthorId)) {
    email = wpUserEmailCache.get(wpAuthorId)!
  } else {
    try {
      const res = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/users/${wpAuthorId}`, {
        headers: { Authorization: WP_AUTH_HEADER },
      })
      if (!res.ok) {
        wpUserEmailCache.set(wpAuthorId, '')
        return null
      }
      const user = (await res.json()) as { email?: string }
      email = user.email ?? ''
      wpUserEmailCache.set(wpAuthorId, email)
    } catch {
      wpUserEmailCache.set(wpAuthorId, '')
      return null
    }
  }

  if (!email) return null

  // Resolve Supabase profile
  if (emailProfileCache.has(email)) {
    return emailProfileCache.get(email) ?? null
  }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  const profileId = data?.id ?? null
  emailProfileCache.set(email, profileId)
  return profileId
}

// ─── WordPress Media Item Shape ───────────────────────────────────────────────

interface WpMediaItem {
  id: number
  date: string
  source_url: string
  author: number
  mime_type: string
  alt_text: string
  caption: { rendered: string }
  title: { rendered: string }
  media_details: {
    width?: number
    height?: number
    filesize?: number
  }
}

// ─── Already-migrated ID Set ──────────────────────────────────────────────────

async function fetchAlreadyMigratedIds(): Promise<Set<number>> {
  const ids = new Set<number>()
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('media_items')
      .select('wp_media_id')
      .not('wp_media_id', 'is', null)
      .range(from, from + pageSize - 1)

    if (error) {
      console.warn('[WARN] Could not fetch already-migrated IDs:', error.message)
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      if (row.wp_media_id != null) ids.add(row.wp_media_id as number)
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  return ids
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== WordPress Media Library Migration ===\n')

  ensureStateDir()

  // Determine start page
  let startPage = 1
  let totalProcessed = 0
  let totalSkipped = 0
  let totalFailed = 0
  let totalUploaded = 0
  let skippedAlreadyExists = 0

  if (isResume) {
    const saved = readProgress()
    if (saved) {
      startPage = saved.lastCompletedPage + 1
      totalProcessed = saved.totalProcessed
      totalSkipped = saved.totalSkipped
      totalFailed = saved.totalFailed
      console.log(`[RESUME] Continuing from page ${startPage} (${totalProcessed} already processed)\n`)
    } else {
      console.log('[RESUME] No progress file found, starting from page 1\n')
    }
  }

  // Load already-migrated IDs for deduplication
  console.log('Fetching already-migrated wp_media_ids from media_items...')
  const alreadyMigrated = await fetchAlreadyMigratedIds()
  console.log(`  Found ${alreadyMigrated.size} already-migrated items\n`)

  // Load existing failures so we can append
  let failures: FailureEntry[] = []
  if (existsSync(FAILURES_FILE)) {
    try {
      failures = JSON.parse(readFileSync(FAILURES_FILE, 'utf-8')) as FailureEntry[]
    } catch {
      failures = []
    }
  }

  let currentPage = startPage
  let totalFound = 0

  while (true) {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/media?per_page=100&page=${currentPage}`
    console.log(`Fetching page ${currentPage}: ${url}`)

    let items: WpMediaItem[]
    try {
      const res = await fetch(url, {
        headers: { Authorization: WP_AUTH_HEADER },
      })

      // WP returns 400 on past-last-page
      if (res.status === 400 || res.status === 404) {
        console.log(`  Page ${currentPage}: end of results (HTTP ${res.status})`)
        break
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching page ${currentPage}`)
      }

      items = (await res.json()) as WpMediaItem[]
      if (!Array.isArray(items) || items.length === 0) {
        console.log(`  Page ${currentPage}: empty response, done.`)
        break
      }
    } catch (err) {
      console.error(`  [ERROR] Failed to fetch page ${currentPage}:`, err instanceof Error ? err.message : err)
      break
    }

    totalFound += items.length
    console.log(`  Page ${currentPage}: ${items.length} items`)

    for (const item of items) {
      const { id: wpId, source_url: sourceUrl, author, mime_type: mimeType, alt_text, caption, title, media_details, date } = item

      // Skip avatars
      if (sourceUrl.includes('wp-content/uploads/avatars/')) {
        console.log(`  [SKIP avatar] ID ${wpId}: ${sourceUrl}`)
        totalSkipped++
        continue
      }

      // Skip already-migrated (in-DB or from progress set)
      if (alreadyMigrated.has(wpId)) {
        console.log(`  [SKIP exists] ID ${wpId}: already in media_items`)
        skippedAlreadyExists++
        continue
      }

      if (isDryRun) {
        console.log(`  [DRY RUN] Would process ID ${wpId}: ${sourceUrl}`)
        totalProcessed++
        totalUploaded++
        alreadyMigrated.add(wpId)
        continue
      }

      try {
        // Resolve uploader
        const uploadedBy = await resolveUploadedBy(author)

        // Download file with retry
        const fileResponse = await fetchWithRetry(sourceUrl)
        const arrayBuffer = await fileResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Determine subfolder and storage path
        const subfolder = subfolderFromMime(mimeType)
        const originalFilename = sourceUrl.split('/').pop()?.split('?')[0] ?? `file_${wpId}`
        const storagePath = `wp-media/${subfolder}${wpId}_${originalFilename}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          })

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath)
        const fileUrl = urlData.publicUrl

        // Strip HTML from text fields
        const cleanTitle = stripHtml(title.rendered)
        const cleanCaption = stripHtml(caption.rendered)

        // Upsert into media_items
        const { error: upsertError } = await supabase.from('media_items').upsert(
          {
            bucket: 'media',
            folder: null,
            file_name: originalFilename,
            file_path: storagePath,
            file_url: fileUrl,
            file_type: mimeType,
            file_size: buffer.length,
            uploaded_by: uploadedBy,
            uploaded_by_role: null,
            alt_text: alt_text || null,
            caption: cleanCaption || null,
            title: cleanTitle || null,
            width: media_details.width ?? null,
            height: media_details.height ?? null,
            created_at: date,
            wp_media_id: wpId,
          },
          { onConflict: 'wp_media_id' }
        )

        if (upsertError) {
          throw new Error(`media_items upsert failed: ${upsertError.message}`)
        }

        console.log(`  [OK] ID ${wpId}: ${originalFilename} (${(buffer.length / 1024).toFixed(1)} KB)`)
        totalProcessed++
        totalUploaded++
        alreadyMigrated.add(wpId)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error(`  [ERROR] ID ${wpId}: ${errorMsg}`)

        failures.push({
          wp_media_id: wpId,
          source_url: sourceUrl,
          error: errorMsg,
          timestamp: new Date().toISOString(),
        })

        totalProcessed++
        totalFailed++
      }
    }

    // Write progress after each page
    writeProgress({
      lastCompletedPage: currentPage,
      totalProcessed,
      totalSkipped,
      totalFailed,
      lastUpdated: new Date().toISOString(),
    })
    writeFailures(failures)

    if (items.length < 100) {
      console.log(`  Page ${currentPage}: last page (fewer than 100 items), done.`)
      break
    }

    currentPage++

    // Rate limiting: 100ms between page fetches
    await new Promise((r) => setTimeout(r, 100))
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log('\n=== Migration Summary ===')
  console.log(`Total found on WP:        ${totalFound}`)
  console.log(`Uploaded to Supabase:     ${totalUploaded}`)
  console.log(`Skipped (avatars):        ${totalSkipped}`)
  console.log(`Skipped (already exists): ${skippedAlreadyExists}`)
  console.log(`Failed:                   ${totalFailed}`)

  if (failures.length > 0) {
    console.log(`\nFailures written to: ${FAILURES_FILE}`)
    console.log(`Re-run with --resume to retry failed pages, or inspect ${FAILURES_FILE} for individual failures.`)
  } else {
    console.log('\nNo failures. Migration complete.')
  }

  console.log(`\nProgress state: ${PROGRESS_FILE}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
