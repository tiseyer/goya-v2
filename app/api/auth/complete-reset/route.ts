import { NextResponse } from 'next/server';
import { createSupabaseServerActionClient } from '@/lib/supabaseServer';

export async function POST() {
  // Verify the user is actually authenticated before clearing
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('password_reset_pending', '', {
    path: '/',
    maxAge: 0,
  });
  return response;
}
