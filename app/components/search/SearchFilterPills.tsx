'use client';

import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/app/components/search/types';
import type { SearchCategory } from '@/app/components/search/types';

interface SearchFilterPillsProps {
  activeCategory: SearchCategory | 'all';
  onSelect: (category: SearchCategory | 'all') => void;
  isMobile?: boolean;
}

const ALL_CATEGORIES: Array<SearchCategory | 'all'> = ['all', ...CATEGORY_ORDER];

export default function SearchFilterPills({ activeCategory, onSelect, isMobile }: SearchFilterPillsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter search results"
      className={`flex gap-2 px-4 py-2 overflow-x-auto flex-nowrap ${isMobile ? '' : 'border-b border-slate-100'}`}
    >
      {ALL_CATEGORIES.map((category) => {
        const isActive = category === activeCategory;
        const label = category === 'all' ? 'All' : CATEGORY_LABELS[category];

        const activeClass = 'px-3 py-1 rounded-full text-xs font-medium text-white bg-[var(--goya-primary)] whitespace-nowrap';
        const inactiveDesktop = 'px-3 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap';
        const inactiveMobile = 'px-3 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors whitespace-nowrap';

        return (
          <button
            key={category}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(category)}
            className={isActive ? activeClass : (isMobile ? inactiveMobile : inactiveDesktop)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
