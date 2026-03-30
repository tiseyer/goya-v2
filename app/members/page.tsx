'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ROLE_BADGE } from '@/app/components/ui/Badge';
import { type MemberRole, type Member } from '@/lib/members-data';
import { fetchMembers } from '@/lib/members-actions';

const MapPanel = dynamic(() => import('./MapPanel'), { ssr: false });

// ─── constants ────────────────────────────────────────────────────────────────

const ROLES: Array<'All' | MemberRole> = ['All', 'Teacher', 'Student', 'School', 'Wellness Practitioner'];

const ROLE_SHORT: Record<string, string> = {
  'Wellness Practitioner': 'Wellness',
};

const getMemberBadge = (role: string) =>
  ROLE_BADGE[role] ?? ROLE_BADGE['Wellness'] ?? 'bg-primary-50 text-primary border-primary-100';

// ─── Avatar placeholder ───────────────────────────────────────────────────────

function Avatar({ src, name, size = 48, className = '' }: { src?: string; name: string; size?: number; className?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-primary-100 dark:bg-primary-dark/30 flex items-center justify-center text-primary dark:text-primary-light font-semibold ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

// ─── Verified badge ───────────────────────────────────────────────────────────

const VerifiedBadge = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} className="text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${
        active
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-surface text-foreground-secondary border-goya-border hover:border-primary/40 hover:text-primary'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Multi-chip filter (expandable) ───────────────────────────────────────────

function ChipGroup({ options, selected, onChange, label, defaultCollapsed = true }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; label: string; defaultCollapsed?: boolean }) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const visible = options.slice(0, expanded ? options.length : 6);
  const toggle = (opt: string) => onChange(selected.includes(opt) ? selected.filter(v => v !== opt) : [...selected, opt]);

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(opt => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
              selected.includes(opt) ? 'bg-primary/10 text-primary border-primary/25' : 'bg-surface text-foreground-secondary border-goya-border hover:border-primary/30'
            }`}
          >{opt}</button>
        ))}
        {options.length > 6 && (
          <button onClick={() => setExpanded(!expanded)} className="px-2.5 py-1 rounded-full text-[11px] font-medium text-primary hover:text-primary-dark transition-colors">
            {expanded ? 'Show less' : `+${options.length - 6} more`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Searchable country dropdown ──────────────────────────────────────────────

function CountrySelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = query ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())) : options;
  const toggle = (opt: string) => onChange(selected.includes(opt) ? selected.filter(v => v !== opt) : [...selected, opt]);

  return (
    <div ref={ref} className="relative">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">Country</div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-surface border border-goya-border rounded-xl hover:border-primary/40 transition-colors text-left"
      >
        <span className={selected.length === 0 ? 'text-foreground-tertiary' : 'text-foreground'}>
          {selected.length === 0 ? 'All countries' : `${selected.length} selected`}
        </span>
        <svg className={`w-4 h-4 text-foreground-tertiary transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(c => (
            <button key={c} onClick={() => toggle(c)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
              {c}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-goya-border rounded-xl shadow-elevated overflow-hidden">
          <div className="p-2 border-b border-goya-border">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-2.5 py-1.5 text-xs bg-background border border-goya-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-foreground-tertiary"
            />
          </div>
          <div className="overflow-y-auto max-h-48 p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-foreground-tertiary">No countries found</div>
            ) : filtered.map(country => (
              <button
                key={country}
                onClick={() => toggle(country)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-surface-muted transition-colors text-left"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(country) ? 'bg-primary border-primary' : 'border-goya-border'}`}>
                  {selected.includes(country) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </span>
                <span className="text-foreground">{country}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────

const CARD_HEIGHT = 152;
const AVATAR_SIZE = 56;

function MemberCard({ member, highlighted, onSelect }: { member: Member; highlighted: boolean; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (highlighted && ref.current) ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [highlighted]);
  const intro = member.introduction || member.bio;
  const truncatedIntro = intro && intro.length > 180 ? intro.slice(0, 177) + '...' : intro;

  return (
    <button ref={ref} onClick={() => onSelect(member.id)}
      className={`w-full text-left px-5 py-4 transition-all group overflow-hidden ${highlighted ? 'bg-primary-50 dark:bg-primary/10' : 'hover:bg-surface-muted'}`}
      style={{ height: CARD_HEIGHT }}>
      <div className="flex gap-3.5 h-full">
        <Avatar src={member.photo} name={member.name} size={AVATAR_SIZE} className="shrink-0 ring-2 ring-goya-border" />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-foreground text-[14px] leading-tight truncate">{member.name}</h3>
            {member.is_verified && <VerifiedBadge size={14} />}
            {member.featured && (
              <svg className="w-3.5 h-3.5 text-primary-light shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-foreground-tertiary text-[11px] mb-1.5">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {member.city}, {member.country}
          </div>
          <div className="flex flex-wrap gap-1 mb-1.5">
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getMemberBadge(member.role)}`}>
              {ROLE_SHORT[member.role] ?? member.role}
            </span>
            {member.designations.filter(d => d !== 'GOYA Member').slice(0, 2).map(d => (
              <span key={d} className="text-[10px] bg-background-tertiary text-foreground-secondary px-2 py-0.5 rounded-full font-medium">{d}</span>
            ))}
          </div>
          {truncatedIntro && <p className="text-foreground-secondary text-[12px] leading-relaxed line-clamp-2 flex-1">{truncatedIntro}</p>}
        </div>
      </div>
    </button>
  );
}

// ─── Inline profile view ──────────────────────────────────────────────────────

function InlineProfile({ member, onBack }: { member: Member; onBack: () => void }) {
  const ROLE_MAP: Record<string, string> = { Teacher: 'Certified Teacher', Student: 'Student Practitioner', School: 'School', 'Wellness Practitioner': 'Wellness Practitioner' };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center justify-between px-4 py-3 border-b border-goya-border shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-foreground transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <Link href={`/members/${member.id}`} className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
          Full profile &rarr;
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-8 pb-6 text-center">
          <Avatar src={member.photo} name={member.name} size={96} className="mx-auto ring-3 ring-goya-border mb-4" />
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-foreground">{member.name}</h2>
            {member.is_verified && <VerifiedBadge size={18} />}
          </div>
          <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${getMemberBadge(member.role)}`}>
            {ROLE_MAP[member.role] ?? member.role}
          </span>
          <div className="flex items-center justify-center gap-1.5 text-foreground-tertiary text-sm mt-3">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {member.city}, {member.country}
          </div>
        </div>
        {member.designations.filter(d => d !== 'GOYA Member').length > 0 && (
          <div className="px-6 pb-5">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {member.designations.filter(d => d !== 'GOYA Member').map(d => (
                <span key={d} className="text-xs bg-background-tertiary text-foreground-secondary px-3 py-1 rounded-full font-medium">{d}</span>
              ))}
            </div>
          </div>
        )}
        {member.bio && (
          <div className="px-6 pb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">About</h3>
            <p className="text-foreground-secondary text-sm leading-relaxed">{member.bio}</p>
          </div>
        )}
        {member.teachingStyles.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">
              {member.role === 'Teacher' ? 'Teaching Styles' : 'Practice Styles'}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {member.teachingStyles.map(s => (
                <span key={s} className="bg-primary/8 text-primary border border-primary/15 text-xs font-medium px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
        {member.specialties.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">Specialties</h3>
            <div className="flex flex-wrap gap-1.5">
              {member.specialties.map(s => (
                <span key={s} className="bg-background-tertiary text-foreground-secondary text-xs font-medium px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
        <div className="px-6 pb-6 border-t border-goya-border pt-5">
          <div className="flex items-center gap-2 text-xs text-foreground-tertiary mb-4">
            <span>Member since {member.memberSince}</span>
          </div>
          <div className="flex gap-2">
            {member.social.website && (
              <a href={member.social.website} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-background-tertiary flex items-center justify-center text-foreground-secondary hover:text-primary hover:bg-primary/8 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </a>
            )}
            {member.social.instagram && (
              <a href={member.social.instagram.startsWith('http') ? member.social.instagram : `https://instagram.com/${member.social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-background-tertiary flex items-center justify-center text-foreground-secondary hover:text-primary hover:bg-primary/8 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            )}
            {member.social.youtube && (
              <a href={member.social.youtube.startsWith('http') ? member.social.youtube : `https://youtube.com/${member.social.youtube}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-background-tertiary flex items-center justify-center text-foreground-secondary hover:text-primary hover:bg-primary/8 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" /></svg>
              </a>
            )}
          </div>
          <Link href={`/members/${member.id}`} className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">
            View Full Profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Resizable divider ────────────────────────────────────────────────────────

function ResizeDivider({ onDrag }: { onDrag: (deltaX: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastX.current = e.clientX;
    const onMouseMove = (e: MouseEvent) => { if (!dragging.current) return; onDrag(e.clientX - lastX.current); lastX.current = e.clientX; };
    const onMouseUp = () => { dragging.current = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [onDrag]);

  return (
    <div onMouseDown={onMouseDown} className="w-1 hover:w-1.5 bg-goya-border hover:bg-primary/30 cursor-col-resize transition-all shrink-0 relative group">
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-foreground-tertiary/40 group-hover:bg-primary/50 transition-colors" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allDesignations, setAllDesignations] = useState<string[]>([]);
  const [allTeachingStyles, setAllTeachingStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<'All' | MemberRole>('All');
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [designationFilter, setDesignationFilter] = useState<string[]>([]);
  const [styleFilter, setStyleFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [listWidth, setListWidth] = useState(440);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [mobileProfileMember, setMobileProfileMember] = useState<Member | null>(null);

  useEffect(() => {
    fetchMembers().then(({ members, allDesignations, allTeachingStyles }) => {
      setAllMembers(members);
      setAllDesignations(allDesignations);
      setAllTeachingStyles(allTeachingStyles);
      setLoading(false);
    });
  }, []);

  const clearFilters = () => { setRoleFilter('All'); setCountryFilter([]); setDesignationFilter([]); setStyleFilter([]); setSearch(''); };
  const hasFilters = roleFilter !== 'All' || countryFilter.length > 0 || designationFilter.length > 0 || styleFilter.length > 0 || search !== '';

  const filtered = useMemo(() => allMembers.filter(m => {
    if (roleFilter !== 'All' && m.role !== roleFilter) return false;
    if (countryFilter.length > 0 && !countryFilter.includes(m.country)) return false;
    if (designationFilter.length > 0 && !designationFilter.some(d => m.designations.includes(d))) return false;
    if (styleFilter.length > 0 && !styleFilter.some(s => m.teachingStyles.includes(s))) return false;
    if (search) { const q = search.toLowerCase(); if (!m.name.toLowerCase().includes(q) && !m.city.toLowerCase().includes(q) && !m.country.toLowerCase().includes(q) && !m.bio.toLowerCase().includes(q)) return false; }
    return true;
  }), [allMembers, roleFilter, countryFilter, designationFilter, styleFilter, search]);

  // Track member_search when filters change (debounced)
  useEffect(() => {
    if (!hasFilters) return;
    const timer = setTimeout(() => {
      try {
        import('@/lib/analytics/tracking').then(({ trackMemberSearch }) => {
          trackMemberSearch({ role_filter: roleFilter, has_designation_filter: designationFilter.length > 0 });
        });
      } catch { /* analytics non-critical */ }
    }, 1000);
    return () => clearTimeout(timer);
  }, [roleFilter, countryFilter, designationFilter, styleFilter, search, hasFilters]);

  const availableCountries = useMemo(() => Array.from(new Set(allMembers.map(m => m.country))).sort(), [allMembers]);

  const handleSelect = useCallback((id: string) => {
    setHighlightedId(prev => prev === id ? null : id);
    const member = allMembers.find(m => m.id === id);
    if (member) setSelectedMember(prev => prev?.id === id ? null : member);
  }, [allMembers]);

  const handleMobileSelect = useCallback((id: string) => { const member = allMembers.find(m => m.id === id); if (member) setMobileProfileMember(member); }, [allMembers]);
  const handleBack = useCallback(() => { setSelectedMember(null); setHighlightedId(null); }, []);
  const handleResize = useCallback((delta: number) => { setListWidth(prev => Math.max(280, Math.min(700, prev + delta))); }, []);
  const handleMapMemberClick = useCallback((id: string) => { setHighlightedId(id); const member = allMembers.find(m => m.id === id); if (member) setSelectedMember(member); }, [allMembers]);

  // ── Filters panel ───────────────────────────────────────────────────────────
  const filtersContent = (
    <div className="space-y-5">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface border border-goya-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-foreground placeholder:text-foreground-tertiary" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <div className="text-xs text-foreground-tertiary font-medium tabular-nums">{filtered.length} of {allMembers.length} members</div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">Role</div>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map(role => <FilterChip key={role} label={role === 'All' ? 'All' : ROLE_SHORT[role] ?? role} active={roleFilter === role} onClick={() => setRoleFilter(role)} />)}
        </div>
      </div>
      <CountrySelect options={availableCountries} selected={countryFilter} onChange={setCountryFilter} />
      <ChipGroup label="Designation" options={allDesignations} selected={designationFilter} onChange={setDesignationFilter} />
      <ChipGroup label="Style" options={allTeachingStyles} selected={styleFilter} onChange={setStyleFilter} defaultCollapsed />
      {hasFilters && (
        <button onClick={clearFilters} className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Clear all filters
        </button>
      )}
    </div>
  );

  // ── Mobile layout ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden h-[calc(100vh-64px)] flex flex-col bg-background overflow-hidden">
        {mobileProfileMember && (
          <div className="fixed inset-0 z-50 bg-background"><InlineProfile member={mobileProfileMember} onBack={() => setMobileProfileMember(null)} /></div>
        )}
        {mobileMapOpen && (
          <div className="fixed inset-0 z-40 bg-background">
            <div className="absolute top-4 left-4 z-10">
              <button onClick={() => setMobileMapOpen(false)} className="w-10 h-10 rounded-full bg-surface shadow-elevated flex items-center justify-center text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <MapPanel allMembers={allMembers} filteredMembers={filtered} highlightedId={highlightedId}
              onMemberClick={(id) => { const m = allMembers.find(x => x.id === id); if (m) { setMobileMapOpen(false); setMobileProfileMember(m); } }} isVisible={mobileMapOpen} />
          </div>
        )}
        <div className="px-4 pt-4 pb-3 border-b border-goya-border bg-surface shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground">Members</h1>
            <span className="text-xs text-foreground-tertiary font-medium">{filtered.length} of {allMembers.length}</span>
          </div>
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm bg-background border border-goya-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-foreground-tertiary" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ROLES.map(role => <FilterChip key={role} label={role === 'All' ? 'All' : ROLE_SHORT[role] ?? role} active={roleFilter === role} onClick={() => setRoleFilter(role)} />)}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-goya-border">
          {loading ? (
            <div className="py-16 text-center text-foreground-tertiary">
              <p className="text-sm font-medium animate-pulse">Loading members...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-foreground-tertiary">
              <p className="text-sm font-medium">{allMembers.length === 0 ? 'No members found' : 'No members match your filters'}</p>
              {hasFilters && <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">Clear filters</button>}
            </div>
          ) : filtered.map(m => <MemberCard key={m.id} member={m} highlighted={false} onSelect={handleMobileSelect} />)}
        </div>
        <button onClick={() => setMobileMapOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-white text-sm font-semibold shadow-elevated hover:bg-primary-dark active:scale-95 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Show Map
        </button>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Filters */}
          <div className="w-[260px] shrink-0 border-r border-goya-border bg-surface overflow-y-auto">
            <div className="px-4 pt-4 pb-4">{filtersContent}</div>
          </div>
          {/* Middle: List / Profile */}
          <div className="overflow-hidden flex flex-col border-r border-goya-border" style={{ width: listWidth, minWidth: 280 }}>
            {selectedMember ? (
              <InlineProfile member={selectedMember} onBack={handleBack} />
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-goya-border-muted">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-foreground-tertiary py-16">
                    <p className="font-medium text-sm animate-pulse">Loading members...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-foreground-tertiary py-16">
                    <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="font-medium text-sm">{allMembers.length === 0 ? 'No members found' : 'No members match your filters'}</p>
                    {hasFilters && <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">Clear filters</button>}
                  </div>
                ) : filtered.map(m => <MemberCard key={m.id} member={m} highlighted={highlightedId === m.id} onSelect={handleSelect} />)}
              </div>
            )}
          </div>
          <ResizeDivider onDrag={handleResize} />
          {/* Right: Map */}
          <div className="flex-1 min-w-0">
            <MapPanel allMembers={allMembers} filteredMembers={filtered} highlightedId={highlightedId} onMemberClick={handleMapMemberClick} isVisible={true} />
          </div>
        </div>
      </div>
    </>
  );
}
