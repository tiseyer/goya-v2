import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getSupabaseService } from '@/lib/supabase/service'
import { sendEmailFromTemplate } from '@/lib/email/send'

// Do NOT export runtime = 'edge' — this route uses Node.js crypto (randomInt, createHash)

export async function POST(request: NextRequest) {
  // Step 1 — Parse pending cookie
  const pendingCookie = request.cookies.get('device_pending_verification')?.value
  if (!pendingCookie) {
    return NextResponse.json({ error: 'missing_pending_cookie' }, { status: 400 })
  }
  const parts = pendingCookie.split('|')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return NextResponse.json({ error: 'missing_pending_cookie' }, { status: 400 })
  }
  const [profileId, deviceFingerprint] = parts

  const supabase = getSupabaseService()

  // Step 2 — Check for existing valid code (idempotency)
  const now = new Date().toISOString()
  const { data: existingCode, error: fetchError } = await supabase
    .from('device_verification_codes')
    .select('id, created_at, expires_at, invalidated')
    .eq('profile_id', profileId)
    .eq('device_fingerprint', deviceFingerprint)
    .eq('invalidated', false)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error('[device-verification/send] fetch error:', fetchError)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  if (existingCode) {
    const ageMs = Date.now() - new Date(existingCode.created_at).getTime()
    if (ageMs < 120_000) {
      // Within 2-minute idempotency window — return existing expiry
      return NextResponse.json({ expiresAt: existingCode.expires_at })
    }
    // Older than 2 minutes but not yet expired — invalidate it before generating new
    const { error: invalidateError } = await supabase
      .from('device_verification_codes')
      .update({ invalidated: true })
      .eq('id', existingCode.id)
    if (invalidateError) {
      console.error('[device-verification/send] invalidate error:', invalidateError)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
  }

  // Step 3 — Generate new OTP
  const code = crypto.randomInt(100000, 999999)
  const codeStr = String(code)
  const hashed_code = crypto.createHash('sha256').update(codeStr).digest('hex')
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Step 4 — Insert new code row
  const { error: insertError } = await supabase
    .from('device_verification_codes')
    .insert({ profile_id: profileId, device_fingerprint: deviceFingerprint, hashed_code, expires_at })

  if (insertError) {
    console.error('[device-verification/send] insert error:', insertError)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  // Step 5 — Fetch profile email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', profileId)
    .single()

  if (profileError || !profile?.email) {
    console.error('[device-verification/send] profile fetch error:', profileError)
    return NextResponse.json({ error: 'profile_not_found' }, { status: 500 })
  }

  // Step 6 — Send email (non-fatal on failure)
  const deviceName = request.cookies.get('goya_device_name')?.value ?? 'your device'
  const emailResult = await sendEmailFromTemplate({
    to: profile.email,
    templateKey: 'device_verification_otp',
    variables: { code: codeStr, deviceName },
  })
  if (!emailResult.success) {
    console.warn('[device-verification/send] email send failed:', emailResult.reason ?? emailResult.error)
  }

  // Step 7 — Return expiresAt
  return NextResponse.json({ expiresAt: expires_at })
}
