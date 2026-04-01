import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // This is a placeholder — adapt to your actual credits table structure
  // For now just return ok since credits table may not exist yet
  console.log('[cron] credits-expiring ran at', now.toISOString())

  return NextResponse.json({ ok: true, message: 'Credits expiring cron ran (no credits table yet)' })
}
