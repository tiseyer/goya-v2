import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { completeFlow } from '@/lib/flows/engine';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth: require authenticated user
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const result = await completeFlow(user.id, id);

  if (!result.success) {
    const message = result.error instanceof Error ? result.error.message : 'Failed to complete flow';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
