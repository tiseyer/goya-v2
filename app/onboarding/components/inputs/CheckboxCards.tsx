'use client';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  maxSelect?: number;
}

export default function CheckboxCards({ options, value, onChange, maxSelect }: Props) {
  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter(x => x !== v));
    } else {
      if (maxSelect && value.length >= maxSelect) return;
      onChange([...value, v]);
    }
  }

  const limitReached = !!maxSelect && value.length >= maxSelect;

  return (
    <div className="space-y-3">
      {maxSelect && (
        <p className="text-xs text-slate-500 font-medium">
          {value.length} of {maxSelect} selected
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => {
          const isSelected = value.includes(opt.value);
          const isDisabled = !isSelected && limitReached;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              disabled={isDisabled}
              className={`text-left px-3.5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'text-[#1B3A5C]'
                  : isDisabled
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-40'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
              style={isSelected ? { borderColor: '#9e6b7a', background: 'rgba(158,107,122,0.05)' } : undefined}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors"
                  style={isSelected ? { borderColor: '#9e6b7a', background: '#9e6b7a' } : { borderColor: '#cbd5e1' }}
                >
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {opt.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
