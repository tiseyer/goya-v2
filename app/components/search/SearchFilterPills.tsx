'use client';

import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/app/components/search/types';
import type { SearchCategory } from '@/app/components/search/types';

interface SearchFilterPillsProps {
  activeCategory: SearchCategory | 'all';
  onSelect: (category: SearchCategory | 'all') => void;
}

const ALL_CATEGORIES: Array<SearchCategory | 'all'> = ['all', ...CATEGORY_ORDER];

export default function SearchFilterPills({ activeCategory, onSelect }: SearchFilterPillsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter search results"
      className="flex gap-2 px-4 py-2 border-b border-slate-100 overflow-x-auto flex-nowrap"
    >
      {ALL_CATEGORIES.map((category) => {
        const isActive = category === activeCategory;
        const label = category === 'all' ? 'All' : CATEGORY_LABELS[category];
        return (
          <button
            key={category}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(category)}
            className={
              isActive
                ? 'px-3 py-1 rounded-full text-xs font-medium text-white bg-[#345c83] whitespace-nowrap'
                : 'px-3 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap'
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
