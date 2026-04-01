/**
 * GA4 event tracking utility.
 *
 * All Analytics.* calls are safe to invoke from any client component — they
 * no-op silently when window.gtag is not available (SSR, consent blocked, etc.)
 */

// ─── Core helper ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, params?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params)
    }
  } catch {
    // Analytics must never break the app
  }
}

// ─── Predefined events ────────────────────────────────────────────────────────

export const Analytics = {

  // ── Auth ──────────────────────────────────────────────────────────────────

  signUp: (method: string) =>
    trackEvent('sign_up', { method }),

  login: (method: string) =>
    trackEvent('login', { method }),

  // ── Onboarding ────────────────────────────────────────────────────────────

  onboardingStarted: (role: string) =>
    trackEvent('onboarding_started', { role }),

  onboardingCompleted: (role: string) =>
    trackEvent('onboarding_completed', { role }),

  // ── Shop / Payments ───────────────────────────────────────────────────────

  addToCart: (itemId: string, itemName: string, price: number) =>
    trackEvent('add_to_cart', {
      item_id: itemId,
      item_name: itemName,
      value: price,
      currency: 'EUR',
    }),

  beginCheckout: (value: number, items: unknown[]) =>
    trackEvent('begin_checkout', { value, currency: 'EUR', items }),

  purchase: (transactionId: string, value: number, items: unknown[]) =>
    trackEvent('purchase', {
      transaction_id: transactionId,
      value,
      currency: 'EUR',
      items,
    }),

  // ── School ────────────────────────────────────────────────────────────────

  schoolRegistrationStarted: () =>
    trackEvent('school_registration_started'),

  schoolRegistrationCompleted: (schoolName: string) =>
    trackEvent('school_registration_completed', { school_name: schoolName }),

  // ── Designations / Add-ons ────────────────────────────────────────────────

  designationViewed: (designationCode: string) =>
    trackEvent('designation_viewed', { designation_code: designationCode }),

  designationPurchased: (designationCode: string, value: number) =>
    trackEvent('designation_purchased', {
      designation_code: designationCode,
      value,
      currency: 'EUR',
    }),

  // ── Content ───────────────────────────────────────────────────────────────

  eventViewed: (eventId: string, eventName: string) =>
    trackEvent('event_viewed', { event_id: eventId, event_name: eventName }),

  courseViewed: (courseId: string, courseName: string) =>
    trackEvent('course_viewed', { course_id: courseId, course_name: courseName }),

  courseEnrolled: (courseId: string, courseName: string) =>
    trackEvent('course_enrolled', { course_id: courseId, course_name: courseName }),

  courseCompleted: (courseId: string, courseName: string) =>
    trackEvent('course_completed', { course_id: courseId, course_name: courseName }),

  // ── Profile ───────────────────────────────────────────────────────────────

  profileUpdated: () =>
    trackEvent('profile_updated'),

  avatarUploaded: () =>
    trackEvent('avatar_uploaded'),

  // ── Connections ───────────────────────────────────────────────────────────

  connectionRequested: () =>
    trackEvent('connection_requested'),

  connectionAccepted: () =>
    trackEvent('connection_accepted'),

  // ── Search ────────────────────────────────────────────────────────────────

  search: (query: string, resultsCount: number) =>
    trackEvent('search', { search_term: query, results_count: resultsCount }),
}
