'use client';

import { useState } from 'react';
import { FlowElement } from '@/lib/flows/types';

interface ElementRendererProps {
  element: FlowElement;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export default function ShortTextRenderer({ element, value, onChange, disabled }: ElementRendererProps) {
  const [touched, setTouched] = useState(false);

  if (element.type !== 'short_text') return null;

  const strValue = typeof value === 'string' ? value : '';
  const showRequired = touched && element.required && strValue === '';

  return (
    <div className="space-y-1.5">
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {element.label}
          {element.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="text"
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        disabled={disabled}
        placeholder={element.label ?? undefined}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {element.help_text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{element.help_text}</p>
      )}
      {showRequired && (
        <p className="text-sm text-red-500">Required</p>
      )}
    </div>
  );
}
