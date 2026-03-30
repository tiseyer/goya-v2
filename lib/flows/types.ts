// Flow builder TypeScript types — mirrors the 5 flow builder tables in the database.
// No 'use server' directive — these are plain type definitions.

// ─── Enum / Union Types ────────────────────────────────────────────────────

export type FlowStatus = 'draft' | 'active' | 'paused' | 'archived';

export type FlowDisplayType =
  | 'modal'
  | 'fullscreen'
  | 'top_banner'
  | 'bottom_banner'
  | 'notification';

export type FlowTriggerType = 'login' | 'manual' | 'page_load';

export type FlowFrequency = 'once' | 'every_login' | 'every_session' | 'custom';

export type FlowResponseStatus = 'in_progress' | 'completed' | 'skipped' | 'dismissed';

export type FlowAnalyticsEventType =
  | 'shown'
  | 'started'
  | 'step_completed'
  | 'completed'
  | 'skipped'
  | 'dismissed';

export type FlowConditionType =
  | 'role'
  | 'onboarding_status'
  | 'has_profile_picture'
  | 'subscription_status'
  | 'birthday'
  | 'flow_completed';

// ─── Condition ─────────────────────────────────────────────────────────────

export interface FlowCondition {
  type: FlowConditionType;
  operator: string;
  value: string | string[] | boolean | number;
}

// ─── Flow Element (discriminated union on type) ────────────────────────────

interface FlowElementBase {
  element_key: string;
  label: string;
  required: boolean;
  help_text: string | null;
}

interface FlowElementInfoText extends FlowElementBase {
  type: 'info_text';
  content: string;
}

interface FlowElementShortText extends FlowElementBase {
  type: 'short_text';
}

interface FlowElementLongText extends FlowElementBase {
  type: 'long_text';
}

interface FlowElementChoiceOption {
  label: string;
  value: string;
}

interface FlowElementSingleChoice extends FlowElementBase {
  type: 'single_choice';
  options: FlowElementChoiceOption[];
}

interface FlowElementMultiChoice extends FlowElementBase {
  type: 'multi_choice';
  options: FlowElementChoiceOption[];
}

interface FlowElementDropdown extends FlowElementBase {
  type: 'dropdown';
  options: FlowElementChoiceOption[];
}

interface FlowElementImageUpload extends FlowElementBase {
  type: 'image_upload';
}

interface FlowElementImage extends FlowElementBase {
  type: 'image';
  src: string;
  alt: string;
}

interface FlowElementVideo extends FlowElementBase {
  type: 'video';
  url: string;
}

export type FlowElement =
  | FlowElementInfoText
  | FlowElementShortText
  | FlowElementLongText
  | FlowElementSingleChoice
  | FlowElementMultiChoice
  | FlowElementDropdown
  | FlowElementImageUpload
  | FlowElementImage
  | FlowElementVideo;

// ─── Core Table Interfaces ─────────────────────────────────────────────────

export interface Flow {
  id: string;
  name: string;
  description: string | null;
  status: FlowStatus;
  priority: number;
  display_type: FlowDisplayType;
  modal_dismissible: boolean | null;
  modal_backdrop: 'blur' | 'dark' | 'none' | null;
  trigger_type: FlowTriggerType;
  trigger_delay_seconds: number | null;
  frequency: FlowFrequency;
  conditions: FlowCondition[];
  schema_version: number;
  is_template: boolean;
  template_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlowStep {
  id: string;
  flow_id: string;
  position: number;
  title: string | null;
  elements: FlowElement[];
  schema_version: number;
  created_at: string;
}

export interface FlowBranch {
  id: string;
  step_id: string;
  element_key: string;
  answer_value: string;
  target_step_id: string;
}

export interface FlowResponse {
  id: string;
  flow_id: string;
  user_id: string;
  status: FlowResponseStatus;
  started_at: string | null;
  completed_at: string | null;
  last_step_id: string | null;
  responses: Record<string, unknown>;
}

export interface FlowAnalyticsEvent {
  id: string;
  flow_id: string;
  user_id: string;
  event: FlowAnalyticsEventType;
  step_id: string | null;
  created_at: string;
}

// ─── Composite Types ────────────────────────────────────────────────────────

export type FlowWithSteps = Flow & {
  steps: (FlowStep & { branches: FlowBranch[] })[];
};

// ─── Input / Mutation Types ─────────────────────────────────────────────────

export type CreateFlowInput = {
  name: string;
  description?: string | null;
  status?: FlowStatus;
  priority?: number;
  display_type?: FlowDisplayType;
  modal_dismissible?: boolean | null;
  modal_backdrop?: 'blur' | 'dark' | 'none' | null;
  trigger_type?: FlowTriggerType;
  trigger_delay_seconds?: number | null;
  frequency?: FlowFrequency;
  conditions?: FlowCondition[];
  is_template?: boolean;
  template_name?: string | null;
};

export type UpdateFlowInput = Partial<CreateFlowInput>;

export type CreateStepInput = {
  flow_id: string;
  position?: number;
  title?: string | null;
  elements?: FlowElement[];
};

export type UpdateStepInput = Partial<Omit<CreateStepInput, 'flow_id'>>;

export type UpsertBranchInput = {
  step_id: string;
  element_key: string;
  answer_value: string;
  target_step_id: string;
};
