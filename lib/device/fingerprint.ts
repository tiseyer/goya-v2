/**
 * Generates a stable device fingerprint using SHA-256.
 * Inputs: screen width, height, color depth, timezone, language.
 * User-Agent is EXCLUDED — it changes on every Chrome release (~6 weeks)
 * and would cause mass re-verification storms.
 */
export async function getDeviceFingerprint(): Promise<string> {
  const raw = [
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ].join('|')

  const encoded = new TextEncoder().encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
