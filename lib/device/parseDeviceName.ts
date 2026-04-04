/**
 * Parses navigator.userAgent into a human-readable device name.
 * Format: "Browser on OS" — e.g., "Chrome on macOS", "Safari on iOS".
 * Used for admin display in the trusted devices list.
 */
export function parseDeviceName(ua?: string): string {
  const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  if (!userAgent) return 'Unknown Device'

  // Detect browser
  let browser = 'Unknown Browser'
  if (userAgent.includes('Firefox/')) browser = 'Firefox'
  else if (userAgent.includes('Edg/')) browser = 'Edge'
  else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) browser = 'Opera'
  else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) browser = 'Chrome'
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari'

  // Detect OS
  let os = 'Unknown OS'
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) os = 'macOS'
  else if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('CrOS')) os = 'ChromeOS'

  return `${browser} on ${os}`
}
