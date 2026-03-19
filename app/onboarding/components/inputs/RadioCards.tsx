'use client';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface Props {
  options: Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
}

export default function RadioCards({ options, value, onChange, columns = 2 }: Props) {
  const gridCols = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {options.map(opt => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'bg-[#9e6b7a]/5'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            style={isSelected ? { borderColor: '#9e6b7a' } : undefined}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className={`font-semibold text-sm ${isSelected ? 'text-[#1B3A5C]' : 'text-slate-700'}`}>
                  {opt.label}
                </span>
                {opt.description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
                )}
              </div>
              <div
                className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={isSelected ? { borderColor: '#9e6b7a' } : { borderColor: '#cbd5e1' }}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full" style={{ background: '#9e6b7a' }} />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
