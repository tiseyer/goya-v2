'use client';

import type { SearchResult } from '@/app/components/search/types';

// Inline SVG icons to avoid lucide-react dependency in worktree
// (lucide-react is in main project deps and will work post-merge)

function IconCalendar({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconBookOpen({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconFileText({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconMessageCircle({ size = 16, className = '', title: titleProp }: { size?: number; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-label={titleProp}>
      {titleProp && <title>{titleProp}</title>}
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconMapPin({ size = 16, className = '', title: titleProp }: { size?: number; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-label={titleProp}>
      {titleProp && <title>{titleProp}</title>}
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconHelpCircle({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconShoppingBag({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconArrowRight({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

interface SearchResultRowProps {
  result: SearchResult;
  isHighlighted: boolean;
  onClick: () => void;
}

export default function SearchResultRow({ result, isHighlighted, onClick }: SearchResultRowProps) {
  const containerClass = [
    'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2',
    isHighlighted ? 'bg-[#6E88B0]/5 dark:bg-[#6E88B0]/15 border-[#6E88B0]' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800',
  ].join(' ');

  // Left avatar/icon
  let leftIcon: React.ReactNode;
  if (result.category === 'members') {
    if (result.avatarUrl) {
      // eslint-disable-next-line @next/next/no-img-element
      leftIcon = <img src={result.avatarUrl} alt={result.title} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
    } else {
      leftIcon = (
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-xs font-medium flex-shrink-0">
          {result.title[0]?.toUpperCase() ?? '?'}
        </div>
      );
    }
  } else if (result.category === 'events') {
    leftIcon = <IconCalendar size={20} className="text-slate-400 flex-shrink-0" />;
  } else if (result.category === 'courses') {
    leftIcon = <IconBookOpen size={20} className="text-slate-400 flex-shrink-0" />;
  } else if (result.category === 'products') {
    if (result.avatarUrl) {
      // eslint-disable-next-line @next/next/no-img-element
      leftIcon = <img src={result.avatarUrl} alt={result.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />;
    } else {
      leftIcon = <IconShoppingBag size={20} className="text-slate-400 flex-shrink-0" />;
    }
  } else if (result.category === 'help') {
    leftIcon = <IconHelpCircle size={20} className="text-slate-400 flex-shrink-0" />;
  } else {
    leftIcon = <IconFileText size={20} className="text-slate-400 flex-shrink-0" />;
  }

  // Build Google Maps URL from address data
  const mapsUrl = result.category === 'members' && result.has_full_address
    ? `https://maps.google.com/?q=${encodeURIComponent(
        [result.location, result.city, result.country].filter(Boolean).join(', ')
      )}`
    : null;

  // Right action icons
  let rightIcons: React.ReactNode;
  if (result.category === 'members') {
    rightIcons = (
      <div className="flex items-center gap-1 ml-auto">
        <IconMessageCircle size={16} className="text-slate-400 hover:text-[#6E88B0] transition-colors" title="Send message" />
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Get directions"
          >
            <IconMapPin size={16} className="text-slate-400 hover:text-[#6E88B0] transition-colors" />
          </a>
        )}
      </div>
    );
  } else {
    rightIcons = <IconArrowRight size={16} className="text-slate-300 ml-auto flex-shrink-0" />;
  }

  return (
    <div
      role="option"
      aria-selected={isHighlighted}
      onClick={onClick}
      className={containerClass}
    >
      {leftIcon}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{result.title}</span>
        {result.subtitle && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</span>
        )}
      </div>
      {rightIcons}
    </div>
  );
}
