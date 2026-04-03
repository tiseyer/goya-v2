'use client';

import { type ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { HERO_VARIABLES, resolveHeroVariables, type HeroContext } from '@/lib/hero-variables';

interface PageHeroProps {
  pill?: string;
  pillIcon?: ReactNode;
  title: string;
  subtitle?: string;
  customPill?: ReactNode;
  variant?: 'light' | 'dark';
  // Edit mode props
  pageSlug?: string;
  isAdmin?: boolean;
  heroContext?: HeroContext;
}

export default function PageHero({
  pill,
  pillIcon,
  title,
  subtitle,
  customPill,
  variant = 'light',
  pageSlug,
  isAdmin,
  heroContext,
}: PageHeroProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Raw template strings from DB (null = use prop defaults as templates)
  const [rawPill, setRawPill] = useState<string | null>(null);
  const [rawTitle, setRawTitle] = useState<string | null>(null);
  const [rawSubtitle, setRawSubtitle] = useState<string | null>(null);

  // Snapshot for cancel
  const [savedPill, setSavedPill] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [savedSubtitle, setSavedSubtitle] = useState<string | null>(null);

  const [focusedField, setFocusedField] = useState<'pill' | 'title' | 'subtitle' | null>(null);

  const pillRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const subtitleRef = useRef<HTMLTextAreaElement>(null);

  // Fetch custom content on mount
  useEffect(() => {
    if (!pageSlug) return;
    fetch(`/api/page-hero/${pageSlug}`)
      .then(r => r.json())
      .then((data: { pill: string | null; title: string | null; subtitle: string | null }) => {
        if (data.pill !== null) { setRawPill(data.pill); setSavedPill(data.pill); }
        if (data.title !== null) { setRawTitle(data.title); setSavedTitle(data.title); }
        if (data.subtitle !== null) { setRawSubtitle(data.subtitle); setSavedSubtitle(data.subtitle); }
      })
      .catch(() => {/* silently use defaults */});
  }, [pageSlug]);

  // Template strings (raw with variables) — used in edit mode and as source for resolution
  const templatePill = rawPill ?? pill ?? '';
  const templateTitle = rawTitle ?? title;
  const templateSubtitle = rawSubtitle ?? subtitle ?? '';

  const resolve = useCallback((text: string) => {
    if (!heroContext) return text;
    return resolveHeroVariables(text, heroContext);
  }, [heroContext]);

  // Display strings — resolved variables for end users
  const displayPill = resolve(templatePill);
  const displayTitle = resolve(templateTitle);
  const displaySubtitle = resolve(templateSubtitle);

  const handleEdit = () => {
    // Seed edit inputs with raw template strings (NOT resolved)
    if (rawPill === null) setRawPill(pill ?? '');
    if (rawTitle === null) setRawTitle(title);
    if (rawSubtitle === null) setRawSubtitle(subtitle ?? '');
    setEditing(true);
  };

  const handleCancel = () => {
    setRawPill(savedPill);
    setRawTitle(savedTitle);
    setRawSubtitle(savedSubtitle);
    setEditing(false);
    setFocusedField(null);
  };

  const handleSave = async () => {
    if (!pageSlug) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/page-hero/${pageSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pill: rawPill || null,
          title: rawTitle || null,
          subtitle: rawSubtitle || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[PageHero] Save failed:', res.status, err);
        return; // keep editor open on error
      }
      // Success — update snapshot and close editor
      setSavedPill(rawPill);
      setSavedTitle(rawTitle);
      setSavedSubtitle(rawSubtitle);
      setEditing(false);
      setFocusedField(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      console.error('[PageHero] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (varKey: string) => {
    const targets: Record<string, { ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>; set: (v: string) => void; get: () => string }> = {
      pill: { ref: pillRef, set: v => setRawPill(v), get: () => rawPill ?? '' },
      title: { ref: titleRef, set: v => setRawTitle(v), get: () => rawTitle ?? '' },
      subtitle: { ref: subtitleRef, set: v => setRawSubtitle(v), get: () => rawSubtitle ?? '' },
    };
    const target = focusedField ? targets[focusedField] : targets.title;
    const el = target.ref.current;
    if (el) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + varKey + el.value.slice(end);
      target.set(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + varKey.length, start + varKey.length);
      }, 0);
    } else {
      target.set(target.get() + varKey);
    }
  };

  // Admin pencil / save+cancel / saved indicator (shared between variants)
  const adminControl = isAdmin && pageSlug ? (
    <div className="absolute top-4 right-4 z-10">
      {saved ? (
        <div className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </div>
      ) : editing ? (
        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all disabled:opacity-50 ${
              variant === 'dark'
                ? 'bg-white/20 hover:bg-green-500/30 text-white/80 hover:text-white'
                : 'bg-slate-200/80 hover:bg-green-100 text-slate-500 hover:text-green-600'
            }`}
            title="Save changes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          {/* Cancel button */}
          <button
            type="button"
            onClick={handleCancel}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
              variant === 'dark'
                ? 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white'
                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-500 hover:text-slate-700'
            }`}
            title="Cancel editing"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleEdit}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            variant === 'dark'
              ? 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white'
              : 'bg-slate-200/80 hover:bg-slate-300 text-slate-500 hover:text-slate-700'
          }`}
          title="Edit hero content"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
          </svg>
        </button>
      )}
    </div>
  ) : null;

  // ─── Dark variant ─────────────────────────────────────────────────────────

  if (variant === 'dark') {
    const darkPillContent = customPill ?? ((editing || templatePill) ? (
      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-white/80 text-xs font-medium">
        {pillIcon}
        {editing
          ? <input
              ref={pillRef}
              type="text"
              value={rawPill ?? ''}
              onChange={e => setRawPill(e.target.value)}
              onFocus={() => setFocusedField('pill')}
              placeholder="Pill text..."
              className="bg-transparent outline-none text-white text-xs font-semibold border-b border-white/30 focus:border-white/60 min-w-[80px] max-w-[200px]"
            />
          : displayPill
        }
      </div>
    ) : null);

    return (
      <section className="relative h-[220px] bg-primary overflow-hidden">
        {editing && (
          <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1 p-2 bg-black/20 backdrop-blur-sm rounded-xl max-w-[280px]">
            <span className="text-white/50 text-[10px] font-medium w-full mb-0.5">Variables</span>
            {HERO_VARIABLES.map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                title={v.description}
                className="text-[10px] bg-white/20 hover:bg-white/40 text-white px-1.5 py-0.5 rounded font-mono whitespace-nowrap transition-colors"
              >
                {v.key}
              </button>
            ))}
          </div>
        )}
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
        {/* Soft glow top-right */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
        {/* Background glow center */}
        <div className="absolute pointer-events-none inset-x-0 top-0 h-[220px] overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white opacity-[0.05] rounded-full blur-3xl" />
        </div>

        {adminControl}

        <div className="relative h-full flex flex-col items-center justify-start pt-8 text-center px-4 max-w-3xl mx-auto">
          {darkPillContent && <div className="mb-4">{darkPillContent}</div>}

          {editing ? (
            <input
              ref={titleRef}
              type="text"
              value={rawTitle ?? ''}
              onChange={e => setRawTitle(e.target.value)}
              onFocus={() => setFocusedField('title')}
              autoFocus
              placeholder="Hero title..."
              className="text-4xl sm:text-5xl font-black text-white bg-transparent outline-none border-b border-white/30 focus:border-white/60 text-center w-full max-w-2xl mb-3"
            />
          ) : (
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">{displayTitle}</h1>
          )}

          {(editing || displaySubtitle) && (
            editing ? (
              <textarea
                ref={subtitleRef}
                value={rawSubtitle ?? ''}
                onChange={e => setRawSubtitle(e.target.value)}
                onFocus={() => setFocusedField('subtitle')}
                placeholder="Subtitle text..."
                rows={1}
                className="text-lg text-primary-200 bg-transparent outline-none border-b border-white/30 focus:border-white/60 text-center w-full max-w-2xl resize-none"
              />
            ) : (
              <p className="text-primary-200 text-lg max-w-2xl leading-relaxed">{displaySubtitle}</p>
            )
          )}
        </div>
      </section>
    );
  }

  // ─── Light variant (default) ──────────────────────────────────────────────

  const lightPillContent = customPill ?? ((editing || templatePill) ? (
    <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-3.5 py-1 text-primary text-xs font-semibold tracking-wide">
      {pillIcon}
      {editing
        ? <input
            ref={pillRef}
            type="text"
            value={rawPill ?? ''}
            onChange={e => setRawPill(e.target.value)}
            onFocus={() => setFocusedField('pill')}
            placeholder="Pill text..."
            className="bg-transparent outline-none text-primary text-xs font-semibold border-b border-primary/30 focus:border-primary min-w-[80px] max-w-[200px]"
          />
        : displayPill
      }
    </div>
  ) : null);

  return (
    <section className="relative h-[220px] bg-surface-muted border-b border-slate-200 overflow-hidden">
      {editing && (
        <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1 p-2 bg-slate-800/20 backdrop-blur-sm rounded-xl max-w-[280px]">
          <span className="text-slate-600/50 text-[10px] font-medium w-full mb-0.5">Variables</span>
          {HERO_VARIABLES.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              title={v.description}
              className="text-[10px] bg-slate-600/20 hover:bg-slate-600/40 text-slate-700 px-1.5 py-0.5 rounded font-mono whitespace-nowrap transition-colors"
            >
              {v.key}
            </button>
          ))}
        </div>
      )}
      {/* Subtle background glow */}
      <div className="absolute pointer-events-none inset-x-0 top-0 h-[220px] overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary opacity-[0.03] rounded-full blur-3xl" />
      </div>

      {adminControl}

      <div className="relative h-full flex flex-col items-center justify-start pt-8 text-center px-4 max-w-3xl mx-auto">
        {lightPillContent && <div className="mb-4">{lightPillContent}</div>}

        {editing ? (
          <input
            ref={titleRef}
            type="text"
            value={rawTitle ?? ''}
            onChange={e => setRawTitle(e.target.value)}
            onFocus={() => setFocusedField('title')}
            autoFocus
            placeholder="Hero title..."
            className="text-4xl sm:text-5xl font-bold text-primary-dark bg-transparent outline-none border-b border-slate-300 focus:border-primary text-center w-full max-w-2xl mb-3"
          />
        ) : (
          <h1 className="text-4xl sm:text-5xl font-bold text-primary-dark mb-3 tracking-tight">{displayTitle}</h1>
        )}

        {(editing || displaySubtitle) && (
          editing ? (
            <textarea
              ref={subtitleRef}
              value={rawSubtitle ?? ''}
              onChange={e => setRawSubtitle(e.target.value)}
              onFocus={() => setFocusedField('subtitle')}
              placeholder="Subtitle text..."
              rows={1}
              className="text-slate-500 text-lg bg-transparent outline-none border-b border-slate-300 focus:border-primary text-center w-full max-w-2xl resize-none"
            />
          ) : (
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">{displaySubtitle}</p>
          )
        )}
      </div>
    </section>
  );
}
