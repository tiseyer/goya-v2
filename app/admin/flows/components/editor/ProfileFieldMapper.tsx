'use client';

const PROFILE_FIELDS = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'display_name', label: 'Display Name' },
  { value: 'bio', label: 'Bio' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'phone', label: 'Phone' },
  { value: 'country', label: 'Country' },
  { value: 'city', label: 'City' },
  { value: 'timezone', label: 'Timezone' },
  { value: 'language', label: 'Language' },
  { value: 'role', label: 'Role' },
] as const;

interface ProfileFieldMapperProps {
  elementKey: string;
  currentMapping: string | null;
  onChange: (field: string | null) => void;
}

export default function ProfileFieldMapper({
  elementKey,
  currentMapping,
  onChange,
}: ProfileFieldMapperProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange(value === '' ? null : value);
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={`profile-field-${elementKey}`}
        className="block text-xs font-medium text-slate-600"
      >
        Save to Profile Field
      </label>
      <select
        id={`profile-field-${elementKey}`}
        value={currentMapping ?? ''}
        onChange={handleChange}
        className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
      >
        <option value="">None</option>
        {PROFILE_FIELDS.map((field) => (
          <option key={field.value} value={field.value}>
            {field.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-400">
        When this flow completes, the answer will be saved to the user&apos;s profile.
      </p>
    </div>
  );
}
