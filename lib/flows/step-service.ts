import 'server-only';

import { getSupabaseService } from '@/lib/supabase/service';
import type { FlowStep, FlowBranch, CreateStepInput, UpdateStepInput, UpsertBranchInput } from './types';

/**
 * List all steps for a flow ordered by position.
 */
export async function listSteps(flowId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('flow_steps')
    .select('*')
    .eq('flow_id', flowId)
    .order('position', { ascending: true });

  return { data: data as FlowStep[] | null, error };
}

/**
 * Fetch a single step with its branches.
 */
export async function getStepById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data: step, error: stepError } = await supabase
    .from('flow_steps')
    .select('*')
    .eq('id', id)
    .single();

  if (stepError || !step) {
    return { data: null, error: stepError };
  }

  const { data: branches, error: branchError } = await supabase
    .from('flow_branches')
    .select('*')
    .eq('step_id', id);

  if (branchError) {
    return { data: null, error: branchError };
  }

  return {
    data: { ...step, branches: (branches ?? []) as FlowBranch[] } as FlowStep & {
      branches: FlowBranch[];
    },
    error: null,
  };
}

/**
 * Create a new step for a flow.
 */
export async function createStep(input: CreateStepInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('flow_steps')
    .insert(input)
    .select()
    .single();

  return { data: data as FlowStep | null, error };
}

/**
 * Update a step by ID.
 */
export async function updateStep(id: string, input: UpdateStepInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('flow_steps')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  return { data: data as FlowStep | null, error };
}

/**
 * Delete a step. CASCADE deletes its branches.
 */
export async function deleteStep(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { error } = await supabase.from('flow_steps').delete().eq('id', id);

  return { error };
}

/**
 * Reorder steps in a flow by reassigning position to each step's array index.
 * Step count is typically small (<20) so individual updates are acceptable.
 */
export async function reorderSteps(flowId: string, stepIds: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  for (let i = 0; i < stepIds.length; i++) {
    const { error } = await supabase
      .from('flow_steps')
      .update({ position: i })
      .eq('id', stepIds[i])
      .eq('flow_id', flowId);

    if (error) {
      return { error };
    }
  }

  return { error: null };
}

/**
 * Replace all branches for a step with the provided set.
 * Delete-then-insert is simpler than diffing for this low-volume operation.
 */
export async function upsertBranches(stepId: string, branches: UpsertBranchInput[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { error: deleteError } = await supabase
    .from('flow_branches')
    .delete()
    .eq('step_id', stepId);

  if (deleteError) {
    return { data: null, error: deleteError };
  }

  if (branches.length === 0) {
    return { data: [] as FlowBranch[], error: null };
  }

  const { data, error } = await supabase
    .from('flow_branches')
    .insert(branches)
    .select();

  return { data: data as FlowBranch[] | null, error };
}
