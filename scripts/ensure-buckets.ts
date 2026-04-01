import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

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

interface BucketConfig {
  name: string
  public: boolean
}

const BUCKETS: BucketConfig[] = [
  { name: 'avatars', public: true },
  { name: 'uploads', public: true },
  { name: 'school-documents', public: false },
]

async function main() {
  let created = 0
  let existing = 0
  let failed = 0

  for (const bucket of BUCKETS) {
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
    })

    if (!error) {
      console.log(`Created bucket '${bucket.name}' (public: ${bucket.public})`)
      created++
    } else if (error.message.includes('already exists')) {
      console.log(`Bucket '${bucket.name}' already exists`)
      existing++
    } else {
      console.error(`Failed to create bucket '${bucket.name}': ${error.message}`)
      failed++
    }
  }

  console.log(`\nDone. ${created} created, ${existing} already existed, ${failed} failed.`)

  if (failed > 0) {
    process.exit(1)
  }
}

main()
