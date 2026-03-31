import 'server-only';

import { getSupabaseService } from '@/lib/supabase/service';
import type {
  Flow,
  FlowWithSteps,
  CreateFlowInput,
  UpdateFlowInput,
} from './types';

/**
 * List flows with optional filters.
 * Admin only — no pagination (flow count is low).
 */
export async function listFlows(params: {
  status?: Flow['status'];
  is_template?: boolean;
} = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { status, is_template } = params;

  let query = supabase.from('flows').select('*');

  if (status !== undefined) {
    query = query.eq('status', status);
  }
  if (is_template !== undefined) {
    query = query.eq('is_template', is_template);
  }

  query = query.order('priority', { ascending: false }).order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data: data as Flow[] | null, error };
}

/**
 * Fetch a single flow by ID.
 */
export async function getFlowById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('flows')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Flow | null, error };
}

/**
 * Fetch a flow with all its steps and branches assembled into FlowWithSteps shape.
 */
export async function getFlowWithSteps(id: string): Promise<{
  data: FlowWithSteps | null;
  error: unknown;
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data: flow, error: flowError } = await supabase
    .from('flows')
    .select('*')
    .eq('id', id)
    .single();

  if (flowError || !flow) {
    return { data: null, error: flowError };
  }

  const { data: steps, error: stepsError } = await supabase
    .from('flow_steps')
    .select('*')
    .eq('flow_id', id)
    .order('position', { ascending: true });

  if (stepsError) {
    return { data: null, error: stepsError };
  }

  const stepIds = (steps ?? []).map((s: { id: string }) => s.id);

  let branches: unknown[] = [];
  if (stepIds.length > 0) {
    const { data: branchData, error: branchError } = await supabase
      .from('flow_branches')
      .select('*')
      .in('step_id', stepIds);

    if (branchError) {
      return { data: null, error: branchError };
    }
    branches = branchData ?? [];
  }

  // Attach branches to their parent steps
  const stepsWithBranches = (steps ?? []).map((step: { id: string }) => ({
    ...step,
    branches: (branches as { step_id: string }[]).filter((b) => b.step_id === step.id),
  }));

  const result: FlowWithSteps = { ...flow, steps: stepsWithBranches };
  return { data: result, error: null };
}

/**
 * Create a new flow.
 */
export async function createFlow(input: CreateFlowInput, createdBy: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('flows')
    .insert({ ...input, created_by: createdBy })
    .select()
    .single();

  return { data: data as Flow | null, error };
}

/**
 * Update an existing flow. The DB trigger handles updated_at.
 */
export async function updateFlow(id: string, input: UpdateFlowInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('flows')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Flow | null, error };
}

/**
 * Delete a flow. CASCADE handles steps and branches.
 */
export async function deleteFlow(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { error } = await supabase.from('flows').delete().eq('id', id);

  return { error };
}

/**
 * Duplicate a flow with all its steps and branches.
 * The copy is set to draft status with "(Copy)" suffix on the name.
 */
export async function duplicateFlow(id: string, createdBy: string) {
  const { data: original, error: fetchError } = await getFlowWithSteps(id);

  if (fetchError || !original) {
    return { data: null, error: fetchError ?? new Error('Flow not found') };
  }

  // Create the new flow
  const { name, steps: _steps, ...rest } = original;
  const { data: newFlow, error: createError } = await createFlow(
    {
      ...rest,
      name: `${name} (Copy)`,
      status: 'draft',
    },
    createdBy
  );

  if (createError || !newFlow) {
    return { data: null, error: createError };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  // Map old step IDs to new step IDs for branch remapping
  const stepIdMap = new Map<string, string>();

  for (const step of original.steps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id: _id, created_at: _ca, branches: _br, ...stepFields } = step as any;

    const { data: newStep, error: stepError } = await supabase
      .from('flow_steps')
      .insert({ ...stepFields, flow_id: newFlow.id })
      .select()
      .single();

    if (stepError || !newStep) {
      return { data: null, error: stepError };
    }

    stepIdMap.set(step.id, newStep.id);
  }

  // Recreate branches with remapped step IDs
  for (const step of original.steps) {
    const newStepId = stepIdMap.get(step.id);
    if (!newStepId || step.branches.length === 0) continue;

    const remappedBranches = step.branches.map((b) => ({
      step_id: newStepId,
      element_key: b.element_key,
      answer_value: b.answer_value,
      target_step_id: stepIdMap.get(b.target_step_id) ?? b.target_step_id,
    }));

    const { error: branchError } = await supabase
      .from('flow_branches')
      .insert(remappedBranches);

    if (branchError) {
      return { data: null, error: branchError };
    }
  }

  return { data: newFlow, error: null };
}
