'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Reply } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FeedbackButtons from '@/app/components/chat/FeedbackButtons';

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
  const [hintSessionId, setHintSessionId] = useState<string | null>(null);
  const sessionPromiseRef = useRef<Promise<string | null> | null>(null);

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
      .catch(() => {});
  }, []);

  if (!loading && !answer) return null;

  const helpUrl = `/settings/help?q=${encodeURIComponent(query)}`;

  async function ensureSession(): Promise<string | null> {
    if (hintSessionId) return hintSessionId;

    // Deduplicate: if already in-flight, return the same promise
    if (sessionPromiseRef.current) return sessionPromiseRef.current;

    sessionPromiseRef.current = (async () => {
      try {
        const res = await fetch('/api/chatbot/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query, started_from: 'search_hint' }),
        });
        if (!res.ok || !res.body) return null;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === 'done' && data.session_id) {
                setHintSessionId(data.session_id);
                reader.cancel();
                return data.session_id;
              }
            } catch { continue; }
          }
        }
        return null;
      } catch {
        return null;
      }
    })();

    return sessionPromiseRef.current;
  }

  async function handleContinue(e: React.MouseEvent) {
    e.stopPropagation();
    if (answer) {
      ensureSession(); // Fire and continue (don't await — navigate immediately)
    }
    if (onSelect) onSelect();
    router.push(helpUrl);
  }

  return (
    <div
      role="option"
      aria-selected={isHighlighted}
      className={`mx-3 mt-3 mb-1 rounded-xl border-l-2 border-blue-200 dark:border-blue-800 relative overflow-hidden p-4 transition-colors ${
        isHighlighted
          ? 'bg-blue-100 dark:bg-blue-900/40'
          : 'bg-blue-50 dark:bg-blue-950/30'
      }`}
      tabIndex={-1}
    >
      <div className="flex items-start gap-3">
        {/* Avatar — 40px */}
        <div className="w-10 h-10 rounded-full bg-[#345c83]/10 dark:bg-[#345c83]/20 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
          {config.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.avatarUrl} alt={config.name} className="w-full h-full object-cover" />
          ) : (
            <Sparkles size={18} className="text-[#345c83] dark:text-blue-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header — bold name + lighter label */}
          <p className="text-[10px] uppercase tracking-wide mb-1.5">
            <span className="font-bold text-slate-500 dark:text-slate-400">{config.name.toUpperCase()}</span>
            <span className="font-normal text-slate-400 dark:text-slate-500 opacity-60"> · AI ANSWER</span>
          </p>

          {/* Answer text — shows whatever has streamed in so far */}
          {loading && !answer ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">Thinking...</p>
          ) : answer ? (
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-4">
              {answer}
            </p>
          ) : null}

          {/* Feedback buttons + Reply — only show when we have an answer */}
          {answer && !loading && (
            <div className="group mt-2 flex items-center gap-3">
              <FeedbackButtons
                sessionId={hintSessionId}
                visible={true}
                compact={true}
                onBeforeSubmit={ensureSession}
              />
              <button
                onClick={handleContinue}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-[#345c83] text-white hover:bg-[#2a4a6b] transition-colors"
              >
                <Reply size={14} />
                {german ? 'Antworten' : 'Reply'}
              </button>
            </div>
          )}

          {/* Reply button shown during loading (no feedback yet) */}
          {answer && loading && (
            <button
              onClick={handleContinue}
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-[#345c83] text-white hover:bg-[#2a4a6b] transition-colors"
            >
              <Reply size={14} />
              {german ? 'Antworten' : 'Reply'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
