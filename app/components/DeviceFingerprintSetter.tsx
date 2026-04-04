'use client'

import { useEffect } from 'react'
import { getDeviceFingerprint } from '@/lib/device/fingerprint'
import { parseDeviceName } from '@/lib/device/parseDeviceName'

const COOKIE_NAME = 'goya_device_fp'
const DEVICE_NAME_COOKIE = 'goya_device_name'
const MAX_AGE = 365 * 24 * 60 * 60 // 365 days in seconds
const SECURE = process.env.NODE_ENV === 'production' ? '; Secure' : ''

/**
 * Sets the device fingerprint and device name cookies on every page load.
 * - goya_device_fp: SHA-256 hash of screen dimensions + timezone + language (NO userAgent)
 * - goya_device_name: human-readable "Browser on OS" parsed from userAgent
 *
 * Both cookies: SameSite=Lax, httpOnly=false, 365-day maxAge.
 * httpOnly=false is required — the fingerprint must be readable by client JS
 * and sent with the /auth/callback redirect (SameSite=Lax allows this).
 *
 * Only writes fingerprint cookie if absent to avoid unnecessary rewrites.
 */
export function DeviceFingerprintSetter() {
  useEffect(() => {
    const existingFp = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${COOKIE_NAME}=`))

    if (!existingFp) {
      getDeviceFingerprint().then(fp => {
        document.cookie = `${COOKIE_NAME}=${fp}; path=/; max-age=${MAX_AGE}; SameSite=Lax${SECURE}`
      })
    }

    // Always update device name (it can change with browser updates, which is fine for display)
    const deviceName = parseDeviceName()
    document.cookie = `${DEVICE_NAME_COOKIE}=${encodeURIComponent(deviceName)}; path=/; max-age=${MAX_AGE}; SameSite=Lax${SECURE}`
  }, [])

  return null // No visible UI
}
