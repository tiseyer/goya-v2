import { NextResponse } from 'next/server';
import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import { CONSENT_VERSION } from '@/lib/cookies/config';

/**
 * POST /api/cookie-consent
 *
 * Syncs cookie consent to Supabase for logged-in users.
 * Guests only use the browser cookie — this endpoint is a no-op for them.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { preferences, statistics, marketing, version } = body;

    // Validate version matches current
    if (version !== CONSENT_VERSION) {
      return NextResponse.json({ error: 'Version mismatch' }, { status: 400 });
    }

    // Validate booleans
    if (
      typeof preferences !== 'boolean' ||
      typeof statistics !== 'boolean' ||
      typeof marketing !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Invalid consent data' }, { status: 400 });
    }

    const supabase = await createSupabaseServerActionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Not logged in — that's fine, cookie is the primary store
    if (!user) {
      return NextResponse.json({ ok: true, synced: false });
    }

    // Upsert consent row
    const { error } = await supabase
      .from('cookie_consents' as string)
      .upsert(
        {
          user_id: user.id,
          version: CONSENT_VERSION,
          preferences,
          statistics,
          marketing,
          consented_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      console.error('[cookie-consent] Supabase upsert error:', error);
      return NextResponse.json({ ok: true, synced: false });
    }

    return NextResponse.json({ ok: true, synced: true });
  } catch {
    return NextResponse.json({ ok: true, synced: false });
  }
}
