import { NextRequest } from 'next/server';
import { errorResponse } from './response';
import { logAudit } from '@/lib/audit';
import type { ApiKeyRow } from './types';

export interface ApiContext {
  req: NextRequest;
  url: URL;
  apiKey: ApiKeyRow | null; // populated by middleware, null for unauthenticated routes
  logAudit: typeof logAudit; // convenience: route handlers call ctx.logAudit() for write operations
}

type ApiHandler = (ctx: ApiContext) => Promise<Response>;

interface HandlerMap {
  GET?: ApiHandler;
  POST?: ApiHandler;
  PATCH?: ApiHandler;
  DELETE?: ApiHandler;
}

/**
 * Factory that creates Next.js App Router handlers from a method map.
 * Per AUTH-07: reduces repetition across all API endpoints.
 * Per AUTH-08: route files call this with thin handlers that delegate to service functions.
 * Per AUDT-01: ctx.logAudit is available for write operations to log audit entries.
 *
 * Usage in a route.ts:
 *   import { createApiHandler } from '@/lib/api/handler';
 *   const { GET, POST } = createApiHandler({
 *     GET: async (ctx) => { ... },
 *     POST: async (ctx) => {
 *       // ... create resource ...
 *       await ctx.logAudit({ category: 'user', action: 'resource.create', ... });
 *       return successResponse(resource, 201);
 *     },
 *   });
 *   export { GET, POST };
 */
export function createApiHandler(handlers: HandlerMap) {
  const methods = ['GET', 'POST', 'PATCH', 'DELETE'] as const;
  const exported: Record<string, (req: NextRequest) => Promise<Response>> = {};

  for (const method of methods) {
    const handler = handlers[method];
    if (!handler) continue;

    exported[method] = async (req: NextRequest) => {
      try {
        const url = new URL(req.url);
        // apiKey will be injected by middleware via request header (serialized JSON)
        let apiKey: ApiKeyRow | null = null;
        const apiKeyHeader = req.headers.get('x-api-key-data');
        if (apiKeyHeader) {
          try {
            apiKey = JSON.parse(apiKeyHeader) as ApiKeyRow;
          } catch {
            // ignore parse errors
          }
        }
        const ctx: ApiContext = { req, url, apiKey, logAudit };
        return await handler(ctx);
      } catch (err) {
        console.error(`[api] ${method} ${req.url} error:`, err);
        return errorResponse(
          'INTERNAL_ERROR',
          'An unexpected error occurred',
          500
        );
      }
    };
  }

  return exported;
}
