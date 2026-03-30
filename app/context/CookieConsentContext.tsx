'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  readConsent,
  writeConsent,
  buildConsent,
  DEFAULT_CONSENT,
  type ConsentState,
} from '@/lib/cookies/consent';

interface CookieConsentContextValue {
  /** Whether the user has made a consent choice (banner can be hidden). */
  hasConsented: boolean;
  /** Current consent state. */
  consent: ConsentState;
  /** Category-level booleans for quick access. */
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
  /** Update consent with new category selections. */
  updateConsent: (categories: {
    preferences: boolean;
    statistics: boolean;
    marketing: boolean;
  }) => void;
  /** Whether the detail panel is open. */
  detailOpen: boolean;
  /** Open the detail panel. */
  openDetail: () => void;
  /** Close the detail panel. */
  closeDetail: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read consent on mount
  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setConsent(existing);
      setHasConsented(true);
    } else {
      setConsent(DEFAULT_CONSENT);
      setHasConsented(false);
    }
    setMounted(true);
  }, []);

  const updateConsent = useCallback(
    (categories: {
      preferences: boolean;
      statistics: boolean;
      marketing: boolean;
    }) => {
      const newConsent = buildConsent(categories);
      writeConsent(newConsent);
      setConsent(newConsent);
      setHasConsented(true);
      setDetailOpen(false);

      // Sync to Supabase for logged-in users (fire-and-forget)
      fetch('/api/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConsent),
      }).catch(() => {
        // Silently fail — cookie is the primary store
      });
    },
    [],
  );

  const openDetail = useCallback(() => setDetailOpen(true), []);
  const closeDetail = useCallback(() => setDetailOpen(false), []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      hasConsented,
      consent: consent ?? DEFAULT_CONSENT,
      preferences: consent?.preferences ?? false,
      statistics: consent?.statistics ?? false,
      marketing: consent?.marketing ?? false,
      updateConsent,
      detailOpen,
      openDetail,
      closeDetail,
    }),
    [hasConsented, consent, updateConsent, detailOpen, openDetail, closeDetail],
  );

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) return <>{children}</>;

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    // Fallback for components outside the provider (e.g. admin routes)
    return {
      hasConsented: true,
      consent: DEFAULT_CONSENT,
      preferences: false,
      statistics: false,
      marketing: false,
      updateConsent: () => {},
      detailOpen: false,
      openDetail: () => {},
      closeDetail: () => {},
    };
  }
  return ctx;
}
