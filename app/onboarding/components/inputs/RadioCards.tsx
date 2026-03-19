'use client';

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface Props<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
}

export default function RadioCards<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-semibold text-[#1B3A5C]">{label}</p>
      )}
      <div className="space-y-2.5">
        {options.map(opt => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#4E87A0] bg-[#4E87A0]/5'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {opt.icon && (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#4E87A0] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {opt.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${isSelected ? 'text-[#1B3A5C]' : 'text-slate-700'}`}>
                      {opt.label}
                    </span>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      isSelected ? 'border-[#4E87A0]' : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#4E87A0]" />
                      )}
                    </div>
                  </div>
                  {opt.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
