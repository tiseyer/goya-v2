'use client';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  helpText?: string;
  required?: boolean;
}

export default function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  helpText,
  required,
}: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[#1B3A5C]">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        {maxLength && (
          <span className={`text-xs ${value.length > maxLength * 0.9 ? 'text-amber-500' : 'text-slate-400'}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1B3A5C] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40 focus:border-[#4E87A0] transition-colors resize-none"
      />
      {helpText && (
        <p className="text-xs text-slate-400">{helpText}</p>
      )}
    </div>
  );
}
