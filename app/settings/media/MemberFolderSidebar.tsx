'use client';

// Static folder sidebar for member media library.
// Shows fixed categories only — no folder management controls.

interface MemberFolderSidebarProps {
  activeFolder: string | null; // null = All Files
  onFolderSelect: (folder: string | null) => void;
  collapsed: boolean;
  onCollapse: () => void;
}

// Static folder list for member view — bucket keys + labels
const MEMBER_FOLDERS = [
  { key: 'avatars',              label: 'Avatars',      dot: 'bg-violet-400' },
  { key: 'upgrade-certificates', label: 'Certificates', dot: 'bg-amber-400' },
  { key: 'uploads',              label: 'Uploads',      dot: 'bg-slate-400' },
] as const;

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function AllFilesIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2 : 1.75}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MemberFolderSidebar({
  activeFolder,
  onFolderSelect,
  collapsed,
  onCollapse,
}: MemberFolderSidebarProps) {
  const allActive = activeFolder === null;

  return (
    <aside
      style={{ width: collapsed ? '56px' : '200px' }}
      className="h-full flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
    >
      {/* Header */}
      <div className="flex items-center h-12 px-2 border-b border-slate-200 shrink-0">
        <button
          onClick={onCollapse}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-50 transition-colors cursor-pointer shrink-0"
          aria-label={collapsed ? 'Expand folder sidebar' : 'Collapse folder sidebar'}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
        {!collapsed && (
          <span className="ml-2 text-sm font-semibold text-primary-dark whitespace-nowrap overflow-hidden">
            Folders
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* All Files */}
        <button
          onClick={() => onFolderSelect(null)}
          title={collapsed ? 'All Files' : undefined}
          className={[
            'w-full flex items-center gap-2 rounded-lg transition-colors duration-150 cursor-pointer',
            collapsed ? 'justify-center px-2 py-2' : 'px-2 py-2',
            allActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
          ].join(' ')}
        >
          <AllFilesIcon active={allActive} />
          {!collapsed && <span className="text-sm font-medium">All Files</span>}
        </button>

        {/* Divider */}
        <div className="my-2 mx-1 border-t border-slate-100" />

        {/* Static bucket folders */}
        {MEMBER_FOLDERS.map(({ key, label, dot }) => {
          const isActive = activeFolder === key;
          return collapsed ? (
            <button
              key={key}
              onClick={() => onFolderSelect(key)}
              title={label}
              className={[
                'w-full flex items-center justify-center px-2 py-2 rounded-lg transition-colors duration-150 cursor-pointer',
                isActive ? 'bg-primary/10' : 'hover:bg-primary-50',
              ].join(' ')}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
            </button>
          ) : (
            <button
              key={key}
              onClick={() => onFolderSelect(key)}
              className={[
                'w-full flex items-center px-2 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer group',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-slate-500 hover:text-primary-dark hover:bg-primary-50',
              ].join(' ')}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 mr-2 ${dot}`} />
              <span className="text-sm truncate text-left">{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
