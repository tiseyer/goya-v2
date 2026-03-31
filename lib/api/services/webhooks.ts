/**
 * Incoming webhook processing functions.
 * External services call these endpoints to trigger actions,
 * report payments, and send notifications within the GOYA platform.
 */

export interface WebhookTriggerPayload {
  type: string;       // required — event type identifier (e.g., "user.updated", "course.completed")
  payload: Record<string, unknown>;  // required — arbitrary JSON payload
  timestamp?: string; // optional ISO timestamp
}

export interface WebhookPaymentPayload {
  transaction_id: string;   // required — external payment reference
  amount_cents: number;     // required — payment amount in cents
  currency: string;         // required — ISO currency code (e.g., "USD")
  user_id?: string;         // optional — GOYA user ID if known
  status: string;           // required — "completed" | "refunded" | "failed"
  metadata?: Record<string, unknown>;
}

export interface WebhookNotifyPayload {
  user_ids: string[];      // required — at least one user ID
  message: string;         // required — notification message
  channel?: string;        // optional — "email" | "in_app" (default: "in_app")
  metadata?: Record<string, unknown>;
}

const VALID_PAYMENT_STATUSES = ['completed', 'refunded', 'failed'] as const;
const VALID_NOTIFY_CHANNELS = ['email', 'in_app'] as const;

/**
 * Process an incoming generic webhook trigger.
 * Per WHKN-01.
 */
export async function processWebhookTrigger(
  payload: WebhookTriggerPayload
): Promise<{ data: { success: true; event_type: string; received_at: string } | null; error: string | null }> {
  // Validate
  if (!payload.type || typeof payload.type !== 'string' || payload.type.trim() === '') {
    return { data: null, error: 'type must be a non-empty string' };
  }
  if (!payload.payload || typeof payload.payload !== 'object' || Array.isArray(payload.payload)) {
    return { data: null, error: 'payload must be a JSON object' };
  }

  console.log(`[webhook:trigger] type=${payload.type}`);

  return {
    data: {
      success: true,
      event_type: payload.type,
      received_at: new Date().toISOString(),
    },
    error: null,
  };
}

/**
 * Process an incoming payment webhook.
 * Per WHKN-02.
 */
export async function processWebhookPayment(
  payload: WebhookPaymentPayload
): Promise<{ data: { success: true; transaction_id: string; status: string; received_at: string } | null; error: string | null }> {
  // Validate
  if (!payload.transaction_id || typeof payload.transaction_id !== 'string' || payload.transaction_id.trim() === '') {
    return { data: null, error: 'transaction_id must be a non-empty string' };
  }
  if (typeof payload.amount_cents !== 'number') {
    return { data: null, error: 'amount_cents must be a number' };
  }
  if (!payload.currency || typeof payload.currency !== 'string' || payload.currency.trim().length !== 3) {
    return { data: null, error: 'currency must be a 3-character ISO currency code' };
  }
  if (!payload.status || !(VALID_PAYMENT_STATUSES as readonly string[]).includes(payload.status)) {
    return { data: null, error: `status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}` };
  }

  console.log(`[webhook:payment] txn=${payload.transaction_id} status=${payload.status}`);

  return {
    data: {
      success: true,
      transaction_id: payload.transaction_id,
      status: payload.status,
      received_at: new Date().toISOString(),
    },
    error: null,
  };
}

/**
 * Process an incoming notification webhook.
 * Per WHKN-03.
 */
export async function processWebhookNotify(
  payload: WebhookNotifyPayload
): Promise<{ data: { success: true; notified_count: number; channel: string; received_at: string } | null; error: string | null }> {
  // Validate
  if (
    !Array.isArray(payload.user_ids) ||
    payload.user_ids.length === 0 ||
    !payload.user_ids.every((id) => typeof id === 'string')
  ) {
    return { data: null, error: 'user_ids must be a non-empty array of strings' };
  }
  if (!payload.message || typeof payload.message !== 'string' || payload.message.trim() === '') {
    return { data: null, error: 'message must be a non-empty string' };
  }
  if (payload.channel !== undefined && !(VALID_NOTIFY_CHANNELS as readonly string[]).includes(payload.channel)) {
    return { data: null, error: `channel must be one of: ${VALID_NOTIFY_CHANNELS.join(', ')}` };
  }

  const channel = payload.channel ?? 'in_app';
  console.log(`[webhook:notify] users=${payload.user_ids.length} channel=${channel}`);

  return {
    data: {
      success: true,
      notified_count: payload.user_ids.length,
      channel,
      received_at: new Date().toISOString(),
    },
    error: null,
  };
}
