/**
 * Client-side analytics tracking helpers for GA4 and Microsoft Clarity.
 *
 * All functions are safe to call even if gtag/clarity are not loaded
 * (consent not given, script blocked, SSR context).
 */

// ─── Type declarations ───────────────────────────────────────────────────────

type GtagCommand = 'config' | 'event' | 'set' | 'js';

interface GtagEventParams {
  [key: string]: string | number | boolean | undefined | Array<Record<string, string | number>>;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    clarity?: (command: string, ...args: (string | boolean)[]) => void;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeGtag(command: GtagCommand, targetOrAction: string, params?: GtagEventParams) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag(command, targetOrAction, params);
    }
  } catch {
    // Analytics must never break the app
  }
}

function safeClarity(command: string, ...args: (string | boolean)[]) {
  try {
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      window.clarity(command, ...args);
    }
  } catch {
    // Analytics must never break the app
  }
}

// ─── GA4 Page Tracking ───────────────────────────────────────────────────────

/** Fire a GA4 page_view event — call on every App Router navigation */
export function trackPageView(url: string) {
  safeGtag('event', 'page_view', {
    page_path: url,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
  });
}

// ─── User Properties ─────────────────────────────────────────────────────────

interface UserProperties {
  user_role: string;
  membership_status: 'member' | 'guest';
  has_subscription: boolean;
  designation: string;
}

/** Set GA4 user properties after login */
export function setGA4UserProperties(props: UserProperties) {
  safeGtag('set', 'user_properties', {
    user_role: props.user_role,
    membership_status: props.membership_status,
    has_subscription: props.has_subscription ? 'true' : 'false',
    designation: props.designation,
  });
}

/** Set Clarity custom tags after login */
export function setClarityUserTags(props: Pick<UserProperties, 'user_role' | 'membership_status' | 'has_subscription'>) {
  safeClarity('set', 'role', props.user_role);
  safeClarity('set', 'membership', props.membership_status);
  safeClarity('set', 'has_subscription', props.has_subscription ? 'true' : 'false');
}

// ─── Conversion Events ───────────────────────────────────────────────────────

export function trackSignUp() {
  safeGtag('event', 'sign_up', { method: 'email' });
}

export function trackOnboardingComplete() {
  safeGtag('event', 'onboarding_complete', {});
}

export function trackPurchase(params: {
  value: number;
  currency?: string;
  items: Array<{ item_name: string; item_category: string }>;
}) {
  safeGtag('event', 'purchase', {
    value: params.value,
    currency: params.currency ?? 'EUR',
    items: params.items,
  });
}

export function trackTeacherUpgrade() {
  safeGtag('event', 'teacher_upgrade', {});
  safeClarity('event', 'upgrade_clicked');
}

// ─── Engagement Events ───────────────────────────────────────────────────────

export function trackProfileUpdated() {
  safeGtag('event', 'profile_updated', {});
  safeClarity('event', 'profile_edit_saved');
}

export function trackPostCreated() {
  safeGtag('event', 'post_created', {});
}

export function trackMessageSent() {
  safeGtag('event', 'message_sent', {});
}

export function trackCourseStarted(courseName: string) {
  safeGtag('event', 'course_started', { course_name: courseName });
}

export function trackCourseCompleted(courseName: string) {
  safeGtag('event', 'course_completed', { course_name: courseName });
}

export function trackEventRegistered(eventName: string) {
  safeGtag('event', 'event_registered', { event_name: eventName });
}

export function trackCreditsSubmitted() {
  safeGtag('event', 'credits_submitted', {});
}

export function trackMemberSearch(params: { role_filter: string; has_designation_filter: boolean }) {
  safeGtag('event', 'member_search', {
    role_filter: params.role_filter,
    has_designation_filter: params.has_designation_filter ? 'true' : 'false',
  });
}

// ─── Clarity Smart Events ────────────────────────────────────────────────────

export function trackCheckoutInitiated() {
  safeClarity('event', 'checkout_initiated');
}
