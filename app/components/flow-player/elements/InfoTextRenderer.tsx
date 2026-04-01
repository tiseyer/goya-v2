'use client';

import { FlowElement } from '@/lib/flows/types';

interface ElementRendererProps {
  element: FlowElement;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export default function InfoTextRenderer({ element }: ElementRendererProps) {
  if (element.type !== 'info_text') return null;

  return (
    <div className="space-y-2">
      {element.label && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {element.label}
        </h3>
      )}
      <p
        className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"
      >
        {element.content}
      </p>
    </div>
  );
}
