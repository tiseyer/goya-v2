'use client';

// ── View icons ────────────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

// ── Select helper ─────────────────────────────────────────────────────────────

const SELECT_CLS = [
  'h-8 pl-2.5 pr-7 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg',
  'appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2',
  'focus:ring-primary/30 focus:border-primary transition-colors duration-150',
].join(' ');

// ── MediaToolbar ──────────────────────────────────────────────────────────────

export interface MediaToolbarProps {
  q: string;
  type: 'all' | 'images' | 'pdfs' | 'videos';
  date: 'all' | 'today' | 'week' | 'month';
  by: 'all' | 'team' | 'members';
  sort: 'newest' | 'oldest' | 'name' | 'size';
  viewMode: 'grid' | 'list';
  onQChange: (value: string) => void;
  onTypeChange: (value: 'all' | 'images' | 'pdfs' | 'videos') => void;
  onDateChange: (value: 'all' | 'today' | 'week' | 'month') => void;
  onByChange: (value: 'all' | 'team' | 'members') => void;
  onSortChange: (value: 'newest' | 'oldest' | 'name' | 'size') => void;
  onViewModeChange: (value: 'grid' | 'list') => void;
}

export default function MediaToolbar({
  q,
  type,
  date,
  by,
  sort,
  viewMode,
  onQChange,
  onTypeChange,
  onDateChange,
  onByChange,
  onSortChange,
  onViewModeChange,
}: MediaToolbarProps) {
  return (
    <div className="h-14 border-b border-slate-200 bg-white flex items-center px-4 gap-2 shrink-0">
      {/* Search input */}
      <div className="relative flex-1 max-w-xs">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search files..."
          aria-label="Search files"
          className={[
            'w-full h-8 pl-8 pr-3 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg',
            'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30',
            'focus:border-primary transition-colors duration-150',
          ].join(' ')}
        />
      </div>

      {/* Filter: file type */}
      <div className="relative">
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as 'all' | 'images' | 'pdfs' | 'videos')}
          aria-label="Filter by file type"
          className={SELECT_CLS}
        >
          <option value="all">All files</option>
          <option value="images">Images</option>
          <option value="pdfs">PDFs</option>
          <option value="videos">Videos</option>
        </select>
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Filter: date */}
      <div className="relative">
        <select
          value={date}
          onChange={(e) => onDateChange(e.target.value as 'all' | 'today' | 'week' | 'month')}
          aria-label="Filter by date"
          className={SELECT_CLS}
        >
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Filter: uploaded by */}
      <div className="relative">
        <select
          value={by}
          onChange={(e) => onByChange(e.target.value as 'all' | 'team' | 'members')}
          aria-label="Filter by uploader"
          className={SELECT_CLS}
        >
          <option value="all">All users</option>
          <option value="team">GOYA team</option>
          <option value="members">Members</option>
        </select>
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" aria-hidden="true" />

      {/* Sort */}
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest' | 'name' | 'size')}
          aria-label="Sort order"
          className={SELECT_CLS}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A-Z</option>
          <option value="size">File size</option>
        </select>
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 ml-1">
        <button
          onClick={() => onViewModeChange('grid')}
          aria-label="Grid view"
          aria-pressed={viewMode === 'grid'}
          className={[
            'w-7 h-7 flex items-center justify-center rounded transition-colors duration-150 cursor-pointer',
            viewMode === 'grid'
              ? 'bg-primary/10 text-primary'
              : 'text-slate-400 hover:text-slate-600',
          ].join(' ')}
        >
          <GridIcon />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
          className={[
            'w-7 h-7 flex items-center justify-center rounded transition-colors duration-150 cursor-pointer',
            viewMode === 'list'
              ? 'bg-primary/10 text-primary'
              : 'text-slate-400 hover:text-slate-600',
          ].join(' ')}
        >
          <ListIcon />
        </button>
      </div>
    </div>
  );
}
