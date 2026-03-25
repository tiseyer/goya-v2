'use client';

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  helpText?: string;
}

export default function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  rows = 5,
  helpText,
}: Props) {
  const len = value.length;
  const belowMin = minLength !== undefined && len < minLength;
  const atMax = maxLength !== undefined && len >= maxLength;

  let counterColor = 'text-slate-400';
  if (atMax) counterColor = 'text-red-500';
  else if (belowMin) counterColor = 'text-orange-400';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-[#1B3A5C]">{label}</label>
      )}
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1B3A5C] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9e6b7a]/40 focus:border-[#9e6b7a] transition-colors resize-none"
        />
        {maxLength && (
          <span className={`absolute bottom-2 right-3 text-xs ${counterColor}`}>
            {len}/{maxLength}
          </span>
        )}
      </div>
      {belowMin && (
        <p className="text-xs text-orange-400">
          Please add at least {minLength! - len} more character{minLength! - len !== 1 ? 's' : ''}
        </p>
      )}
      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
    </div>
  );
}
