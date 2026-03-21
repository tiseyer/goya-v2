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
    <div className="bg-[#F7F8FA] pt-10 border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 flex flex-col items-center text-center">
        {pillContent && <div className="mb-4">{pillContent}</div>}
        <h1 className="text-4xl sm:text-5xl font-bold text-[#1B3A5C] mb-3">{title}</h1>
        {subtitle && (
          <p className="text-[#6B7280] text-lg max-w-2xl">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
