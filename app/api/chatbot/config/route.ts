import { getSupabaseService } from '@/lib/supabase/service'

/**
 * GET /api/chatbot/config
 *
 * Public endpoint — no authentication required.
 * Returns only safe public fields: is_active, name, avatar_url, chatbot_maintenance_mode.
 * Cached for 60s to reduce DB load on every widget mount.
 */
export async function GET() {
  try {
    const supabase = getSupabaseService()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [configResult, settingResult] = await Promise.all([
      (supabase as any)
        .from('chatbot_config')
        .select('is_active, name, avatar_url')
        .single(),
      (supabase as any)
        .from('site_settings')
        .select('value')
        .eq('key', 'chatbot_maintenance_mode')
        .single(),
    ])

    if (configResult.error || !configResult.data) {
      return Response.json({ error: 'Failed to load config' }, { status: 500 })
    }

    const config = configResult.data
    const chatbotMaintenanceMode = settingResult.data?.value === 'true'

    return Response.json(
      {
        is_active: config.is_active,
        name: config.name,
        avatar_url: config.avatar_url,
        chatbot_maintenance_mode: chatbotMaintenanceMode,
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
