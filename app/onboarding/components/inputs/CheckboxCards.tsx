'use client';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  maxSelect?: number;
}

export default function CheckboxCards({ label, options, value, onChange, maxSelect }: Props) {
  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter(x => x !== v));
    } else {
      if (maxSelect && value.length >= maxSelect) return;
      onChange([...value, v]);
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1B3A5C]">{label}</p>
          {maxSelect && (
            <span className="text-xs text-slate-400">Select up to {maxSelect}</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => {
          const isSelected = value.includes(opt.value);
          const isDisabled = !isSelected && !!maxSelect && value.length >= maxSelect;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              disabled={isDisabled}
              className={`text-left px-3.5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-[#4E87A0] bg-[#4E87A0]/5 text-[#1B3A5C]'
                  : isDisabled
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-[#4E87A0] bg-[#4E87A0]' : 'border-slate-300'
                }`}>
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
