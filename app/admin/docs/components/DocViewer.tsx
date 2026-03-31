'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { DocMeta, DocPage, NavSection } from '@/lib/docs/types';
import MarkdownRenderer from './MarkdownRenderer';
import SearchModal from '@/app/components/docs/SearchModal';
import { useDocSearch } from '@/app/components/docs/useDocSearch';

const AUDIENCES = ['all', 'admin', 'moderator', 'teacher', 'student', 'developer'] as const;

type TocItem = { id: string; text: string; level: 2 | 3 };

function extractHeadings(content: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const m2 = line.match(/^## (.+)$/);
    if (m2) {
      headings.push({ id: slugify(m2[1]), text: m2[1], level: 2 });
      continue;
    }
    const m3 = line.match(/^### (.+)$/);
    if (m3) {
      headings.push({ id: slugify(m3[1]), text: m3[1], level: 3 });
    }
  }
  return headings;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

type Props = {
  doc: DocPage;
  navTree: NavSection[];
  allDocs: DocMeta[];
  prevDoc: DocMeta | null;
  nextDoc: DocMeta | null;
};

export default function DocViewer({ doc, navTree, allDocs, prevDoc, nextDoc }: Props) {
  const [audience, setAudience] = useState<string>('all');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { isOpen: searchOpen, open: openSearch, close: closeSearch } = useDocSearch();

  // Load persisted sidebar state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('goya-docs-audience');
      if (stored && AUDIENCES.includes(stored as (typeof AUDIENCES)[number])) {
        setAudience(stored);
      }
      const storedCollapsed = localStorage.getItem('goya-docs-collapsed');
      if (storedCollapsed) {
        setCollapsedSections(new Set(JSON.parse(storedCollapsed)));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist audience
  const handleAudienceChange = useCallback((a: string) => {
    setAudience(a);
    try {
      localStorage.setItem('goya-docs-audience', a);
    } catch {
      // ignore
    }
  }, []);

  // Persist collapsed sections
  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      try {
        localStorage.setItem('goya-docs-collapsed', JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Filter nav tree by audience
  const filteredTree =
    audience === 'all'
      ? navTree
      : navTree
          .map((s) => ({
            ...s,
            pages: s.pages.filter((p) => p.audience.includes(audience)),
          }))
          .filter((s) => s.pages.length > 0);

  // Table of contents from markdown
  const headings = extractHeadings(doc.content);

  // IntersectionObserver for active heading tracking
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    observerRef.current = observer;

    // Observe all heading elements after a short delay for DOM readiness
    const timer = setTimeout(() => {
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el) observer.observe(el);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [doc.meta.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Mobile nav toggle */}
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="lg:hidden fixed bottom-4 left-4 z-20 w-12 h-12 rounded-full bg-[var(--goya-primary)] text-white shadow-lg flex items-center justify-center print:hidden"
        aria-label="Toggle navigation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileNavOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* LEFT SIDEBAR */}
      <aside className={`${mobileNavOpen ? 'fixed inset-0 z-10 bg-white' : 'hidden'} lg:block lg:w-[250px] lg:shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200 bg-white print:hidden`}>
        <div className="p-4">
          <Link
            href="/admin/docs"
            className="text-sm font-bold text-[var(--goya-primary)] hover:underline"
          >
            GOYA Documentation
          </Link>

          {/* Search trigger */}
          <button
            onClick={openSearch}
            className="mt-3 w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors text-left"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1">Search docs...</span>
            <kbd className="hidden sm:inline text-[10px] font-mono bg-white px-1 py-0.5 rounded border border-slate-200">⌘K</kbd>
          </button>

          {/* Audience filter tabs */}
          <div className="mt-3 flex flex-wrap gap-1">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                onClick={() => handleAudienceChange(a)}
                className={`px-2 py-0.5 text-[11px] rounded-full capitalize transition-colors cursor-pointer ${
                  audience === a
                    ? 'bg-[var(--goya-primary)] text-white font-medium'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation tree */}
        <nav className="px-3 pb-4">
          {filteredTree.map((section) => {
            const isCollapsed = collapsedSections.has(section.section);
            return (
              <div key={section.section} className="mb-1">
                <button
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <span>{section.section}</span>
                  <svg
                    className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.pages.map((page) => {
                      const isActive = page.slug === doc.meta.slug;
                      return (
                        <Link
                          key={page.slug}
                          href={`/admin/docs/${page.slug}`}
                          className={`block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-[var(--goya-primary)]/10 text-[var(--goya-primary)] font-medium'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {page.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MIDDLE CONTENT */}
      <main className="flex-1 min-w-0 px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link href="/admin/docs" className="hover:text-[var(--goya-primary)] transition-colors">
              Documentation
            </Link>
            <span>/</span>
            <span className="capitalize">{doc.meta.section}</span>
            <span>/</span>
            <span className="text-slate-700 font-medium">{doc.meta.title}</span>
          </nav>

          {/* Last updated badge */}
          {doc.meta.last_updated && (
            <p className="text-xs text-slate-400 mb-4">
              Last updated: {doc.meta.last_updated}
            </p>
          )}

          {/* Markdown content */}
          <MarkdownRenderer content={doc.content} />

          {/* Previous / Next navigation */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex items-stretch gap-4">
            {prevDoc ? (
              <Link
                href={`/admin/docs/${prevDoc.slug}`}
                className="flex-1 group rounded-xl border border-slate-200 p-4 hover:border-[var(--goya-primary)] hover:shadow-sm transition-all"
              >
                <p className="text-xs text-slate-400 mb-1">Previous</p>
                <p className="text-sm font-medium text-slate-700 group-hover:text-[var(--goya-primary)] transition-colors">
                  &larr; {prevDoc.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextDoc ? (
              <Link
                href={`/admin/docs/${nextDoc.slug}`}
                className="flex-1 group rounded-xl border border-slate-200 p-4 text-right hover:border-[var(--goya-primary)] hover:shadow-sm transition-all"
              >
                <p className="text-xs text-slate-400 mb-1">Next</p>
                <p className="text-sm font-medium text-slate-700 group-hover:text-[var(--goya-primary)] transition-colors">
                  {nextDoc.title} &rarr;
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR — Table of Contents */}
      <aside className="w-[220px] shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden xl:block print:hidden">
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            On this page
          </p>
          {headings.length > 0 ? (
            <nav className="space-y-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(h.id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      // Update URL hash without scrolling
                      window.history.replaceState(null, '', `#${h.id}`);
                    }
                  }}
                  className={`block text-sm transition-colors ${
                    h.level === 3 ? 'pl-3' : ''
                  } ${
                    activeHeading === h.id
                      ? 'text-[var(--goya-primary)] font-medium'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          ) : (
            <p className="text-xs text-slate-400">No headings found.</p>
          )}
        </div>
      </aside>

      {/* Search modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={closeSearch}
        basePath="/admin/docs"
      />
    </div>
  );
}
