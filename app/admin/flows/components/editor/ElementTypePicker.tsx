'use client';

import { useEffect, useRef } from 'react';
import {
  FileText,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronDown,
  Upload,
  Image,
  Play,
} from 'lucide-react';
import type { FlowElement } from '@/lib/flows/types';

interface ElementTypePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: FlowElement['type']) => void;
}

const ELEMENT_TYPES: {
  type: FlowElement['type'];
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: 'info_text', label: 'Info Text', Icon: FileText },
  { type: 'short_text', label: 'Short Text', Icon: Type },
  { type: 'long_text', label: 'Long Text', Icon: AlignLeft },
  { type: 'single_choice', label: 'Single Choice', Icon: CircleDot },
  { type: 'multi_choice', label: 'Multi Choice', Icon: CheckSquare },
  { type: 'dropdown', label: 'Dropdown', Icon: ChevronDown },
  { type: 'image_upload', label: 'Image Upload', Icon: Upload },
  { type: 'image', label: 'Image', Icon: Image },
  { type: 'video', label: 'Video', Icon: Play },
];

export default function ElementTypePicker({ open, onClose, onSelect }: ElementTypePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-64"
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
        Element Type
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {ELEMENT_TYPES.map(({ type, label, Icon }) => (
          <button
            key={type}
            onClick={() => {
              onSelect(type);
              onClose();
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-center hover:bg-slate-50 active:bg-slate-100 transition-colors group"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-slate-600 leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
