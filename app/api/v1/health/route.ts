import { createApiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';

const handlers = createApiHandler({
  GET: async () => {
    return successResponse({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  },
});

export const GET = handlers.GET;
