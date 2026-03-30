import { create } from 'zustand';
import type { Flow, FlowStep, FlowBranch, FlowElement, FlowWithSteps } from './types';

type StepWithBranches = FlowStep & { branches: FlowBranch[] };

interface EditorState {
  // Data
  flow: Flow | null;
  steps: StepWithBranches[];
  // UI state
  selectedStepId: string | null;
  selectedElementKey: string | null;
  isDirty: boolean;
  isSaving: boolean;
  // Profile mappings: elementKey -> profile column name
  profileMappings: Record<string, string>;
  // Actions
  initializeFlow: (flowWithSteps: FlowWithSteps) => void;
  selectStep: (stepId: string | null) => void;
  selectElement: (elementKey: string | null) => void;
  addStep: (step: StepWithBranches) => void;
  removeStep: (stepId: string) => void;
  reorderSteps: (stepIds: string[]) => void;
  updateStepElements: (stepId: string, elements: FlowElement[]) => void;
  updateStepTitle: (stepId: string, title: string) => void;
  updateElement: (stepId: string, elementKey: string, updates: Partial<FlowElement>) => void;
  updateStepBranches: (stepId: string, branches: FlowBranch[]) => void;
  updateFlow: (partial: Partial<Flow>) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setProfileMapping: (elementKey: string, field: string | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  flow: null,
  steps: [],
  selectedStepId: null,
  selectedElementKey: null,
  isDirty: false,
  isSaving: false,
  profileMappings: {},

  initializeFlow: (flowWithSteps) => {
    set({
      flow: {
        id: flowWithSteps.id,
        name: flowWithSteps.name,
        description: flowWithSteps.description,
        status: flowWithSteps.status,
        priority: flowWithSteps.priority,
        display_type: flowWithSteps.display_type,
        modal_dismissible: flowWithSteps.modal_dismissible,
        modal_backdrop: flowWithSteps.modal_backdrop,
        trigger_type: flowWithSteps.trigger_type,
        trigger_delay_seconds: flowWithSteps.trigger_delay_seconds,
        frequency: flowWithSteps.frequency,
        conditions: flowWithSteps.conditions,
        schema_version: flowWithSteps.schema_version,
        is_template: flowWithSteps.is_template,
        template_name: flowWithSteps.template_name,
        created_by: flowWithSteps.created_by,
        created_at: flowWithSteps.created_at,
        updated_at: flowWithSteps.updated_at,
      },
      steps: flowWithSteps.steps,
      selectedStepId: flowWithSteps.steps.length > 0 ? flowWithSteps.steps[0].id : null,
      selectedElementKey: null,
      isDirty: false,
      isSaving: false,
      profileMappings: {},
    });
  },

  selectStep: (stepId) => {
    set({ selectedStepId: stepId, selectedElementKey: null });
  },

  selectElement: (elementKey) => {
    set({ selectedElementKey: elementKey });
  },

  addStep: (step) => {
    set((state) => ({
      steps: [...state.steps, step],
      selectedStepId: step.id,
      selectedElementKey: null,
    }));
  },

  removeStep: (stepId) => {
    set((state) => {
      const newSteps = state.steps.filter((s) => s.id !== stepId);
      let newSelectedId = state.selectedStepId;
      if (state.selectedStepId === stepId) {
        // Select the next or previous step
        const removedIndex = state.steps.findIndex((s) => s.id === stepId);
        if (newSteps.length === 0) {
          newSelectedId = null;
        } else if (removedIndex >= newSteps.length) {
          newSelectedId = newSteps[newSteps.length - 1].id;
        } else {
          newSelectedId = newSteps[removedIndex].id;
        }
      }
      return { steps: newSteps, selectedStepId: newSelectedId, selectedElementKey: null };
    });
  },

  reorderSteps: (stepIds) => {
    set((state) => {
      const stepMap = new Map(state.steps.map((s) => [s.id, s]));
      const reordered = stepIds
        .map((id) => stepMap.get(id))
        .filter((s): s is StepWithBranches => s !== undefined);
      return { steps: reordered };
    });
  },

  updateStepElements: (stepId, elements) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, elements } : s
      ),
      isDirty: true,
    }));
  },

  updateStepTitle: (stepId, title) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, title } : s
      ),
      isDirty: true,
    }));
  },

  updateElement: (stepId, elementKey, updates) => {
    set((state) => ({
      steps: state.steps.map((s) => {
        if (s.id !== stepId) return s;
        const updatedElements = s.elements.map((el) => {
          if (el.element_key !== elementKey) return el;
          return { ...el, ...updates } as FlowElement;
        });
        return { ...s, elements: updatedElements };
      }),
      isDirty: true,
    }));
  },

  updateStepBranches: (stepId, branches) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, branches } : s
      ),
    }));
  },

  updateFlow: (partial) => {
    set((state) => ({
      flow: state.flow ? { ...state.flow, ...partial } : null,
      isDirty: true,
    }));
  },

  setDirty: (dirty) => {
    set({ isDirty: dirty });
  },

  setSaving: (saving) => {
    set({ isSaving: saving });
  },

  setProfileMapping: (elementKey, field) => {
    set((state) => {
      const next = { ...state.profileMappings };
      if (field === null) {
        delete next[elementKey];
      } else {
        next[elementKey] = field;
      }
      return { profileMappings: next };
    });
  },
}));
