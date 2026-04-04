import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getSupabaseService } from '@/lib/supabase/service'

// Do NOT export runtime = 'edge' — this route uses Node.js crypto (timingSafeEqual, createHash)

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

  // Step 2 — Parse and validate request body
  let code: string
  try {
    const body = await request.json() as { code?: unknown }
    code = typeof body.code === 'string' ? body.code : ''
  } catch {
    return NextResponse.json({ error: 'invalid_code_format' }, { status: 400 })
  }
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'invalid_code_format' }, { status: 400 })
  }

  const supabase = getSupabaseService()

  // Step 3 — Fetch latest active code
  const { data: codeRow, error: fetchError } = await supabase
    .from('device_verification_codes')
    .select('id, hashed_code, expires_at, attempt_count, invalidated')
    .eq('profile_id', profileId)
    .eq('device_fingerprint', deviceFingerprint)
    .eq('invalidated', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error('[device-verification/verify] fetch error:', fetchError)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  if (!codeRow) {
    return NextResponse.json({ error: 'no_pending_verification' }, { status: 400 })
  }

  if (new Date(codeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'code_expired' }, { status: 400 })
  }

  if (codeRow.attempt_count >= 5) {
    return NextResponse.json({ error: 'too_many_attempts' }, { status: 400 })
  }

  // Step 4 — Compare code using timing-safe comparison
  const submittedHash = crypto.createHash('sha256').update(code).digest('hex')
  const storedHash = codeRow.hashed_code

  let isMatch = false
  try {
    isMatch = crypto.timingSafeEqual(
      Buffer.from(submittedHash, 'hex'),
      Buffer.from(storedHash, 'hex'),
    )
  } catch {
    // Buffer length mismatch or other error — treat as mismatch
    isMatch = false
  }

  // Step 5a — On MISMATCH
  if (!isMatch) {
    const newCount = codeRow.attempt_count + 1
    const updatePayload: { attempt_count: number; invalidated?: boolean } = {
      attempt_count: newCount,
    }
    if (newCount >= 5) {
      updatePayload.invalidated = true
    }
    const { error: updateError } = await supabase
      .from('device_verification_codes')
      .update(updatePayload)
      .eq('id', codeRow.id)
    if (updateError) {
      console.error('[device-verification/verify] attempt update error:', updateError)
    }
    return NextResponse.json(
      { error: 'invalid_code', remainingAttempts: Math.max(0, 5 - newCount) },
      { status: 400 },
    )
  }

  // Step 5b — On MATCH
  // (i) Insert trusted device
  const deviceName = request.cookies.get('goya_device_name')?.value ?? null
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null

  const { error: insertDeviceError } = await supabase
    .from('trusted_devices')
    .insert({
      profile_id: profileId,
      device_fingerprint: deviceFingerprint,
      device_name: deviceName,
      ip_address: ipAddress,
    })

  if (insertDeviceError) {
    console.error('[device-verification/verify] insert trusted_device error:', insertDeviceError)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  // (ii) Invalidate the code
  const { error: invalidateError } = await supabase
    .from('device_verification_codes')
    .update({ invalidated: true })
    .eq('id', codeRow.id)

  if (invalidateError) {
    console.error('[device-verification/verify] invalidate code error:', invalidateError)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  // (iii) Clear pending cookie and return success
  const response = NextResponse.json({ success: true })
  response.cookies.set('device_pending_verification', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
