'use client';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  helpText?: string;
}

export default function SelectInput({ label, value, onChange, options, placeholder, helpText }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#1B3A5C]">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-slate-200 text-[#1B3A5C] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40 focus:border-[#4E87A0] transition-colors bg-white"
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
    </div>
  );
}
