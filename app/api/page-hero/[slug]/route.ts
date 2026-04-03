import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('page_hero_content')
    .select('pill, title, subtitle')
    .eq('slug', slug)
    .single();

  return NextResponse.json({
    pill: data?.pill ?? null,
    title: data?.title ?? null,
    subtitle: data?.subtitle ?? null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  // Verify authenticated admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { pill?: string | null; title?: string | null; subtitle?: string | null };
  const { pill, title, subtitle } = body;

  const { data, error } = await supabase
    .from('page_hero_content')
    .upsert({
      slug,
      pill: pill ?? null,
      title: title ?? null,
      subtitle: subtitle ?? null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
