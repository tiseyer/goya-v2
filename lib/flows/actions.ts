import 'server-only';

import { getSupabaseService } from '@/lib/supabase/service';
import { tagSubscriber } from '@/lib/flows/kitcom';
import { getStripe } from '@/lib/stripe/client';
import type { FlowActionType, FlowStepAction } from './types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ActionResult {
  type: FlowActionType;
  success: boolean;
  skipped?: boolean; // true if idempotency check prevented execution
  error?: string;
  data?: Record<string, unknown>; // e.g., stripe checkout URL
}

// ─── Idempotency ─────────────────────────────────────────────────────────────

async function checkIdempotency(
  flowId: string,
  userId: string,
  stepId: string,
  actionType: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { data } = await supabase
    .from('flow_action_executions')
    .select('id')
    .eq('flow_id', flowId)
    .eq('user_id', userId)
    .eq('step_id', stepId)
    .eq('action_type', actionType)
    .maybeSingle();
  return data !== null;
}

async function recordExecution(
  flowId: string,
  userId: string,
  stepId: string,
  actionType: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  try {
    await supabase.from('flow_action_executions').insert({
      flow_id: flowId,
      user_id: userId,
      step_id: stepId,
      action_type: actionType,
    });
  } catch {
    // UNIQUE violation on race condition — action already recorded, that's fine
  }
}

// ─── Action Handlers ─────────────────────────────────────────────────────────

async function handleSaveToProfile(
  userId: string,
  config: Record<string, unknown>,
  answers: Record<string, unknown>
): Promise<ActionResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const mappings = (config.mappings ?? {}) as Record<string, string>;
  const updateObj: Record<string, unknown> = {};

  for (const [elementKey, profileColumn] of Object.entries(mappings)) {
    if (answers[elementKey] !== undefined) {
      updateObj[profileColumn] = answers[elementKey];
    }
  }

  if (Object.keys(updateObj).length === 0) {
    return { type: 'save_to_profile', success: true };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateObj)
    .eq('id', userId);

  if (error) {
    return { type: 'save_to_profile', success: false, error: error.message };
  }
  return { type: 'save_to_profile', success: true };
}

async function handleSendEmail(
  config: Record<string, unknown>
): Promise<ActionResult> {
  // Intentional stub — real email integration deferred to a future plan
  console.warn(
    `send_email action not implemented — email template: ${config.template_id}`
  );
  return { type: 'send_email', success: true };
}

async function handleKitTag(
  userEmail: string,
  config: Record<string, unknown>
): Promise<ActionResult> {
  const tagId = config.tag_id as string;
  const result = await tagSubscriber(userEmail, tagId);
  return {
    type: 'kit_tag',
    success: result.success,
    ...(result.error && { error: result.error }),
  };
}

async function handleStripeCheckout(
  flowId: string,
  userId: string,
  stepId: string,
  userEmail: string,
  config: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const priceId = config.price_id as string;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const idempotencyKey = `flow_${flowId}_${stepId}_${userId}`;

    const session = await getStripe().checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: userEmail,
        success_url: (config.success_url as string | undefined) ?? `${appUrl}/dashboard`,
        cancel_url: (config.cancel_url as string | undefined) ?? `${appUrl}/dashboard`,
      },
      { idempotencyKey }
    );

    return {
      type: 'stripe_checkout',
      success: true,
      data: { checkout_url: session.url ?? '' },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { type: 'stripe_checkout', success: false, error: message };
  }
}

function handleRedirect(config: Record<string, unknown>): ActionResult {
  // No server-side execution — return URL for client to handle
  return {
    type: 'redirect',
    success: true,
    data: { redirect_url: config.url as string },
  };
}

async function handleTriggerFlow(
  userId: string,
  config: Record<string, unknown>,
  depth: number = 0
): Promise<ActionResult> {
  if (depth >= 3) {
    return {
      type: 'trigger_flow',
      success: false,
      error: 'Maximum flow trigger depth exceeded',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const targetFlowId = config.target_flow_id as string;

  // Check if user already has a flow_response for this target flow
  const { data: existing } = await supabase
    .from('flow_responses')
    .select('id')
    .eq('flow_id', targetFlowId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return { type: 'trigger_flow', success: true, skipped: true };
  }

  const { error } = await supabase.from('flow_responses').insert({
    flow_id: targetFlowId,
    user_id: userId,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    responses: {},
  });

  if (error) {
    return { type: 'trigger_flow', success: false, error: error.message };
  }
  return { type: 'trigger_flow', success: true };
}

function handleSuccessPopup(config: Record<string, unknown>): ActionResult {
  // No server-side execution — return popup config for client rendering
  return {
    type: 'success_popup',
    success: true,
    data: {
      popup: {
        title: config.title as string | undefined,
        message: config.message as string | undefined,
      },
    },
  };
}

async function handleMarkComplete(
  userId: string,
  flowId: string
): Promise<ActionResult> {
  // Import here to avoid circular — engine imports actions.ts
  const { completeFlow } = await import('./engine');
  const result = await completeFlow(userId, flowId);
  if (!result.success) {
    const message =
      result.error instanceof Error ? result.error.message : String(result.error ?? 'Unknown error');
    return { type: 'mark_complete', success: false, error: message };
  }
  return { type: 'mark_complete', success: true };
}

// ─── Main Dispatcher ─────────────────────────────────────────────────────────

/**
 * Execute all configured step actions sequentially with idempotency protection.
 * If one action fails, execution continues — all results are returned to the caller.
 */
export async function executeStepActions(params: {
  flowId: string;
  userId: string;
  stepId: string;
  actions: FlowStepAction[];
  answers: Record<string, unknown>;
  userEmail: string;
}): Promise<ActionResult[]> {
  const { flowId, userId, stepId, actions, answers, userEmail } = params;
  const results: ActionResult[] = [];

  for (const action of actions) {
    // Idempotency check — skip if already executed for this (flow, user, step, action_type)
    const alreadyExecuted = await checkIdempotency(flowId, userId, stepId, action.type);
    if (alreadyExecuted) {
      results.push({ type: action.type, success: true, skipped: true });
      continue;
    }

    let result: ActionResult;

    try {
      switch (action.type) {
        case 'save_to_profile':
          result = await handleSaveToProfile(userId, action.config, answers);
          break;
        case 'send_email':
          result = await handleSendEmail(action.config);
          break;
        case 'kit_tag':
          result = await handleKitTag(userEmail, action.config);
          break;
        case 'stripe_checkout':
          result = await handleStripeCheckout(flowId, userId, stepId, userEmail, action.config);
          break;
        case 'redirect':
          result = handleRedirect(action.config);
          break;
        case 'trigger_flow':
          result = await handleTriggerFlow(userId, action.config, 0);
          break;
        case 'success_popup':
          result = handleSuccessPopup(action.config);
          break;
        case 'mark_complete':
          result = await handleMarkComplete(userId, flowId);
          break;
        default: {
          const exhaustive: never = action.type;
          result = { type: exhaustive, success: false, error: `Unknown action type: ${exhaustive}` };
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result = { type: action.type, success: false, error: message };
    }

    // Record successful execution for idempotency (skip client-only actions that don't need tracking)
    if (result.success && !result.skipped) {
      await recordExecution(flowId, userId, stepId, action.type);
    }

    results.push(result);
  }

  return results;
}
