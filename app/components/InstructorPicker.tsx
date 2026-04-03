'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchMembers, getProfilesByIds } from '@/app/actions/members';

/* ── Types ────────────────────────────────────────────────────────────────────── */

interface InstructorProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface InstructorPickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  currentUserRole: string;
  currentUserId: string;
}

const MAX_INSTRUCTORS = 5;

/* ── Chip ─────────────────────────────────────────────────────────────────────── */

function InstructorChip({
  name,
  avatarUrl,
  onRemove,
}: {
  name: string;
  avatarUrl?: string | null;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full pl-1 pr-3 py-1">
      <div className="w-6 h-6 rounded-full bg-primary-light/20 flex items-center justify-center overflow-hidden shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-primary">
            {name[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-primary-dark">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-primary/50 hover:text-primary transition-colors"
        aria-label={`Remove ${name}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────────── */

export default function InstructorPicker({
  value,
  onChange,
  currentUserRole,
  currentUserId,
}: InstructorPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InstructorProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, InstructorProfile>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canAddMore = value.length < MAX_INSTRUCTORS;

  // Hydrate profiles for existing instructor IDs on mount / when value changes
  useEffect(() => {
    const missingIds = value.filter(id => !profiles[id]);
    if (missingIds.length === 0) return;

    getProfilesByIds(missingIds).then(fetched => {
      setProfiles(prev => {
        const next = { ...prev };
        for (const p of fetched) {
          next[p.id] = p;
        }
        return next;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced search
  const doSearch = useCallback(
    (term: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (term.trim().length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const excludeIds = [...value];
          const data = await searchMembers(term, {
            role: currentUserRole,
            userId: currentUserId,
            excludeIds,
            limit: 10,
            excludeRoles: ['student'],
          });
          setResults(data);
          setShowDropdown(data.length > 0);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [currentUserId, currentUserRole, value]
  );

  // Handle input change
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    doSearch(val);
  }

  // Select a member from results
  function handleSelect(member: InstructorProfile) {
    if (!canAddMore) return;
    setProfiles(prev => ({ ...prev, [member.id]: member }));
    onChange([...value, member.id]);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  // Remove an instructor
  function handleRemove(id: string) {
    onChange(value.filter(v => v !== id));
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-3">
      {/* Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(id => {
            const profile = profiles[id];
            return (
              <InstructorChip
                key={id}
                name={profile?.full_name ?? 'Loading...'}
                avatarUrl={profile?.avatar_url}
                onRemove={() => handleRemove(id)}
              />
            );
          })}
        </div>
      )}

      {/* Search input */}
      {canAddMore && (
        <div className="relative" ref={dropdownRef}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder={`Search members to add as instructor (${MAX_INSTRUCTORS - value.length} remaining)...`}
            className="w-full px-3 py-2 rounded-lg border border-goya-border text-sm text-foreground bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />

          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Results dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-goya-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {results.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelect(member)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-light/20 flex items-center justify-center overflow-hidden shrink-0">
                    {member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {member.full_name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-foreground truncate">{member.full_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {showDropdown && results.length === 0 && !searching && query.trim().length >= 2 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-goya-border rounded-lg shadow-lg px-3 py-3">
              <p className="text-sm text-foreground-secondary">No members found</p>
            </div>
          )}
        </div>
      )}

      {!canAddMore && (
        <p className="text-xs text-foreground-tertiary">Maximum of 5 instructors reached.</p>
      )}
    </div>
  );
}
