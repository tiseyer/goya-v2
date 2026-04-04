'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GraduationCap, Flower2, Stethoscope, School, User, X, Search, GripVertical } from 'lucide-react';
import { searchProfilesForTestSlots } from '@/app/actions/members';
import type { TestSlotSearchResult } from '@/app/actions/members';
import { createBrowserClient } from '@supabase/ssr';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotUser {
  id: string;
  full_name: string;
  role: string;
  principal_trainer_school_id: string | null;
}

// ─── Role icon ────────────────────────────────────────────────────────────────

function RoleIcon({ role, hasPrincipalSchool, className }: { role: string; hasPrincipalSchool: boolean; className?: string }) {
  const cls = className || 'w-4 h-4';
  if (role === 'student') return <GraduationCap className={cls} />;
  if (role === 'teacher' && hasPrincipalSchool) return <School className={cls} />;
  if (role === 'teacher') return <Flower2 className={cls} />;
  if (role === 'wellness_practitioner') return <Stethoscope className={cls} />;
  return <User className={cls} />;
}

// ─── Sortable slot ────────────────────────────────────────────────────────────

function SortableSlot({
  slotId,
  slotIndex,
  user,
  onSelect,
  onRemove,
}: {
  slotId: string;
  slotIndex: number;
  user: SlotUser | null;
  onSelect: (index: number, user: SlotUser) => void;
  onRemove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slotId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TestSlotSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    try {
      const data = await searchProfilesForTestSlots(q);
      setResults(data);
      setDropdownOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 300);
  };

  const handleSelect = (result: TestSlotSearchResult) => {
    setDropdownOpen(false);
    setQuery('');
    setResults([]);
    onSelect(slotIndex, {
      id: result.id,
      full_name: result.full_name,
      role: result.role,
      principal_trainer_school_id: result.principal_trainer_school_id,
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={setNodeRef} style={style} className="flex-1 min-w-0">
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        {/* Slot header with drag handle */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB] bg-slate-50">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-[#9CA3AF] hover:text-[#6B7280] touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Slot {slotIndex + 1}
          </span>
        </div>

        <div className="px-4 py-4">
          {user ? (
            /* Selected user chip */
            <div className="flex items-center gap-2 bg-slate-50 border border-[#E5E7EB] rounded-lg px-3 py-2.5">
              <RoleIcon
                role={user.role}
                hasPrincipalSchool={!!user.principal_trainer_school_id}
                className="w-4 h-4 text-[#4E87A0] shrink-0"
              />
              <span className="text-sm font-medium text-[#1B3A5C] truncate flex-1">{user.full_name}</span>
              <button
                onClick={() => onRemove(slotIndex)}
                className="text-[#9CA3AF] hover:text-rose-500 transition-colors shrink-0"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Search input */
            <div ref={containerRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0] focus:border-transparent bg-white text-[#1B3A5C] placeholder:text-[#9CA3AF]"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {dropdownOpen && results.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden">
                  {results.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#374151] hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#4E87A0] flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">
                          {r.full_name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{r.full_name}</div>
                        <div className="truncate text-xs text-[#9CA3AF]">{r.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {dropdownOpen && results.length === 0 && !searching && query.trim().length >= 2 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[#E5E7EB] rounded-lg shadow-lg px-3 py-3 text-sm text-[#9CA3AF]">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const SLOT_IDS = ['slot-1', 'slot-2', 'slot-3'];

export default function TestUsersTab() {
  const [slots, setSlots] = useState<(SlotUser | null)[]>([null, null, null]);
  const [slotOrder, setSlotOrder] = useState<string[]>(SLOT_IDS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load existing slots on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: row } = await supabase
        .from('admin_test_user_slots')
        .select('slot_1, slot_2, slot_3')
        .eq('admin_user_id', user.id)
        .single();

      if (!row) { setLoading(false); return; }

      const slotUserIds = [row.slot_1, row.slot_2, row.slot_3] as (string | null)[];
      const nonNull = slotUserIds.filter(Boolean) as string[];

      if (nonNull.length === 0) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, principal_trainer_school_id')
        .in('id', nonNull);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      const hydrated = slotUserIds.map(id => {
        if (!id) return null;
        const p = profileMap.get(id);
        if (!p) return null;
        return {
          id: p.id,
          full_name: p.full_name ?? '',
          role: p.role ?? 'student',
          principal_trainer_school_id: p.principal_trainer_school_id ?? null,
        } as SlotUser;
      });

      setSlots(hydrated);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSlotOrder(prev => {
      const oldIdx = prev.indexOf(active.id as string);
      const newIdx = prev.indexOf(over.id as string);
      const newOrder = arrayMove(prev, oldIdx, newIdx);

      // Also reorder slots array accordingly
      setSlots(prevSlots => {
        const oldSlotIdx = SLOT_IDS.indexOf(active.id as string);
        const newSlotIdx = SLOT_IDS.indexOf(over.id as string);
        // Map from slotOrder to slot values
        const ordered = newOrder.map(id => {
          const idx = SLOT_IDS.indexOf(id);
          return prevSlots[idx];
        });
        return ordered;
      });

      return newOrder;
    });
  }

  function handleSelect(index: number, user: SlotUser) {
    setSlots(prev => {
      const next = [...prev];
      // Map logical index via slotOrder
      const slotId = slotOrder[index];
      const slotIdx = SLOT_IDS.indexOf(slotId);
      next[slotIdx] = user;
      return next;
    });
    setSaved(false);
  }

  function handleRemove(index: number) {
    setSlots(prev => {
      const next = [...prev];
      const slotId = slotOrder[index];
      const slotIdx = SLOT_IDS.indexOf(slotId);
      next[slotIdx] = null;
      return next;
    });
    setSaved(false);
  }

  // Get slot value by visual position (via slotOrder)
  function getSlotByPosition(pos: number): SlotUser | null {
    const slotId = slotOrder[pos];
    const idx = SLOT_IDS.indexOf(slotId);
    return slots[idx];
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ordered slot values
      const s1 = getSlotByPosition(0)?.id ?? null;
      const s2 = getSlotByPosition(1)?.id ?? null;
      const s3 = getSlotByPosition(2)?.id ?? null;

      const { error } = await supabase
        .from('admin_test_user_slots')
        .upsert({
          admin_user_id: user.id,
          slot_1: s1,
          slot_2: s2,
          slot_3: s3,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'admin_user_id' });

      if (error) {
        console.error('TestUsersTab save error:', error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-64 bg-slate-100 rounded animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Test User Shortcuts</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Configure up to 3 test user shortcuts for quick role switching. These shortcuts appear in your profile dropdown.
          </p>
        </div>

        <div className="px-6 py-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slotOrder} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-4">
                {slotOrder.map((slotId, visualIndex) => (
                  <SortableSlot
                    key={slotId}
                    slotId={slotId}
                    slotIndex={visualIndex}
                    user={getSlotByPosition(visualIndex)}
                    onSelect={handleSelect}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#4E87A0] text-white hover:bg-[#3A7190] rounded-lg px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save shortcuts'}
            </button>
            {saved && (
              <span className="text-sm text-emerald-600 font-medium">Shortcuts saved!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
