import {
  CONSENT_COOKIE_NAME,
  CONSENT_COOKIE_MAX_AGE,
  CONSENT_VERSION,
} from './config';

export interface ConsentState {
  version: string;
  timestamp: string;
  necessary: true; // Always true
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
}

/** Default state: only necessary cookies, nothing else. */
export const DEFAULT_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  timestamp: new Date().toISOString(),
  necessary: true,
  preferences: false,
  statistics: false,
  marketing: false,
};

/** Read the consent cookie. Returns null if missing or version mismatch. */
export function readConsent(): ConsentState | null {
  if (typeof document === 'undefined') return null;
  try {
    const raw = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));
    if (!raw) return null;
    const json = decodeURIComponent(raw.split('=').slice(1).join('='));
    const parsed: ConsentState = JSON.parse(json);
    // If the stored version doesn't match current, treat as no consent
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Write consent to the cookie. */
export function writeConsent(state: ConsentState): void {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(JSON.stringify(state));
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Build a consent state object from category booleans. */
export function buildConsent(categories: {
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
}): ConsentState {
  return {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    necessary: true,
    ...categories,
  };
}
