import 'server-only';

import { getSupabaseService } from '@/lib/supabase/service';
import { getFlowWithSteps } from './flow-service';
import { evaluateConditions } from './condition-evaluator';
import type {
  Flow,
  FlowTriggerType,
  FlowResponse,
  FlowStepAction,
  ActiveFlowResponse,
  StepResponseInput,
} from './types';

// Imported lazily to break circular: actions.ts -> engine.ts (completeFlow)
type ActionResult = Awaited<ReturnType<typeof import('./actions').executeStepActions>>[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => getSupabaseService() as any;

/**
 * Find the highest-priority active flow matching the user's profile and trigger.
 * Returns the flow WITHOUT the conditions field (never leaked to client).
 * Also upserts a flow_response record for the matched flow.
 */
export async function getActiveFlowForUser(
  userId: string,
  trigger: FlowTriggerType
): Promise<ActiveFlowResponse | null> {
  const supabase = db();

  // 1. Fetch all active flows for this trigger, ordered by priority desc
  const { data: flows, error: flowsError } = await supabase
    .from('flows')
    .select('*')
    .eq('status', 'active')
    .eq('trigger_type', trigger)
    .order('priority', { ascending: false });

  if (flowsError || !flows || flows.length === 0) return null;

  // 2. Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, avatar_url, subscription_status, birthday')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return null;

  // 3. Fetch completed flow IDs
  const { data: completedResponses } = await supabase
    .from('flow_responses')
    .select('flow_id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const completedFlowIds: string[] = (completedResponses ?? []).map(
    (r: { flow_id: string }) => r.flow_id
  );

  // 4. Fetch all existing flow_responses for this user (for frequency checks)
  const { data: allResponses } = await supabase
    .from('flow_responses')
    .select('flow_id, status')
    .eq('user_id', userId);

  const responsesByFlowId = new Map<string, { flow_id: string; status: string }[]>();
  for (const r of (allResponses ?? []) as { flow_id: string; status: string }[]) {
    const existing = responsesByFlowId.get(r.flow_id) ?? [];
    existing.push(r);
    responsesByFlowId.set(r.flow_id, existing);
  }

  // 5. Evaluate each flow — first match wins
  const userProfileForConditions = {
    role: profile.role ?? '',
    onboarding_complete: profile.onboarding_complete ?? false,
    avatar_url: profile.avatar_url ?? null,
    subscription_status: profile.subscription_status ?? null,
    birthday: profile.birthday ?? null,
    completed_flow_ids: completedFlowIds,
  };

  let matchedFlow: Flow | null = null;

  for (const flow of flows as Flow[]) {
    // Frequency check
    const userResponses = responsesByFlowId.get(flow.id) ?? [];

    if (flow.frequency === 'once' || flow.frequency === 'custom') {
      // Skip if user has ANY response for this flow
      if (userResponses.length > 0) continue;
    } else if (flow.frequency === 'every_login' || flow.frequency === 'every_session') {
      // Skip if user has an in_progress response (must complete first)
      const hasInProgress = userResponses.some((r) => r.status === 'in_progress');
      if (hasInProgress) continue;
    }

    // Condition check
    const conditionsMet = evaluateConditions(flow.conditions ?? [], userProfileForConditions);
    if (!conditionsMet) continue;

    matchedFlow = flow;
    break;
  }

  if (!matchedFlow) return null;

  // 6. Fetch steps for the matched flow
  const { data: flowWithSteps, error: stepsError } = await getFlowWithSteps(matchedFlow.id);
  if (stepsError || !flowWithSteps) return null;

  // 7. Upsert flow_response record
  const existingResponse = (responsesByFlowId.get(matchedFlow.id) ?? []).find(
    (r) => r.status === 'in_progress'
  );

  let flowResponse: FlowResponse | null = null;

  if (existingResponse) {
    // Fetch the full existing response
    const { data: fullResponse } = await supabase
      .from('flow_responses')
      .select('*')
      .eq('flow_id', matchedFlow.id)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();
    flowResponse = fullResponse ?? null;
  } else {
    // Create a new in_progress response
    const { data: newResponse } = await supabase
      .from('flow_responses')
      .insert({
        flow_id: matchedFlow.id,
        user_id: userId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    flowResponse = newResponse ?? null;
  }

  // 8. Strip conditions from the flow before returning (security: never leak to client)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { conditions: _conditions, ...flowWithoutConditions } = matchedFlow;

  return {
    flow: flowWithoutConditions,
    steps: flowWithSteps.steps,
    response: flowResponse,
  };
}

/**
 * Record the user's answer(s) for a step and advance last_step_id.
 * Merges new answers into existing responses JSONB.
 * Optionally executes step actions (with idempotency) when options.actions is provided.
 */
export async function recordStepResponse(
  userId: string,
  flowId: string,
  input: StepResponseInput,
  options?: { actions?: FlowStepAction[]; userEmail?: string }
): Promise<{ data: FlowResponse | null; actionResults?: ActionResult[]; error: unknown }> {
  const supabase = db();

  // 1. Fetch existing flow_response
  const { data: existing, error: fetchError } = await supabase
    .from('flow_responses')
    .select('*')
    .eq('flow_id', flowId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return { data: null, error: fetchError ?? new Error('Flow response not found') };
  }

  // 2. Merge answers into existing responses
  const mergedResponses = {
    ...(existing.responses ?? {}),
    ...input.answers,
  };

  // 3. Update with merged responses and advance last_step_id
  const { data: updated, error: updateError } = await supabase
    .from('flow_responses')
    .update({
      responses: mergedResponses,
      last_step_id: input.step_id,
    })
    .eq('flow_id', flowId)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) {
    return { data: null, error: updateError };
  }

  // 4. Execute step actions if provided (lazy import breaks circular with actions.ts)
  let actionResults: ActionResult[] | undefined;
  if (options?.actions && options.actions.length > 0) {
    const { executeStepActions } = await import('./actions');
    actionResults = await executeStepActions({
      flowId,
      userId,
      stepId: input.step_id,
      actions: options.actions,
      answers: input.answers,
      userEmail: options.userEmail ?? '',
    });
  }

  return { data: updated ?? null, actionResults, error: null };
}

/**
 * Mark a flow as completed for the user.
 * Sets status=completed, completed_at timestamp, and records analytics event.
 */
export async function completeFlow(
  userId: string,
  flowId: string
): Promise<{ success: boolean; error?: unknown }> {
  const supabase = db();

  // 1. Update flow_response to completed
  const { error: updateError } = await supabase
    .from('flow_responses')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('flow_id', flowId)
    .eq('user_id', userId);

  if (updateError) {
    return { success: false, error: updateError };
  }

  // 2. Insert analytics event
  const { error: analyticsError } = await supabase
    .from('flow_analytics')
    .insert({
      flow_id: flowId,
      user_id: userId,
      event: 'completed',
    });

  if (analyticsError) {
    // Analytics failure is non-fatal — flow is already marked complete
    console.error('[flow-engine] analytics insert failed:', analyticsError);
  }

  return { success: true };
}
