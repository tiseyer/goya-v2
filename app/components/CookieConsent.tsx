'use client';

import { useEffect, useState, useRef } from 'react';
import { Cookie, ChevronDown, ChevronRight, X, Shield, Info, Lock } from 'lucide-react';
import { useCookieConsent } from '@/app/context/CookieConsentContext';
import { COOKIE_CATEGORIES, type CookieCategoryId } from '@/lib/cookies/config';
import { cn } from '@/lib/cn';

// ─── Routes where cookie UI should NOT appear ──────────────────────────────────
const EXCLUDED_PREFIXES = [
  '/admin',
  '/sign-in',
  '/sign-up',
  '/register',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/maintenance',
];

function isExcludedRoute(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

// ─── Tab type ──────────────────────────────────────────────────────────────────
type DetailTab = 'consent' | 'details' | 'about';

// ─── Main export: renders banner + detail panel + floating button ───────────────
export default function CookieConsent() {
  const {
    hasConsented,
    consent,
    updateConsent,
    detailOpen,
    openDetail,
    closeDetail,
  } = useCookieConsent();

  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  if (!pathname || isExcludedRoute(pathname)) return null;

  return (
    <>
      {/* Banner: show when user hasn't consented yet and detail panel is not open */}
      {!hasConsented && !detailOpen && <Banner />}

      {/* Detail panel */}
      {detailOpen && (
        <DetailPanel
          consent={consent}
          onSave={updateConsent}
          onClose={closeDetail}
        />
      )}

      {/* Floating button: show after user has consented OR when detail panel is closed */}
      {hasConsented && !detailOpen && <FloatingButton onClick={openDetail} />}
    </>
  );
}

// ─── Banner ────────────────────────────────────────────────────────────────────
function Banner() {
  const { updateConsent } = useCookieConsent();
  const { openDetail } = useCookieConsent();

  const deny = () =>
    updateConsent({ preferences: false, statistics: false, marketing: false });
  const allowAll = () =>
    updateConsent({ preferences: true, statistics: true, marketing: true });

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] w-[calc(100%-2rem)] max-w-lg animate-fade-in">
      <div className="bg-white dark:bg-[var(--goya-surface)] border border-goya-border rounded-2xl shadow-elevated p-5">
        <div className="flex items-start gap-3 mb-3">
          <Cookie className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              We use cookies
            </h3>
            <p className="text-xs text-foreground-secondary mt-1 leading-relaxed">
              We use cookies to improve your experience and analyze site usage.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={deny}
            className="flex-1 h-9 px-4 text-sm font-semibold rounded-xl border border-goya-border text-foreground-secondary bg-white dark:bg-[var(--background-secondary)] hover:bg-slate-50 dark:hover:bg-[var(--background-tertiary)] transition-colors cursor-pointer"
          >
            Deny
          </button>
          <button
            onClick={openDetail}
            className="flex-1 h-9 px-4 text-sm font-semibold rounded-xl border border-primary/25 text-primary hover:border-primary/40 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            Customize
          </button>
          <button
            onClick={allowAll}
            className="flex-1 h-9 px-4 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark shadow-soft transition-colors cursor-pointer"
          >
            Allow all
          </button>
        </div>

        {/* Privacy link */}
        <p className="text-[11px] text-foreground-tertiary mt-3 text-center">
          Learn more in our{' '}
          <a
            href="/privacy"
            className="underline hover:text-primary transition-colors"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Floating Button ───────────────────────────────────────────────────────────
function FloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Cookie Settings"
      title="Cookie Settings"
      className={cn(
        'fixed bottom-6 left-6 z-[9998]',
        'w-12 h-12 rounded-full',
        'bg-primary text-white shadow-elevated',
        'hover:bg-primary-dark hover:shadow-card hover:scale-105',
        'active:scale-95 transition-all duration-200',
        'flex items-center justify-center',
        'cursor-pointer',
        'animate-fade-in',
      )}
    >
      <Cookie className="w-5 h-5" />
    </button>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({
  consent,
  onSave,
  onClose,
}: {
  consent: { preferences: boolean; statistics: boolean; marketing: boolean };
  onSave: (c: {
    preferences: boolean;
    statistics: boolean;
    marketing: boolean;
  }) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>('consent');
  const [local, setLocal] = useState({
    preferences: consent.preferences,
    statistics: consent.statistics,
    marketing: consent.marketing,
  });
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id: CookieCategoryId) => {
    if (id === 'necessary') return;
    setLocal((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  const denyAll = () =>
    onSave({ preferences: false, statistics: false, marketing: false });
  const allowSelection = () => onSave(local);
  const allowAll = () =>
    onSave({ preferences: true, statistics: true, marketing: true });

  const TABS: { key: DetailTab; label: string }[] = [
    { key: 'consent', label: 'Consent' },
    { key: 'details', label: 'Details' },
    { key: 'about', label: 'About' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Cookie Settings"
        className={cn(
          'fixed z-[9999] bg-white dark:bg-[var(--goya-surface)] border border-goya-border shadow-elevated',
          // Desktop: centered card
          'bottom-0 left-0 right-0 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'w-full md:max-w-xl md:rounded-2xl rounded-t-2xl',
          'max-h-[85vh] md:max-h-[80vh] flex flex-col',
          'animate-fade-in',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Cookie Settings</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--background-tertiary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-foreground-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-[var(--background-tertiary)] rounded-lg p-1 mx-5 mb-4 w-fit shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer',
                tab === t.key
                  ? 'bg-white dark:bg-[var(--goya-surface)] text-foreground shadow-sm'
                  : 'text-foreground-tertiary hover:text-foreground-secondary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {tab === 'consent' && (
            <ConsentTab local={local} toggle={toggle} />
          )}
          {tab === 'details' && <DetailsTab local={local} toggle={toggle} />}
          {tab === 'about' && <AboutTab />}
        </div>

        {/* Action buttons — always visible */}
        <div className="flex gap-2 px-5 py-4 border-t border-goya-border shrink-0">
          <button
            onClick={denyAll}
            className="flex-1 h-10 px-4 text-sm font-semibold rounded-xl border border-goya-border text-foreground-secondary bg-white dark:bg-[var(--background-secondary)] hover:bg-slate-50 dark:hover:bg-[var(--background-tertiary)] transition-colors cursor-pointer"
          >
            Deny
          </button>
          <button
            onClick={allowSelection}
            className="flex-1 h-10 px-4 text-sm font-semibold rounded-xl border border-primary/25 text-primary hover:border-primary/40 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            Allow selection
          </button>
          <button
            onClick={allowAll}
            className="flex-1 h-10 px-4 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark shadow-soft transition-colors cursor-pointer"
          >
            Allow all
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Consent Tab ───────────────────────────────────────────────────────────────
function ConsentTab({
  local,
  toggle,
}: {
  local: Record<string, boolean>;
  toggle: (id: CookieCategoryId) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-foreground-secondary leading-relaxed mb-4">
        We use cookies to ensure the basic functionalities of the website, to
        enhance your experience, and to analyze site usage. You can choose which
        categories to allow below.
      </p>

      {COOKIE_CATEGORIES.map((cat) => {
        const checked = cat.required || (local[cat.id] ?? false);
        return (
          <div
            key={cat.id}
            className="flex items-start gap-3 py-3 border-b border-goya-border-muted last:border-0"
          >
            {/* Toggle */}
            <button
              onClick={() => toggle(cat.id)}
              disabled={cat.required}
              aria-label={`${checked ? 'Disable' : 'Enable'} ${cat.name} cookies`}
              className={cn(
                'relative mt-0.5 w-10 h-[22px] rounded-full shrink-0 transition-colors duration-200',
                checked
                  ? 'bg-primary'
                  : 'bg-slate-300 dark:bg-[var(--foreground-tertiary)]',
                cat.required
                  ? 'opacity-70 cursor-not-allowed'
                  : 'cursor-pointer',
              )}
            >
              <span
                className={cn(
                  'absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200',
                  checked ? 'left-[20px]' : 'left-[2px]',
                )}
              />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  {cat.name}
                </span>
                {cat.required && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-foreground-tertiary">
                    <Lock className="w-3 h-3" />
                    Always on
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed mt-0.5">
                {cat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Details Tab (Accordion) ───────────────────────────────────────────────────
function DetailsTab({
  local,
  toggle,
}: {
  local: Record<string, boolean>;
  toggle: (id: CookieCategoryId) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      {COOKIE_CATEGORIES.map((cat) => {
        const isOpen = expanded === cat.id;
        const checked = cat.required || (local[cat.id] ?? false);
        return (
          <div
            key={cat.id}
            className="border border-goya-border-muted rounded-xl overflow-hidden"
          >
            {/* Accordion header */}
            <button
              onClick={() => setExpanded(isOpen ? null : cat.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-[var(--background-secondary)] transition-colors cursor-pointer"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-foreground-tertiary shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-foreground-tertiary shrink-0" />
              )}
              <span className="text-sm font-semibold text-foreground flex-1">
                {cat.name}
              </span>
              <span className="text-xs text-foreground-tertiary mr-2">
                {cat.cookies.length} cookie{cat.cookies.length !== 1 ? 's' : ''}
              </span>

              {/* Toggle */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(cat.id);
                }}
                role="switch"
                aria-checked={checked}
                aria-label={`${checked ? 'Disable' : 'Enable'} ${cat.name} cookies`}
                className={cn(
                  'relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200',
                  checked
                    ? 'bg-primary'
                    : 'bg-slate-300 dark:bg-[var(--foreground-tertiary)]',
                  cat.required
                    ? 'opacity-70 cursor-not-allowed pointer-events-none'
                    : 'cursor-pointer',
                )}
              >
                <span
                  className={cn(
                    'absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                    checked ? 'left-[18px]' : 'left-[2px]',
                  )}
                />
              </div>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="px-4 pb-3 border-t border-goya-border-muted">
                <table className="w-full text-xs mt-2">
                  <thead>
                    <tr className="text-foreground-tertiary">
                      <th className="text-left font-medium pb-2 pr-3">Name</th>
                      <th className="text-left font-medium pb-2 pr-3">Purpose</th>
                      <th className="text-left font-medium pb-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.cookies.map((c) => (
                      <tr
                        key={c.name}
                        className="border-t border-goya-border-muted"
                      >
                        <td className="py-2 pr-3 font-mono text-foreground whitespace-nowrap">
                          {c.name}
                        </td>
                        <td className="py-2 pr-3 text-foreground-secondary leading-relaxed">
                          {c.purpose}
                        </td>
                        <td className="py-2 text-foreground-tertiary whitespace-nowrap">
                          {c.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── About Tab ─────────────────────────────────────────────────────────────────
function AboutTab() {
  return (
    <div className="space-y-4 text-sm text-foreground-secondary leading-relaxed">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-foreground mb-1">What are cookies?</h4>
          <p>
            Cookies are small text files that are stored on your computer or
            mobile device when you visit a website. They are widely used to make
            websites work more efficiently and to provide information to the
            website owners.
          </p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-foreground mb-1">How we use cookies</h4>
        <p>
          GOYA uses cookies for essential website functionality (like keeping you
          signed in), remembering your preferences, analyzing how our site is
          used, and occasionally for marketing purposes. You can control which
          categories of cookies you allow using the Consent tab.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-foreground mb-1">Your rights</h4>
        <p>
          Under GDPR and CASL, you have the right to withdraw your consent at
          any time. You can change your cookie preferences by clicking the cookie
          icon in the bottom-left corner of the page.
        </p>
      </div>

      <div className="pt-2 border-t border-goya-border-muted">
        <h4 className="font-semibold text-foreground mb-2">More information</h4>
        <ul className="space-y-1">
          <li>
            <a
              href="/privacy"
              className="text-primary hover:underline transition-colors"
            >
              Privacy Policy
            </a>
          </li>
          <li>
            <a
              href="/terms"
              className="text-primary hover:underline transition-colors"
            >
              Terms of Use
            </a>
          </li>
        </ul>
        <p className="text-xs text-foreground-tertiary mt-3">
          GOYA — Global Online Yoga Association
          <br />
          For questions about our cookie policy, contact us at{' '}
          <a
            href="mailto:info@goya.community"
            className="text-primary hover:underline"
          >
            info@goya.community
          </a>
        </p>
      </div>
    </div>
  );
}
