'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lesson } from '@/lib/courses/lessons';
import { deleteLesson, reorderLesson } from '@/app/admin/courses/lesson-actions';
import LessonForm from './LessonForm';

// ---- Type badge ----

const TYPE_BADGE: Record<string, string> = {
  video: 'bg-blue-100 text-blue-700',
  audio: 'bg-amber-100 text-amber-700',
  text:  'bg-emerald-100 text-emerald-700',
};

// ---- Sortable lesson row ----

function SortableLessonRow({
  lesson,
  index,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  index: number;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeKey = lesson.type?.toLowerCase() ?? 'text';
  const badgeClass = TYPE_BADGE[typeKey] ?? 'bg-slate-100 text-slate-600';
  const typeLabel = typeKey.charAt(0).toUpperCase() + typeKey.slice(1);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#F1F5F9] last:border-b-0 hover:bg-slate-50 transition-colors"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#9CA3AF] hover:text-[#6B7280] p-1 rounded flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </button>

      {/* Number */}
      <span className="text-xs font-semibold text-[#9CA3AF] w-5 flex-shrink-0 text-center">
        {index + 1}
      </span>

      {/* Title */}
      <p className="text-sm font-medium text-[#1B3A5C] flex-1 truncate min-w-0">
        {lesson.title}
      </p>

      {/* Type badge */}
      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>
        {typeLabel}
      </span>

      {/* Duration */}
      <span className="text-xs text-[#6B7280] flex-shrink-0 w-10 text-right">
        {lesson.duration_minutes ? `${lesson.duration_minutes}m` : '--'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Edit */}
        <button
          onClick={() => onEdit(lesson)}
          className="p-1.5 rounded text-[#9CA3AF] hover:text-[#4E87A0] hover:bg-blue-50 transition-colors"
          title="Edit lesson"
          aria-label={`Edit ${lesson.title}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(lesson.id)}
          className="p-1.5 rounded text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete lesson"
          aria-label={`Delete ${lesson.title}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---- Main LessonList ----

interface LessonListProps {
  courseId: string;
  initialLessons: Lesson[];
}

export default function LessonList({ courseId, initialLessons }: LessonListProps) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [formMode, setFormMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);
      const newOrder = arrayMove(lessons, oldIndex, newIndex);

      // Compute float midpoint sort_order
      let newSortOrder: number;
      if (newIndex === 0) {
        newSortOrder = newOrder[1]?.sort_order ? newOrder[1].sort_order / 2 : 1024;
      } else if (newIndex === newOrder.length - 1) {
        newSortOrder = newOrder[newOrder.length - 2].sort_order + 1024;
      } else {
        newSortOrder = (newOrder[newIndex - 1].sort_order + newOrder[newIndex + 1].sort_order) / 2;
      }

      // Optimistic update: apply new order and update moved item's sort_order
      const optimistic = newOrder.map((l, i) =>
        i === newIndex ? { ...l, sort_order: newSortOrder } : l,
      );
      setLessons(optimistic);

      await reorderLesson(String(active.id), newSortOrder);
    },
    [lessons],
  );

  async function handleDelete(lessonId: string) {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    if (!window.confirm(`Delete lesson "${lesson.title}"? This cannot be undone.`)) return;

    // Optimistic remove
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));

    const { error } = await deleteLesson(lessonId, courseId, lesson.title);
    if (error) {
      // Revert on failure
      setLessons((prev) => {
        const restored = [...prev, lesson].sort((a, b) => a.sort_order - b.sort_order);
        return restored;
      });
      alert(`Failed to delete lesson: ${error}`);
    }
  }

  function handleEditClick(lesson: Lesson) {
    setEditingLesson(lesson);
    setFormMode('edit');
  }

  function handleSave(savedLesson: Lesson) {
    if (formMode === 'add') {
      setLessons((prev) => [...prev, savedLesson]);
    } else if (formMode === 'edit') {
      setLessons((prev) => prev.map((l) => (l.id === savedLesson.id ? savedLesson : l)));
    }
    setFormMode('closed');
    setEditingLesson(undefined);
  }

  function handleCancel() {
    setFormMode('closed');
    setEditingLesson(undefined);
  }

  return (
    <div className="border border-border rounded-xl p-4 sm:p-6 bg-card transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lessons</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setFormMode('add'); setEditingLesson(undefined); }}
          className="px-4 py-2 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors"
        >
          + Add Lesson
        </button>
      </div>

      {/* Empty state */}
      {lessons.length === 0 && formMode === 'closed' ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No lessons yet. Add your first lesson below.</p>
        </div>
      ) : lessons.length > 0 ? (
        /* Lesson list */
        <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {lessons.map((lesson, index) => (
                <SortableLessonRow
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      {/* Inline form */}
      {formMode !== 'closed' && (
        <LessonForm
          courseId={courseId}
          lesson={editingLesson}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
