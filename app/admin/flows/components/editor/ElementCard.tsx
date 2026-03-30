'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { useEditorStore } from '@/lib/flows/editor-store';
import type { FlowElement } from '@/lib/flows/types';

interface ElementCardProps {
  element: FlowElement;
  index: number;
  onDelete: () => void;
}

const TYPE_LABELS: Record<FlowElement['type'], string> = {
  info_text: 'Info Text',
  short_text: 'Short Text',
  long_text: 'Long Text',
  single_choice: 'Single Choice',
  multi_choice: 'Multi Choice',
  dropdown: 'Dropdown',
  image_upload: 'Image Upload',
  image: 'Image',
  video: 'Video',
};

const TYPE_COLORS: Record<FlowElement['type'], string> = {
  info_text: 'bg-slate-100 text-slate-600',
  short_text: 'bg-blue-50 text-blue-600',
  long_text: 'bg-indigo-50 text-indigo-600',
  single_choice: 'bg-emerald-50 text-emerald-600',
  multi_choice: 'bg-teal-50 text-teal-600',
  dropdown: 'bg-cyan-50 text-cyan-600',
  image_upload: 'bg-orange-50 text-orange-600',
  image: 'bg-pink-50 text-pink-600',
  video: 'bg-purple-50 text-purple-600',
};

function getElementPreview(element: FlowElement): string | null {
  switch (element.type) {
    case 'info_text':
      return element.content ? element.content.slice(0, 80) : null;
    case 'single_choice':
    case 'multi_choice':
    case 'dropdown':
      return element.options.length > 0
        ? element.options.map((o) => o.label).join(', ')
        : null;
    case 'image':
      return element.src || null;
    case 'video':
      return element.url || null;
    default:
      return null;
  }
}

export default function ElementCard({ element, index, onDelete }: ElementCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: element.element_key,
  });
  const { selectedElementKey, selectElement } = useEditorStore();
  const isSelected = selectedElementKey === element.element_key;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const preview = getElementPreview(element);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectElement(isSelected ? null : element.element_key)}
      className={`group bg-white rounded-lg border p-4 mb-2 shadow-sm cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          className="shrink-0 mt-0.5 cursor-grab text-slate-300 hover:text-slate-500 touch-none"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Type badge + key */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${TYPE_COLORS[element.type]}`}
          >
            {TYPE_LABELS[element.type]}
          </span>
          <span className="text-xs text-slate-400 font-mono truncate">{element.element_key}</span>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Delete element"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="mt-2 ml-6">
        {element.label && (
          <p className="text-sm font-medium text-slate-700">{element.label}</p>
        )}
        {preview && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{preview}</p>
        )}
        {!element.label && !preview && (
          <p className="text-xs text-slate-300 italic">No label set</p>
        )}
      </div>

      {/* Index badge (subtle, for reference) */}
      <div className="ml-6 mt-1">
        <span className="text-xs text-slate-300">#{index + 1}</span>
      </div>
    </div>
  );
}
