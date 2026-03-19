'use client';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'url';
  required?: boolean;
  helpText?: string;
}

export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  helpText,
}: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#1B3A5C]">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1B3A5C] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/40 focus:border-[#4E87A0] transition-colors"
      />
      {helpText && (
        <p className="text-xs text-slate-400">{helpText}</p>
      )}
    </div>
  );
}
