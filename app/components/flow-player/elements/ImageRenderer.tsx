'use client';

import { FlowElement } from '@/lib/flows/types';

interface ElementRendererProps {
  element: FlowElement;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export default function ImageRenderer({ element }: ElementRendererProps) {
  if (element.type !== 'image') return null;

  return (
    <div className="space-y-2">
      {element.label && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{element.label}</p>
      )}
      <img
        src={element.src}
        alt={element.alt}
        className="max-w-full rounded-lg"
      />
      {element.help_text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{element.help_text}</p>
      )}
    </div>
  );
}
