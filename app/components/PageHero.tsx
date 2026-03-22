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
    <div className="inline-flex items-center gap-2 bg-[#4E87A0]/10 border border-[#4E87A0]/20 rounded-full px-3 py-1 text-[#4E87A0] text-xs font-medium">
      {pillIcon}
      {pill}
    </div>
  ) : null);

  return (
    <section className="flex items-center justify-center w-full h-[200px] sm:h-[220px] md:h-[240px] bg-[#F7F8FA] border-b border-[#E5E7EB]">
      <div className="text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
        {pillContent && <div className="mb-4">{pillContent}</div>}
        <h1 className="text-4xl sm:text-5xl font-bold text-[#1B3A5C] mb-3">{title}</h1>
        {subtitle && (
          <p className="text-[#6B7280] text-lg max-w-2xl">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
