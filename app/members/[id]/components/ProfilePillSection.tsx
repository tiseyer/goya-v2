const FORMAT_COLORS: Record<string, string> = {
  online: 'bg-[#10B981]/10 text-[#10B981]',
  in_person: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  hybrid: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  'Online': 'bg-[#10B981]/10 text-[#10B981]',
  'In-Person': 'bg-[#3B82F6]/10 text-[#3B82F6]',
  'Hybrid': 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
};

interface ProfilePillSectionProps {
  label: string;
  items: string[];
  formatType?: 'format';
}

export function ProfilePillSection({ label, items, formatType }: ProfilePillSectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const className =
            formatType === 'format'
              ? `rounded-full px-3 py-1 text-sm font-medium ${FORMAT_COLORS[item] ?? 'bg-[var(--goya-primary)]/10 text-[var(--goya-primary)]'}`
              : 'rounded-full bg-[var(--goya-primary)]/10 text-[var(--goya-primary)] px-3 py-1 text-sm font-medium';
          return (
            <span key={item} className={className}>
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}
