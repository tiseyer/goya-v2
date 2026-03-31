'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { DocMeta, DocPage, NavSection } from '@/lib/docs/types'
import MarkdownRenderer from '@/app/admin/docs/components/MarkdownRenderer'

type TocItem = { id: string; text: string; level: 2 | 3 }

function extractHeadings(content: string): TocItem[] {
  const headings: TocItem[] = []
  const lines = content.split('\n')
  for (const line of lines) {
    const m2 = line.match(/^## (.+)$/)
    if (m2) {
      headings.push({ id: slugify(m2[1]), text: m2[1], level: 2 })
      continue
    }
    const m3 = line.match(/^### (.+)$/)
    if (m3) {
      headings.push({ id: slugify(m3[1]), text: m3[1], level: 3 })
    }
  }
  return headings
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

type Props = {
  doc: DocPage
  navTree: NavSection[]
  allDocs: DocMeta[]
  prevDoc: DocMeta | null
  nextDoc: DocMeta | null
}

export default function HelpDocViewer({ doc, navTree, allDocs, prevDoc, nextDoc }: Props) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [activeHeading, setActiveHeading] = useState<string>('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const headings = extractHeadings(doc.content)

  // IntersectionObserver for active heading tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 }
    )

    const headingEls = contentRef.current?.querySelectorAll('h2[id], h3[id]')
    headingEls?.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [doc.meta.slug])

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }, [])

  const basePath = '/settings/help/docs'

  return (
    <div className="flex min-h-[60vh]">
      {/* Mobile nav toggle */}
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-20 w-12 h-12 rounded-full bg-[var(--goya-primary)] text-white shadow-lg flex items-center justify-center"
        aria-label="Toggle navigation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileNavOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Left sidebar — navigation */}
      <aside
        className={`${
          mobileNavOpen ? 'fixed inset-0 z-10 bg-white' : 'hidden'
        } lg:block lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] w-full lg:w-[250px] flex-shrink-0 border-r border-slate-200 overflow-y-auto`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[var(--goya-primary-dark)]">Help &amp; Guides</h3>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* No audience filter for non-admins — content is pre-filtered */}

          <nav className="space-y-1">
            {navTree.map(section => {
              const isCollapsed = collapsedSections.has(section.section)
              return (
                <div key={section.section}>
                  <button
                    onClick={() => toggleSection(section.section)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-[var(--goya-primary)]"
                  >
                    {section.section}
                    <svg
                      className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5 mb-2">
                      {section.pages.map(page => {
                        const isActive = page.slug === doc.meta.slug
                        return (
                          <Link
                            key={page.slug}
                            href={`${basePath}/${page.slug}`}
                            onClick={() => setMobileNavOpen(false)}
                            className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-[var(--goya-primary)]/10 text-[var(--goya-primary)] font-medium'
                                : 'text-slate-600 hover:text-[var(--goya-primary)] hover:bg-slate-50'
                            }`}
                          >
                            {page.title}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Middle content */}
      <main className="flex-1 min-w-0 px-6 py-6 md:px-8 lg:px-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
          <Link href="/settings/help" className="hover:text-[var(--goya-primary)]">Help</Link>
          <span>/</span>
          <span className="capitalize">{doc.meta.section}</span>
          <span>/</span>
          <span className="text-slate-600">{doc.meta.title}</span>
        </nav>

        <div ref={contentRef} className="max-w-3xl">
          <MarkdownRenderer content={doc.content} />
        </div>

        {/* Prev/Next */}
        <div className="max-w-3xl flex items-stretch gap-4 mt-12 pt-6 border-t border-slate-200">
          {prevDoc ? (
            <Link
              href={`${basePath}/${prevDoc.slug}`}
              className="flex-1 rounded-xl border border-slate-200 p-4 hover:border-[var(--goya-primary)]/30 hover:shadow-sm transition-all"
            >
              <span className="text-xs text-slate-400">← Previous</span>
              <p className="text-sm font-medium text-foreground mt-1">{prevDoc.title}</p>
            </Link>
          ) : <div className="flex-1" />}
          {nextDoc ? (
            <Link
              href={`${basePath}/${nextDoc.slug}`}
              className="flex-1 rounded-xl border border-slate-200 p-4 text-right hover:border-[var(--goya-primary)]/30 hover:shadow-sm transition-all"
            >
              <span className="text-xs text-slate-400">Next →</span>
              <p className="text-sm font-medium text-foreground mt-1">{nextDoc.title}</p>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </main>

      {/* Right sidebar — TOC (hidden on mobile/tablet) */}
      {headings.length > 0 && (
        <aside className="hidden xl:block sticky top-16 h-[calc(100vh-4rem)] w-[220px] flex-shrink-0 overflow-y-auto border-l border-slate-200 py-6 px-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">On this page</h4>
          <nav className="space-y-1">
            {headings.map(h => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={`block text-xs py-0.5 transition-colors ${
                  h.level === 3 ? 'pl-3' : ''
                } ${
                  activeHeading === h.id
                    ? 'text-[var(--goya-primary)] font-medium'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </div>
  )
}
