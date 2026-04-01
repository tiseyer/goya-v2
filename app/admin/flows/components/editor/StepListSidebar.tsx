'use client';

import { useState } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, X, GripVertical } from 'lucide-react';
import { useEditorStore } from '@/lib/flows/editor-store';
import type { FlowStep, FlowBranch } from '@/lib/flows/types';

interface StepListSidebarProps {
  flowId: string;
}

interface SortableStepItemProps {
  step: FlowStep & { branches: FlowBranch[] };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableStepItem({ step, isSelected, onSelect, onDelete }: SortableStepItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-l-2 transition-colors ${
        isSelected
          ? 'bg-primary/10 border-l-primary'
          : 'border-l-transparent hover:bg-slate-100'
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 cursor-grab text-slate-300 hover:text-slate-500 touch-none"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Step info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {step.title || `Step ${step.position}`}
        </p>
        <p className="text-xs text-slate-400">
          {step.elements.length} element{step.elements.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Delete button */}
      <button
        className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete step"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function StepListSidebar({ flowId }: StepListSidebarProps) {
  const { steps, selectedStepId, selectStep, addStep, removeStep, reorderSteps } = useEditorStore();
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex);
    const newIds = reordered.map((s) => s.id);

    reorderSteps(newIds);

    try {
      await fetch(`/api/admin/flows/${flowId}/steps/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepIds: newIds }),
      });
    } catch (err) {
      console.error('Failed to persist step reorder:', err);
    }
  };

  const handleAddStep = async () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/admin/flows/${flowId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_id: flowId, position: steps.length + 1 }),
      });
      if (res.ok) {
        const newStep = await res.json();
        addStep({ ...newStep, branches: [] });
      }
    } catch (err) {
      console.error('Failed to add step:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Delete this step? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/flows/${flowId}/steps/${stepId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        removeStep(stepId);
      }
    } catch (err) {
      console.error('Failed to delete step:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Steps</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {steps.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-slate-400">No steps yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add a step to get started.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {steps.map((step) => (
                <SortableStepItem
                  key={step.id}
                  step={step}
                  isSelected={step.id === selectedStepId}
                  onSelect={() => selectStep(step.id)}
                  onDelete={() => handleDeleteStep(step.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Step button */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={handleAddStep}
          disabled={isAdding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Adding...' : 'Add Step'}
        </button>
      </div>
    </div>
  );
}
