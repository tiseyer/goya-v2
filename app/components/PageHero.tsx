// TODO: Pages that could adopt PageHero:
// - app/about/page.tsx — has hand-rolled dark hero (bg-[#1a2744]) with pill, text-4xl/5xl/6xl heading, and subtitle
// - app/standards/page.tsx — same hand-rolled dark hero pattern (bg-[#1a2744]) with pill and text-4xl/5xl heading
// - app/credits/page.tsx — has an inline page header div with text-2xl sm:text-3xl font-bold heading and subtitle paragraph

import type { ReactNode } from 'react';

interface PageHeroProps {
  pill?: string;
  pillIcon?: ReactNode;
  title: string;
  subtitle?: string;
  customPill?: ReactNode;
  variant?: 'light' | 'dark';
}

export default function PageHero({ pill, pillIcon, title, subtitle, customPill, variant = 'light' }: PageHeroProps) {
  const isDark = variant === 'dark';

  const pillContent = customPill ?? (pill ? (
    <div className={
      isDark
        ? "inline-flex items-center gap-2 bg-white/12 border border-white/15 rounded-full px-3.5 py-1 text-white/90 text-xs font-semibold tracking-wide"
        : "inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-3.5 py-1 text-primary text-xs font-semibold tracking-wide"
    }>
      {pillIcon}
      {pill}
    </div>
  ) : null);

  if (isDark) {
    return (
      <section className="flex items-center justify-center w-full h-[240px] sm:h-[260px] md:h-[280px] bg-primary relative overflow-hidden">
        {/* Subtle dot-grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
        {/* Soft glow top-right */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
        {/* Background glow center */}
        <div className="absolute pointer-events-none inset-x-0 top-0 h-[280px] overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white opacity-[0.05] rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
          {pillContent && <div className="mb-4">{pillContent}</div>}
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-primary-200 text-lg max-w-2xl leading-relaxed">{subtitle}</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="flex items-center justify-center w-full h-[240px] sm:h-[260px] md:h-[280px] bg-surface-muted border-b border-slate-200">
      {/* Subtle background glow */}
      <div className="absolute pointer-events-none inset-x-0 top-0 h-[280px] overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary opacity-[0.03] rounded-full blur-3xl" />
      </div>
      <div className="relative text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
        {pillContent && <div className="mb-4">{pillContent}</div>}
        <h1 className="text-4xl sm:text-5xl font-bold text-primary-dark mb-3 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
