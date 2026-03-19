'use client';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  required?: boolean;
  min?: string;
  max?: string;
}

export default function DateInput({ label, value, onChange, helpText, required, min, max }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#1B3A5C]">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1B3A5C] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40 focus:border-[#4E87A0] transition-colors bg-white"
      />
      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
    </div>
  );
}
