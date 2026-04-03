'use client';

import { useState, useEffect } from 'react';
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

interface ChatbotConfig {
  name: string;
  avatarUrl: string | null;
}

export default function MatteaSearchHint({ query, answer, loading, isHighlighted, onSelect }: Props) {
  const router = useRouter();
  const german = isGerman(query);
  const [config, setConfig] = useState<ChatbotConfig>({ name: 'Mattea', avatarUrl: null });

  // Fetch chatbot config (name + avatar) on mount
  useEffect(() => {
    fetch('/api/chatbot/config')
      .then(r => r.json())
      .then((data: { name?: string; avatar_url?: string | null }) => {
        if (data.name || data.avatar_url) {
          setConfig({
            name: data.name || 'Mattea',
            avatarUrl: data.avatar_url || null,
          });
        }
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  if (!loading && !answer) return null;

  const helpUrl = `/settings/help?q=${encodeURIComponent(query)}`;

  async function handleNavigate() {
    // Save the exchange to chatbot conversations (fire-and-forget)
    if (answer) {
      fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          source: 'search_hint',
        }),
      }).catch(() => { /* silent */ });
    }

    if (onSelect) onSelect();
    router.push(helpUrl);
  }

  return (
    <div
      role="option"
      aria-selected={isHighlighted}
      className={`mx-3 mt-3 mb-1 rounded-xl relative overflow-hidden p-4 transition-colors cursor-pointer ${
        isHighlighted
          ? 'bg-blue-100 dark:bg-blue-900/40'
          : 'bg-blue-50 dark:bg-blue-950/30'
      }`}
      onClick={handleNavigate}
      onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(); }}
      tabIndex={-1}
    >
      {/* Animated breathing left border */}
      <div
        className="mattea-border-animate absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#345c83]"
        aria-hidden="true"
      />

      <div className="flex items-start gap-3 pl-2">
        {/* Avatar or fallback icon */}
        <div className="w-7 h-7 rounded-full bg-[#345c83]/10 dark:bg-[#345c83]/20 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
          {config.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.avatarUrl} alt={config.name} className="w-full h-full object-cover" />
          ) : (
            <Sparkles size={14} className="text-[#345c83] dark:text-blue-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            {config.name.toUpperCase()} · AI Answer
          </p>

          {loading && !answer ? (
            <div className="py-0.5">
              <div className="mattea-skeleton-line" style={{ width: '100%' }} />
              <div className="mattea-skeleton-line" style={{ width: '85%' }} />
              <div className="mattea-skeleton-line" style={{ width: '60%', marginBottom: 0 }} />
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
