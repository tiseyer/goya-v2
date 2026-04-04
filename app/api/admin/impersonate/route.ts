import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import { isAdminOrAbove } from '@/lib/roles';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify admin role server-side
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminOrAbove(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { targetUserId } = body;
  if (!targetUserId) {
    return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
  }

  const service = getSupabaseService();

  // Verify target profile exists
  const { data: targetProfile } = await (service as any)
    .from('profiles')
    .select('id')
    .eq('id', targetUserId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get email from auth.users via admin API
  const { data: { user: targetUser }, error: userErr } = await (service as any).auth.admin.getUserById(targetUserId);
  if (userErr || !targetUser?.email) {
    return NextResponse.json({ error: 'Could not resolve user email' }, { status: 500 });
  }

  // Generate magic link for independent session in new tab
  const { data: linkData, error: linkErr } = await (service as any).auth.admin.generateLink({
    type: 'magiclink',
    email: targetUser.email,
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error('generateLink error:', linkErr);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }

  return NextResponse.json({ token: linkData.properties.hashed_token });
}
