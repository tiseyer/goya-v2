import { getSupabaseService } from '@/lib/supabase/service'

/**
 * GET /api/chatbot/config
 *
 * Public endpoint — no authentication required.
 * Returns only safe public fields: is_active, name, avatar_url.
 * Cached for 60s to reduce DB load on every widget mount.
 */
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: config, error } = await (getSupabaseService() as any)
      .from('chatbot_config')
      .select('is_active, name, avatar_url')
      .single()

    if (error || !config) {
      return Response.json({ error: 'Failed to load config' }, { status: 500 })
    }

    return Response.json(
      {
        is_active: config.is_active,
        name: config.name,
        avatar_url: config.avatar_url,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch {
    return Response.json({ error: 'Failed to load config' }, { status: 500 })
  }
}
