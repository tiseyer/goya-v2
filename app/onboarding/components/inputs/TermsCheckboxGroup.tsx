'use client';

const TERMS = [
  { label: 'I agree to abide by the GOYA Code of Conduct.', href: '/code-of-conduct' },
  { label: 'I agree to abide by the GOYA Code of Ethics.', href: '/code-of-ethics' },
  { label: 'I agree to the GOYA Privacy Policy.', href: '/privacy-policy' },
  { label: 'I agree to the GOYA Terms of Use.', href: '/terms-of-use' },
];

interface Props {
  value: boolean[];
  onChange: (index: number, checked: boolean) => void;
}

export default function TermsCheckboxGroup({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      {TERMS.map((term, i) => (
        <label key={i} className="flex items-start gap-3 cursor-pointer group">
          <div className="mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={value[i] ?? false}
              onChange={e => onChange(i, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-[#9e6b7a] cursor-pointer"
            />
          </div>
          <span className="text-sm text-slate-700 leading-relaxed">
            {term.label.replace(/ (GOYA .+)\.$/, ' ')}{' '}
            <a
              href={term.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#1B3A5C] hover:text-[#9e6b7a] transition-colors"
              onClick={e => e.stopPropagation()}
            >
              {term.label.match(/(GOYA .+)\./)?.[1]}
            </a>.
          </span>
        </label>
      ))}
      <p className="text-xs text-slate-400 mt-2">GOYA operates under Canadian law.</p>
    </div>
  );
}
