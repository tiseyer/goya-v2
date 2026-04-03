'use client';

import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

const GERMAN_WORDS = ['wie', 'was', 'ich', 'ist', 'die', 'der', 'das', 'und', 'mit', 'für'];

function isGerman(query: string): boolean {
  const words = query.toLowerCase().split(/\s+/);
  return words.some(w => GERMAN_WORDS.includes(w));
}

interface Props {
  query: string;
  answer: string | null;
  loading: boolean;
  isHighlighted?: boolean;
  onSelect?: () => void;
}

export default function MatteaSearchHint({ query, answer, loading, isHighlighted, onSelect }: Props) {
  const router = useRouter();
  const german = isGerman(query);

  if (!loading && !answer) return null;

  const helpUrl = `/settings/help?q=${encodeURIComponent(query)}`;

  function handleNavigate() {
    if (onSelect) onSelect();
    router.push(helpUrl);
  }

  return (
    <div
      role="option"
      aria-selected={isHighlighted}
      className={`mx-3 mt-3 mb-1 rounded-xl border-l-4 border-[#345c83] p-4 transition-colors cursor-pointer ${
        isHighlighted
          ? 'bg-blue-100 dark:bg-blue-900/40'
          : 'bg-blue-50 dark:bg-blue-950/30'
      }`}
      onClick={handleNavigate}
      onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(); }}
      tabIndex={-1}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-[#345c83]/10 dark:bg-[#345c83]/20 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} className="text-[#345c83] dark:text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            Mattea · AI Answer
          </p>

          {loading ? (
            <div className="space-y-1.5">
              <div className="h-3.5 bg-blue-100 dark:bg-blue-900/50 rounded animate-pulse w-full" />
              <div className="h-3.5 bg-blue-100 dark:bg-blue-900/50 rounded animate-pulse w-3/4" />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-3">
                {answer}
              </p>
              <p className="text-xs text-[#345c83] dark:text-blue-300 font-medium mt-2 hover:underline">
                {german ? 'Gespräch fortsetzen →' : 'Continue this conversation →'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
