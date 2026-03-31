import { create } from 'zustand';
import type { Flow, FlowStep, FlowBranch, FlowElement, FlowWithSteps } from './types';

type StepWithBranches = FlowStep & { branches: FlowBranch[] };

export type StepActionType =
  | 'save_to_profile'
  | 'send_email'
  | 'kit_tag'
  | 'stripe_checkout'
  | 'redirect'
  | 'trigger_flow'
  | 'success_popup'
  | 'mark_complete';

export interface StepAction {
  type: StepActionType;
  config: Record<string, unknown>;
}

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
  // Step actions: stepId -> StepAction[] (UI scaffold — not yet persisted to DB)
  stepActions: Record<string, StepAction[]>;
  // Flow settings panel
  settingsPanelOpen: boolean;
  // Preview state
  isPreviewOpen: boolean;
  previewStepIndex: number;
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
  // Step actions
  setStepAction: (stepId: string, actions: StepAction[]) => void;
  addStepAction: (stepId: string, action: StepAction) => void;
  removeStepAction: (stepId: string, index: number) => void;
  updateStepAction: (stepId: string, index: number, updates: Partial<StepAction>) => void;
  // Flow settings panel
  toggleSettingsPanel: () => void;
  // Preview
  openPreview: () => void;
  closePreview: () => void;
  previewNext: () => void;
  previewBack: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  flow: null,
  steps: [],
  selectedStepId: null,
  selectedElementKey: null,
  isDirty: false,
  isSaving: false,
  profileMappings: {},
  stepActions: {},
  settingsPanelOpen: false,
  isPreviewOpen: false,
  previewStepIndex: 0,

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

  setStepAction: (stepId, actions) => {
    set((state) => ({
      stepActions: { ...state.stepActions, [stepId]: actions },
    }));
  },

  addStepAction: (stepId, action) => {
    set((state) => {
      const current = state.stepActions[stepId] ?? [];
      return { stepActions: { ...state.stepActions, [stepId]: [...current, action] } };
    });
  },

  removeStepAction: (stepId, index) => {
    set((state) => {
      const current = state.stepActions[stepId] ?? [];
      return {
        stepActions: {
          ...state.stepActions,
          [stepId]: current.filter((_, i) => i !== index),
        },
      };
    });
  },

  updateStepAction: (stepId, index, updates) => {
    set((state) => {
      const current = state.stepActions[stepId] ?? [];
      return {
        stepActions: {
          ...state.stepActions,
          [stepId]: current.map((a, i) =>
            i === index ? { ...a, ...updates, config: { ...a.config, ...(updates.config ?? {}) } } : a
          ),
        },
      };
    });
  },

  toggleSettingsPanel: () => {
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen }));
  },

  openPreview: () => {
    set({ isPreviewOpen: true, previewStepIndex: 0 });
  },

  closePreview: () => {
    set({ isPreviewOpen: false });
  },

  previewNext: () => {
    set((state) => {
      const maxIndex = Math.max(0, state.steps.length - 1);
      return { previewStepIndex: Math.min(state.previewStepIndex + 1, maxIndex) };
    });
  },

  previewBack: () => {
    set((state) => ({
      previewStepIndex: Math.max(0, state.previewStepIndex - 1),
    }));
  },
}));
