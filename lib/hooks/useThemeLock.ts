import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ThemeLockState {
  lock: string | null // null = unlocked, 'light' or 'dark' = forced
  loading: boolean
}

let cachedLock: string | null | undefined = undefined
let cacheExpires = 0

export function useThemeLock(): ThemeLockState {
  const [lock, setLock] = useState<string | null>(cachedLock ?? null)
  const [loading, setLoading] = useState(cachedLock === undefined)

  useEffect(() => {
    const now = Date.now()
    if (cachedLock !== undefined && now < cacheExpires) {
      setLock(cachedLock)
      setLoading(false)
      return
    }

    async function fetch() {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'theme_lock')
        .single()

      const val = data?.value && (data.value === 'light' || data.value === 'dark')
        ? data.value
        : null

      cachedLock = val
      cacheExpires = Date.now() + 60_000
      setLock(val)
      setLoading(false)
    }

    fetch()
  }, [])

  return { lock, loading }
}
