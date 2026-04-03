import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase/service'
import { runAllChecks } from '@/lib/health-checks'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isAdminOrAbove } from '@/lib/roles'

export const dynamic = 'force-dynamic'

async function getAdminUser() {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // read-only in API routes
        },
      },
    }
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  const service = getSupabaseService()
  const { data: profile } = await (service as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !isAdminOrAbove(profile.role as string)) return null
  return user
}

export async function GET(request: Request) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const result = await runAllChecks(baseUrl)

  const sb = getSupabaseService()

  // Fetch monitor log and maintenance settings in parallel
  const [{ data: monitorLog }, { data: maintenanceRows }] = await Promise.all([
    (sb as any)
      .from('health_monitor_log')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(10),
    (sb as any)
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'maintenance_mode_enabled', 'email_sandbox_enabled', 'chatbot_maintenance_mode',
        'flows_sandbox', 'credit_hours_sandbox', 'theme_lock', 'page_visibility',
      ]),
  ])

  const maintenanceSettings: Record<string, string> = {}
  if (maintenanceRows) {
    for (const row of maintenanceRows as Array<{ key: string; value: string }>) {
      maintenanceSettings[row.key] = row.value ?? ''
    }
  }

  return NextResponse.json({ ...result, monitorLog: monitorLog ?? [], maintenanceSettings })
}
