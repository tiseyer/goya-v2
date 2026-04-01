'use client';

import { useRef, useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useEditorStore } from '@/lib/flows/editor-store';
import type { FlowElement } from '@/lib/flows/types';
import ElementCard from './ElementCard';
import ElementTypePicker from './ElementTypePicker';

interface StepCanvasProps {
  flowId: string;
}

// Default element factory
function createDefaultElement(type: FlowElement['type']): FlowElement {
  const base = { label: '', required: false, help_text: null };
  const ts = Date.now();

  switch (type) {
    case 'info_text':
      return { ...base, type, element_key: `info_${ts}`, label: 'Info Text', content: '' };
    case 'short_text':
      return { ...base, type, element_key: `short_text_${ts}`, label: 'Short Text' };
    case 'long_text':
      return { ...base, type, element_key: `long_text_${ts}`, label: 'Long Text' };
    case 'single_choice':
      return { ...base, type, element_key: `single_choice_${ts}`, label: 'Single Choice', options: [] };
    case 'multi_choice':
      return { ...base, type, element_key: `multi_choice_${ts}`, label: 'Multi Choice', options: [] };
    case 'dropdown':
      return { ...base, type, element_key: `dropdown_${ts}`, label: 'Dropdown', options: [] };
    case 'image_upload':
      return { ...base, type, element_key: `image_upload_${ts}`, label: 'Image Upload' };
    case 'image':
      return { ...base, type, element_key: `image_${ts}`, label: 'Image', src: '', alt: '' };
    case 'video':
      return { ...base, type, element_key: `video_${ts}`, label: 'Video', url: '' };
  }
}

export default function StepCanvas({ flowId }: StepCanvasProps) {
  const { steps, selectedStepId, updateStepElements, updateStepTitle, setSaving, setDirty } =
    useEditorStore();
  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync title input when selected step changes
  useEffect(() => {
    setTitleValue(selectedStep?.title ?? '');
  }, [selectedStepId, selectedStep?.title]);

  // Auto-save function (2-second debounce)
  const scheduleAutoSave = (stepId: string, elements: FlowElement[]) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/admin/flows/${flowId}/steps/${stepId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ elements }),
        });
        setDirty(false);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setSaving(false);
      }
    }, 2000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!selectedStep) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedStep.elements.findIndex((e) => e.element_key === active.id);
    const newIndex = selectedStep.elements.findIndex((e) => e.element_key === over.id);
    const reordered = arrayMove(selectedStep.elements, oldIndex, newIndex);

    updateStepElements(selectedStep.id, reordered);
    scheduleAutoSave(selectedStep.id, reordered);
  };

  const handleAddElement = (type: FlowElement['type']) => {
    if (!selectedStep) return;
    const newElement = createDefaultElement(type);
    const newElements = [...selectedStep.elements, newElement];
    updateStepElements(selectedStep.id, newElements);
    scheduleAutoSave(selectedStep.id, newElements);
  };

  const handleDeleteElement = (elementKey: string) => {
    if (!selectedStep) return;
    const newElements = selectedStep.elements.filter((e) => e.element_key !== elementKey);
    updateStepElements(selectedStep.id, newElements);
    scheduleAutoSave(selectedStep.id, newElements);
  };

  const handleTitleBlur = async () => {
    if (!selectedStep) return;
    updateStepTitle(selectedStep.id, titleValue);
    try {
      await fetch(`/api/admin/flows/${flowId}/steps/${selectedStep.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleValue }),
      });
    } catch (err) {
      console.error('Failed to save step title:', err);
    }
  };

  if (!selectedStep) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500">Select a step from the sidebar</p>
          <p className="text-xs text-slate-400 mt-1">or add a new step to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Step title */}
      <input
        type="text"
        value={titleValue}
        onChange={(e) => setTitleValue(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder={`Step ${selectedStep.position}`}
        className="w-full text-lg font-semibold text-slate-800 bg-transparent border-0 border-b-2 border-transparent focus:border-primary focus:outline-none pb-1 mb-6 placeholder:text-slate-300 transition-colors"
      />

      {/* Elements list */}
      {selectedStep.elements.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedStep.elements.map((e) => e.element_key)}
            strategy={verticalListSortingStrategy}
          >
            {selectedStep.elements.map((element, index) => (
              <ElementCard
                key={element.element_key}
                element={element}
                index={index}
                onDelete={() => handleDeleteElement(element.element_key)}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center mb-4">
          <p className="text-sm text-slate-400">No elements yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click &quot;Add Element&quot; to add one.</p>
        </div>
      )}

      {/* Add Element button */}
      <div className="relative mt-4">
        <button
          onClick={() => setPickerOpen((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Element
        </button>

        <ElementTypePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleAddElement}
        />
      </div>
    </div>
  );
}
