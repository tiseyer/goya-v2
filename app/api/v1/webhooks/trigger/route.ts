import { createApiHandler } from '@/lib/api/handler';
import { validateApiKey, rateLimit, requirePermission } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { processWebhookTrigger } from '@/lib/api/services/webhooks';
import type { WebhookTriggerPayload } from '@/lib/api/services/webhooks';

const handlers = createApiHandler({
  POST: async (ctx) => {
    // Auth
    const keyOrError = await validateApiKey(ctx.req);
    if (keyOrError instanceof Response) return keyOrError;

    // Rate limit
    const limited = rateLimit(keyOrError.id);
    if (limited) return limited;

    // Permission — write required for webhooks
    const forbidden = requirePermission(keyOrError, 'write');
    if (forbidden) return forbidden;

    // Parse body
    let body: WebhookTriggerPayload;
    try {
      body = await ctx.req.json();
    } catch {
      return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);
    }

    // Process
    const { data, error } = await processWebhookTrigger(body);
    if (error || !data) {
      return errorResponse('INVALID_PAYLOAD', error ?? 'Invalid payload', 400);
    }

    // Audit log
    await ctx.logAudit({
      category: 'system',
      action: 'webhook.trigger',
      target_type: 'webhook',
      description: 'Received trigger webhook',
      metadata: { type: body.type },
    });

    return successResponse(data);
  },
});

export const POST = handlers.POST;
