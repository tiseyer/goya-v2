import type { ReactNode } from 'react';

interface PageHeroProps {
  pill?: string;
  pillIcon?: ReactNode;
  title: string;
  subtitle?: string;
  customPill?: ReactNode;
}

export default function PageHero({ pill, pillIcon, title, subtitle, customPill }: PageHeroProps) {
  const pillContent = customPill ?? (pill ? (
    <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-3.5 py-1 text-primary text-xs font-semibold tracking-wide">
      {pillIcon}
      {pill}
    </div>
  ) : null);

  return (
    <section className="flex items-center justify-center w-full h-[200px] sm:h-[220px] md:h-[240px] bg-surface-muted border-b border-slate-200">
      {/* Subtle background glow */}
      <div className="absolute pointer-events-none inset-x-0 top-0 h-[240px] overflow-hidden" aria-hidden="true">
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
