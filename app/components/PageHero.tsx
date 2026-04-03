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

  // Custom content from DB (null = use prop default)
  const [pillText, setPillText] = useState<string | null>(null);
  const [titleText, setTitleText] = useState<string | null>(null);
  const [subtitleText, setSubtitleText] = useState<string | null>(null);

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
        setPillText(data.pill);
        setTitleText(data.title);
        setSubtitleText(data.subtitle);
        setSavedPill(data.pill);
        setSavedTitle(data.title);
        setSavedSubtitle(data.subtitle);
      })
      .catch(() => {/* silently use defaults */});
  }, [pageSlug]);

  const displayPill = pillText ?? pill ?? '';
  const displayTitle = titleText ?? title;
  const displaySubtitle = subtitleText ?? subtitle ?? '';

  const resolve = useCallback((text: string) => {
    if (!heroContext) return text;
    return resolveHeroVariables(text, heroContext);
  }, [heroContext]);

  const handleEdit = () => {
    // Seed inputs with current display values (before variable resolution)
    if (pillText === null) setPillText(pill ?? '');
    if (titleText === null) setTitleText(title);
    if (subtitleText === null) setSubtitleText(subtitle ?? '');
    setEditing(true);
  };

  const handleCancel = () => {
    setPillText(savedPill);
    setTitleText(savedTitle);
    setSubtitleText(savedSubtitle);
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
          pill: pillText || null,
          title: titleText || null,
          subtitle: subtitleText || null,
        }),
      });
      if (res.ok) {
        setSavedPill(pillText);
        setSavedTitle(titleText);
        setSavedSubtitle(subtitleText);
        setEditing(false);
        setFocusedField(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (varKey: string) => {
    if (focusedField === 'pill' && pillRef.current) {
      const el = pillRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + varKey + el.value.slice(end);
      setPillText(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + varKey.length, start + varKey.length);
      }, 0);
    } else if (focusedField === 'title' && titleRef.current) {
      const el = titleRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + varKey + el.value.slice(end);
      setTitleText(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + varKey.length, start + varKey.length);
      }, 0);
    } else if (focusedField === 'subtitle' && subtitleRef.current) {
      const el = subtitleRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + varKey + el.value.slice(end);
      setSubtitleText(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + varKey.length, start + varKey.length);
      }, 0);
    } else {
      // No field focused — append to title
      setTitleText(t => (t ?? '') + varKey);
    }
  };

  // ─── Dark variant ─────────────────────────────────────────────────────────

  if (variant === 'dark') {
    const darkPillContent = customPill ?? (displayPill ? (
      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-white/80 text-xs font-medium">
        {pillIcon}
        {editing
          ? <input
              ref={pillRef}
              type="text"
              value={pillText ?? ''}
              onChange={e => setPillText(e.target.value)}
              onFocus={() => setFocusedField('pill')}
              placeholder="Pill text..."
              className="bg-transparent outline-none text-white text-xs font-semibold border-b border-white/30 focus:border-white/60 min-w-[80px] max-w-[200px]"
            />
          : resolve(displayPill)
        }
      </div>
    ) : null);

    return (
      <div className="relative bg-[#1B3A5C] overflow-hidden">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#4E87A0]/20 blur-3xl rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 flex flex-col items-center text-center">
          {darkPillContent && <div className="mb-4">{darkPillContent}</div>}

          {editing ? (
            <input
              ref={titleRef}
              type="text"
              value={titleText ?? ''}
              onChange={e => setTitleText(e.target.value)}
              onFocus={() => setFocusedField('title')}
              autoFocus
              placeholder="Hero title..."
              className="text-4xl sm:text-5xl font-black text-white bg-transparent outline-none border-b border-white/30 focus:border-white/60 text-center w-full max-w-2xl mb-3"
            />
          ) : (
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
              {resolve(displayTitle)}
            </h1>
          )}

          {(editing || displaySubtitle) && (
            editing ? (
              <textarea
                ref={subtitleRef}
                value={subtitleText ?? ''}
                onChange={e => setSubtitleText(e.target.value)}
                onFocus={() => setFocusedField('subtitle')}
                placeholder="Subtitle text..."
                rows={2}
                className="text-lg text-white/70 bg-transparent outline-none border-b border-white/30 focus:border-white/60 text-center w-full max-w-2xl resize-none"
              />
            ) : (
              <p className="text-lg text-white/70 max-w-2xl">{resolve(displaySubtitle)}</p>
            )
          )}

          {/* Variable bar (edit mode only) */}
          {editing && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {HERO_VARIABLES.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  title={v.description}
                  className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors border border-white/20"
                >
                  {v.key}
                </button>
              ))}
            </div>
          )}

          {/* Edit mode action buttons */}
          {editing && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#1B3A5C] hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Admin pencil / saved indicator */}
        {isAdmin && pageSlug && (
          <div className="absolute top-4 right-4">
            {saved ? (
              <div className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </div>
            ) : (
              <button
                type="button"
                onClick={editing ? handleCancel : handleEdit}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                title={editing ? 'Cancel editing' : 'Edit hero content'}
              >
                {editing ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Light variant (default) ──────────────────────────────────────────────

  const lightPillContent = customPill ?? (displayPill ? (
    <div className="inline-flex items-center gap-2 bg-[#4E87A0]/10 border border-[#4E87A0]/20 rounded-full px-3 py-1 text-[#4E87A0] text-xs font-medium">
      {pillIcon}
      {editing
        ? <input
            ref={pillRef}
            type="text"
            value={pillText ?? ''}
            onChange={e => setPillText(e.target.value)}
            onFocus={() => setFocusedField('pill')}
            placeholder="Pill text..."
            className="bg-transparent outline-none text-[#4E87A0] text-xs font-semibold border-b border-slate-300 focus:border-[#4E87A0] min-w-[80px] max-w-[200px]"
          />
        : resolve(displayPill)
      }
    </div>
  ) : null);

  return (
    <div className="relative bg-[#F7F8FA] pt-10 border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 flex flex-col items-center text-center">
        {lightPillContent && <div className="mb-4">{lightPillContent}</div>}

        {editing ? (
          <input
            ref={titleRef}
            type="text"
            value={titleText ?? ''}
            onChange={e => setTitleText(e.target.value)}
            onFocus={() => setFocusedField('title')}
            autoFocus
            placeholder="Hero title..."
            className="text-4xl sm:text-5xl font-bold text-[#1B3A5C] bg-transparent outline-none border-b border-slate-300 focus:border-[#4E87A0] text-center w-full max-w-2xl mb-3"
          />
        ) : (
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1B3A5C] mb-3">
            {resolve(displayTitle)}
          </h1>
        )}

        {(editing || displaySubtitle) && (
          editing ? (
            <textarea
              ref={subtitleRef}
              value={subtitleText ?? ''}
              onChange={e => setSubtitleText(e.target.value)}
              onFocus={() => setFocusedField('subtitle')}
              placeholder="Subtitle text..."
              rows={2}
              className="text-[#6B7280] text-lg bg-transparent outline-none border-b border-slate-300 focus:border-[#4E87A0] text-center w-full max-w-2xl resize-none"
            />
          ) : (
            <p className="text-[#6B7280] text-lg max-w-2xl">{resolve(displaySubtitle)}</p>
          )
        )}

        {/* Variable bar (edit mode only) */}
        {editing && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {HERO_VARIABLES.map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                title={v.description}
                className="px-2.5 py-1 rounded-full bg-[#4E87A0]/10 hover:bg-[#4E87A0]/20 text-[#4E87A0] text-xs font-medium transition-colors border border-[#4E87A0]/20"
              >
                {v.key}
              </button>
            ))}
          </div>
        )}

        {/* Edit mode action buttons */}
        {editing && (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#1B3A5C] text-white hover:bg-[#243560] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Admin pencil / saved indicator */}
      {isAdmin && pageSlug && (
        <div className="absolute top-4 right-4">
          {saved ? (
            <div className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </div>
          ) : (
            <button
              type="button"
              onClick={editing ? handleCancel : handleEdit}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-500 hover:text-slate-700 transition-all"
              title={editing ? 'Cancel editing' : 'Edit hero content'}
            >
              {editing ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
