'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { searchMembers } from '@/app/actions/members';

interface AttendeeProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface AttendeePickerProps {
  courseId: string;
  unlimitedSpots?: boolean;
  spotsTotal?: number | null;
  currentUserRole: string;
  currentUserId: string;
}

const INITIAL_DISPLAY = 20;

function AttendeeChip({
  name,
  avatarUrl,
  onRemove,
}: {
  name: string;
  avatarUrl?: string | null;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1">
      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-slate-500">
            {name[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-slate-700">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
        aria-label={`Remove ${name}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function AttendeePicker({
  courseId,
  unlimitedSpots = true,
  spotsTotal = null,
  currentUserRole,
  currentUserId,
}: AttendeePickerProps) {
  const [attendees, setAttendees] = useState<AttendeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AttendeeProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load attendees on mount
  useEffect(() => {
    async function loadAttendees() {
      const { data } = await supabase
        .from('course_attendees')
        .select('profile_id, profiles!course_attendees_profile_id_fkey(id, full_name, avatar_url)')
        .eq('course_id', courseId);

      if (data) {
        const profiles = data.map((row: Record<string, unknown>) => {
          const p = row.profiles as AttendeeProfile | null;
          return {
            id: p?.id ?? (row.profile_id as string),
            full_name: p?.full_name ?? 'Unknown',
            avatar_url: p?.avatar_url ?? null,
          };
        });
        setAttendees(profiles);
      }
      setLoading(false);
    }
    loadAttendees();
  }, [courseId]);

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
          const excludeIds = attendees.map(a => a.id);
          const data = await searchMembers(term, {
            role: currentUserRole,
            userId: currentUserId,
            excludeIds,
            limit: 10,
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
    [attendees, currentUserRole, currentUserId]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    doSearch(val);
  }

  async function handleAdd(member: AttendeeProfile) {
    const { error } = await supabase
      .from('course_attendees')
      .insert({ course_id: courseId, profile_id: member.id });

    if (error) {
      console.error('Failed to add attendee:', error.message, { courseId, profileId: member.id });
    } else {
      setAttendees(prev => [...prev, member]);
      setAddedId(member.id);
      setTimeout(() => setAddedId(null), 2000);
    }
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  async function handleRemove(profileId: string) {
    const { error } = await supabase
      .from('course_attendees')
      .delete()
      .eq('course_id', courseId)
      .eq('profile_id', profileId);

    if (!error) {
      setAttendees(prev => prev.filter(a => a.id !== profileId));
    }
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

  const displayAttendees = expanded ? attendees : attendees.slice(0, INITIAL_DISPLAY);
  const hiddenCount = attendees.length - INITIAL_DISPLAY;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
        <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
        Loading attendees...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Attendee chips */}
      {attendees.length === 0 ? (
        <p className="text-sm text-foreground-tertiary">No attendees yet.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {displayAttendees.map(a => (
              <div key={a.id} className="relative">
                <AttendeeChip
                  name={a.full_name}
                  avatarUrl={a.avatar_url}
                  onRemove={() => handleRemove(a.id)}
                />
                {addedId === a.id && (
                  <span className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full animate-pulse">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Added
                  </span>
                )}
              </div>
            ))}
          </div>
          {!expanded && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-xs text-primary hover:underline font-medium"
            >
              +{hiddenCount} more
            </button>
          )}
        </>
      )}

      {/* Spots calculation */}
      {!unlimitedSpots && spotsTotal !== null && (
        <p className="text-xs text-foreground-secondary font-medium">
          {attendees.length} / {spotsTotal} spots filled
        </p>
      )}

      {/* Search input */}
      <div className="relative" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search members to add..."
          className="w-full px-3 py-2 rounded-lg border border-goya-border text-sm text-foreground bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
        />

        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-goya-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {results.map(member => (
              <button
                key={member.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleAdd(member); }}
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

        {showDropdown && results.length === 0 && !searching && query.trim().length >= 2 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-goya-border rounded-lg shadow-lg px-3 py-3">
            <p className="text-sm text-foreground-secondary">No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
