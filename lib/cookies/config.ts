/**
 * Cookie Consent Configuration — GOYA v2
 *
 * GDPR / CASL-compliant cookie consent system.
 *
 * HOW TO ADD A NEW COOKIE:
 *   1. Find the appropriate category below (necessary, preferences, statistics, marketing)
 *   2. Add a new entry to the `cookies` array with name, purpose, and duration
 *   3. Deploy — the banner will show updated info automatically
 *
 * HOW TO RE-ASK ALL USERS FOR CONSENT:
 *   1. Bump CONSENT_VERSION below (e.g. "1.0" → "1.1")
 *   2. Deploy — all users will see the consent banner again
 */

// Bump this to invalidate all existing consent and re-prompt users.
export const CONSENT_VERSION = '1.0';

// Cookie name used to store consent preferences.
export const CONSENT_COOKIE_NAME = 'goya_cookie_consent';

// Max age for the consent cookie: 365 days.
export const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export type CookieCategoryId = 'necessary' | 'preferences' | 'statistics' | 'marketing';

export interface CookieEntry {
  name: string;
  purpose: string;
  duration: string;
}

export interface CookieCategory {
  id: CookieCategoryId;
  name: string;
  description: string;
  required: boolean; // If true, always enabled, toggle locked
  cookies: CookieEntry[];
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'necessary',
    name: 'Necessary',
    description:
      'Necessary cookies help make the website usable by enabling basic functions like page navigation, secure access, and session management. The website cannot function properly without these cookies.',
    required: true,
    cookies: [
      {
        name: 'sb-*-auth-token',
        purpose: 'Supabase authentication session — keeps you signed in',
        duration: 'Session / 1 year',
      },
      {
        name: CONSENT_COOKIE_NAME,
        purpose: 'Stores your cookie consent preferences',
        duration: '1 year',
      },
      {
        name: 'goya_impersonating',
        purpose: 'Admin impersonation session (admin only)',
        duration: 'Session',
      },
    ],
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description:
      'Preference cookies enable the website to remember information that changes the way the website behaves or looks, like your preferred language, theme, or UI settings.',
    required: false,
    cookies: [
      {
        name: 'theme',
        purpose: 'Remembers your light/dark mode preference',
        duration: '1 year',
      },
      {
        name: 'sidebar-collapsed',
        purpose: 'Remembers sidebar collapse state',
        duration: 'Persistent',
      },
      {
        name: 'chat-widget-state',
        purpose: 'Remembers if the chat widget was open or closed',
        duration: 'Session',
      },
    ],
  },
  {
    id: 'statistics',
    name: 'Statistics',
    description:
      'Statistic cookies help website owners understand how visitors interact with the website by collecting and reporting information anonymously.',
    required: false,
    cookies: [
      {
        name: '_ga / _ga_*',
        purpose: 'Google Analytics 4 — tracks page views and user interactions',
        duration: '2 years',
      },
      {
        name: '_clck / _clsk',
        purpose: 'Microsoft Clarity — records anonymous session replays and heatmaps',
        duration: '1 year / Session',
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description:
      'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.',
    required: false,
    cookies: [
      {
        name: '_fbp / _fbc',
        purpose: 'Meta Pixel — measures ad performance and enables retargeting',
        duration: '90 days',
      },
    ],
  },
];
