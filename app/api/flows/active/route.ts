import { NextResponse } from 'next/server';
import { getEffectiveUserId } from '@/lib/supabase/getEffectiveUserId';
import { getActiveFlowForUser } from '@/lib/flows/engine';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { FlowTriggerType } from '@/lib/flows/types';

export async function GET(request: Request) {
  let userId: string;
  try {
    userId = await getEffectiveUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check flows sandbox — if active, only admins see flows
  const supabase = await createSupabaseServerClient();
  const [{ data: sandboxRow }, { data: profile }] = await Promise.all([
    supabase.from('site_settings').select('value').eq('key', 'flows_sandbox').single(),
    supabase.from('profiles').select('role').eq('id', userId).single(),
  ]);
  const role = profile?.role ?? 'member';
  if (sandboxRow?.value === 'true' && role !== 'admin' && role !== 'moderator') {
    return NextResponse.json({ flow: null }, { status: 200 });
  }

  // Read optional trigger query param, default to 'login'
  const { searchParams } = new URL(request.url);
  const trigger = (searchParams.get('trigger') ?? 'login') as FlowTriggerType;

  const result = await getActiveFlowForUser(userId, trigger);

  if (!result) {
    return NextResponse.json({ flow: null }, { status: 200 });
  }

  // Sanity check: conditions must not appear in the response
  // (engine already strips them, but guard here as well)
  const { flow, steps, response } = result;
  if ('conditions' in flow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { conditions: _c, ...safeFlow } = flow as any;
    return NextResponse.json({ flow: safeFlow, steps, response }, { status: 200 });
  }

  return NextResponse.json({ flow, steps, response }, { status: 200 });
}
