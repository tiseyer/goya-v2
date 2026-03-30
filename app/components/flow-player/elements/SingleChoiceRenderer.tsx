'use client';

import { Check } from 'lucide-react';
import { FlowElement } from '@/lib/flows/types';

interface ElementRendererProps {
  element: FlowElement;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export default function SingleChoiceRenderer({ element, value, onChange, disabled }: ElementRendererProps) {
  if (element.type !== 'single_choice') return null;

  const selectedValue = typeof value === 'string' ? value : '';

  return (
    <div className="space-y-2">
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {element.label}
          {element.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="space-y-2">
        {element.options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={[
                'w-full flex items-center justify-between rounded-xl border-2 py-3 px-4 text-left transition-all',
                isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--goya-primary-50)] dark:bg-[var(--goya-primary-50)]'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              <span className={[
                'text-base',
                isSelected
                  ? 'text-gray-900 dark:text-gray-900 font-medium'
                  : 'text-gray-700 dark:text-gray-300',
              ].join(' ')}>
                {option.label}
              </span>
              {isSelected && (
                <Check
                  className="shrink-0 ml-3 text-[var(--color-primary)]"
                  size={20}
                  strokeWidth={2.5}
                />
              )}
            </button>
          );
        })}
      </div>
      {element.help_text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{element.help_text}</p>
      )}
    </div>
  );
}
