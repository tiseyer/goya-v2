'use client';

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  helpText?: string;
  required?: boolean;
  error?: string;
  rightElement?: React.ReactNode;
}

export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  helpText,
  required,
  error,
  rightElement,
}: Props) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-[#1B3A5C]">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border text-[#1B3A5C] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors"
          style={{
            borderColor: error ? '#f43f5e' : '#e2e8f0',
            '--tw-ring-color': 'rgba(158,107,122,0.4)',
          } as React.CSSProperties}
          onFocus={e => { e.currentTarget.style.borderColor = '#9e6b7a'; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? '#f43f5e' : '#e2e8f0'; }}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {helpText && !error && <p className="text-xs text-slate-400">{helpText}</p>}
    </div>
  );
}
