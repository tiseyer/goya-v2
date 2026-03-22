'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import PageHero from '@/app/components/PageHero';
import {
  members,
  allCountries,
  allDesignations,
  allTeachingStyles,
  type MemberRole,
} from '@/lib/members-data';

const MapPanel = dynamic(() => import('./MapPanel'), { ssr: false });

// ─── constants ────────────────────────────────────────────────────────────────

const ROLES: Array<'All' | MemberRole> = ['All', 'Teacher', 'Student', 'School', 'Wellness Practitioner'];

const ROLE_STYLES: Record<string, { badge: string; bar: string; dot: string }> = {
  Teacher:               { badge: 'bg-teal-50 text-teal-700',    bar: 'bg-teal-400',   dot: 'bg-teal-500' },
  Student:               { badge: 'bg-blue-50 text-blue-700',    bar: 'bg-blue-400',   dot: 'bg-blue-500' },
  School:                { badge: 'bg-purple-50 text-purple-700', bar: 'bg-purple-400', dot: 'bg-purple-500' },
  'Wellness Practitioner':{ badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-400', dot: 'bg-emerald-500' },
};

// ─── MultiSelect dropdown ─────────────────────────────────────────────────────

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border transition-colors ${
          value.length > 0
            ? 'border-[#4E87A0] bg-[#4E87A0]/5 text-[#3A7190] font-semibold'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        }`}
      >
        <span className="truncate">
          {value.length === 0 ? `All ${label}` : `${label}: ${value.length} selected`}
        </span>
        <svg
          className={`w-3.5 h-3.5 ml-1 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-[#4E87A0] w-3.5 h-3.5"
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Verified badge ──────────────────────────────────────────────────────────

const VerifiedBadge = () => (
  <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// ─── Compact sidebar card ─────────────────────────────────────────────────────

function CompactCard({
  member,
  highlighted,
  onSelect,
}: {
  member: (typeof members)[0];
  highlighted: boolean;
  onSelect: (id: string) => void;
}) {
  const style = ROLE_STYLES[member.role];
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlighted]);

  return (
    <button
      ref={ref}
      onClick={() => onSelect(member.id)}
      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors border-l-2 ${
        highlighted
          ? 'bg-[#4E87A0]/8 border-l-[#4E87A0]'
          : 'border-l-transparent hover:bg-slate-50'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.photo}
        alt={member.name}
        className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-slate-900 text-[13px] truncate leading-tight">
            {member.name}
          </span>
          {member.featured && (
            <svg className="w-3 h-3 text-[#4E87A0] shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
          {member.is_verified && <VerifiedBadge />}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>
            {member.role === 'Wellness Practitioner' ? 'Wellness' : member.role}
          </span>
          <span className="text-[10px] text-slate-400 truncate">{member.city}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Full card (center grid) ──────────────────────────────────────────────────

function FullCard({
  member,
  highlighted,
  onSelect,
}: {
  member: (typeof members)[0];
  highlighted: boolean;
  onSelect: (id: string) => void;
}) {
  const style = ROLE_STYLES[member.role];
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlighted]);

  return (
    <Link
      href={`/members/${member.id}`}
      ref={ref}
      className={`group relative bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 cursor-pointer ${
        highlighted
          ? 'border-[#4E87A0] shadow-lg shadow-[#4E87A0]/10 ring-1 ring-[#4E87A0]'
          : 'border-slate-100 shadow-sm hover:shadow-lg'
      }`}
    >
      <div className={`h-1 ${style.bar}`} />
      <div className="p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.photo}
              alt={member.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
            />
            {member.featured && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#4E87A0] rounded-full flex items-center justify-center ring-1 ring-white">
                <svg className="w-2.5 h-2.5 text-[#1B3A5C]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm truncate leading-snug flex items-center gap-1">
              {member.name}
              {member.is_verified && <VerifiedBadge />}
            </h3>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${style.badge}`}>
              <span className={`w-1 h-1 rounded-full ${style.dot}`} />
              {member.role}
            </span>
          </div>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onSelect(member.id); }}
            className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#4E87A0]/10 flex items-center justify-center text-slate-400 hover:text-[#4E87A0] transition-colors"
            title="Show on map"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-2">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {member.city}, {member.country}
        </div>

        {/* Designations */}
        {member.designations.filter(d => d !== 'GOYA Member').length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {member.designations.filter(d => d !== 'GOYA Member').slice(0, 2).map(d => (
              <span key={d} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                {d}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 flex-1 mb-3">
          {member.bio}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <span className="text-[10px] text-slate-400">Since {member.memberSince}</span>
          <span className="text-[11px] font-semibold text-[#4E87A0] group-hover:text-[#3A7190] flex items-center gap-0.5 transition-colors">
            View Profile
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const [roleFilter, setRoleFilter] = useState<'All' | MemberRole>('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [designationFilter, setDesignationFilter] = useState<string[]>([]);
  const [styleFilter, setStyleFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const clearFilters = () => {
    setRoleFilter('All');
    setCountryFilter('All');
    setDesignationFilter([]);
    setStyleFilter([]);
    setSearch('');
  };

  const hasFilters = roleFilter !== 'All' || countryFilter !== 'All' ||
    designationFilter.length > 0 || styleFilter.length > 0 || search !== '';

  const filtered = useMemo(() => members.filter(m => {
    if (roleFilter !== 'All' && m.role !== roleFilter) return false;
    if (countryFilter !== 'All' && m.country !== countryFilter) return false;
    if (designationFilter.length > 0 && !designationFilter.some(d => m.designations.includes(d))) return false;
    if (styleFilter.length > 0 && !styleFilter.some(s => m.teachingStyles.includes(s))) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.name.toLowerCase().includes(q) &&
          !m.city.toLowerCase().includes(q) &&
          !m.country.toLowerCase().includes(q) &&
          !m.bio.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [roleFilter, countryFilter, designationFilter, styleFilter, search]);

  const handleSelect = useCallback((id: string) => {
    setHighlightedId(prev => prev === id ? null : id);
  }, []);

  // ── Mobile layout ──────────────────────────────────────────────────────────
  const MobileLayout = (
    <div className="lg:hidden">
      <PageHero
        pill="Community"
        title="Member Directory"
        subtitle="Connect with yoga teachers, students, and wellness practitioners worldwide."
      />
      {/* Mobile filters */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 space-y-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Search members..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map(role => (
            <button key={role} onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                roleFilter === role ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {role === 'All' ? 'All' : role}
            </button>
          ))}
        </div>
      </div>
      {/* Mobile map panel */}
      {mobileMapOpen && (
        <div className="relative w-full" style={{ height: '60vh' }}>
          <button
            onClick={() => setMobileMapOpen(false)}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900"
            aria-label="Close map"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <MapPanel
            allMembers={members}
            filteredMembers={filtered}
            highlightedId={highlightedId}
            onMemberClick={handleSelect}
            isVisible={mobileMapOpen}
          />
        </div>
      )}
      {/* Mobile grid */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-800">{filtered.length}</span> of {members.length} members
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(m => (
            <FullCard key={m.id} member={m} highlighted={highlightedId === m.id} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Desktop three-panel layout ─────────────────────────────────────────────
  const DesktopLayout = (
    <div className="hidden lg:block">
      <PageHero
        pill="Community"
        title="Member Directory"
        subtitle="Connect with yoga teachers, students, and wellness practitioners worldwide."
      />
      <div className="flex flex-col overflow-hidden h-[calc(100vh-23rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[#1B3A5C]">Member Directory</h1>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {filtered.length} / {members.length}
          </span>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-[#4E87A0] hover:text-[#3A7190] font-semibold flex items-center gap-1 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>
        <button
          onClick={() => setMapOpen(o => !o)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            mapOpen
              ? 'bg-[#1B3A5C] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
          {mapOpen ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {/* Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Filters + compact list — 25% */}
        <div className="shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden" style={{ width: '25%' }}>
          {/* Filters */}
          <div className="p-3 border-b border-slate-100 space-y-2 shrink-0">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" placeholder="Search..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40 focus:border-[#4E87A0]"
              />
            </div>

            {/* Role pills */}
            <div className="flex flex-wrap gap-1">
              {ROLES.map(role => (
                <button key={role} onClick={() => setRoleFilter(role)}
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all border ${
                    roleFilter === role
                      ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {role === 'All' ? 'All' : role === 'Wellness Practitioner' ? 'Wellness' : role}
                </button>
              ))}
            </div>

            {/* Country */}
            <select
              value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40 bg-white text-slate-700"
            >
              {allCountries.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>
              ))}
            </select>

            {/* Designation multiselect */}
            <MultiSelect
              label="Designations"
              options={allDesignations}
              value={designationFilter}
              onChange={setDesignationFilter}
            />

            {/* Teaching style multiselect */}
            <MultiSelect
              label="Styles"
              options={allTeachingStyles}
              value={styleFilter}
              onChange={setStyleFilter}
            />
          </div>

          {/* Compact list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No members match</div>
            ) : (
              filtered.map(m => (
                <CompactCard
                  key={m.id}
                  member={m}
                  highlighted={highlightedId === m.id}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </div>

        {/* CENTER: card grid — hidden when map is open */}
        {!mapOpen && (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-5 min-w-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="font-medium text-sm">No members found</p>
                <button onClick={clearFilters} className="mt-2 text-xs text-[#4E87A0] hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
                {filtered.map(m => (
                  <FullCard key={m.id} member={m} highlighted={highlightedId === m.id} onSelect={handleSelect} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* RIGHT: Map — 75% when open (sidebar takes 25%) */}
        <div
          className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-l border-slate-200"
          style={{ width: mapOpen ? '75%' : '0px' }}
        >
          <MapPanel
            allMembers={members}
            filteredMembers={filtered}
            highlightedId={highlightedId}
            onMemberClick={handleSelect}
            isVisible={mapOpen}
          />
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <>
      {MobileLayout}
      {DesktopLayout}

      {/* Mobile FAB — map toggle, hidden on md+ */}
      <button
        onClick={() => setMobileMapOpen(o => !o)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-[52px] h-[52px] rounded-full bg-[#4E87A0] text-white flex items-center justify-center shadow-lg shadow-[#4E87A0]/40 hover:bg-[#3A7190] active:scale-95 transition-all"
        aria-label={mobileMapOpen ? 'Close map' : 'Show map'}
      >
        {mobileMapOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
        )}
      </button>
    </>
  );
}
