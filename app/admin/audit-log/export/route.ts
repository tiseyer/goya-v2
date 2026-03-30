import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse filters from search params
    const { searchParams } = request.nextUrl;
    const search   = searchParams.get('search') ?? '';
    const category = searchParams.get('category') ?? '';
    const severity = searchParams.get('severity') ?? '';
    const dateFrom = searchParams.get('from') ?? '';
    const dateTo   = searchParams.get('to') ?? '';

    let query = supabase
      .from('audit_log')
      .select('id, category, action, severity, actor_name, actor_role, target_type, target_label, description, ip_address, created_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (search) {
      query = query.or(
        `description.ilike.%${search}%,actor_name.ilike.%${search}%,action.ilike.%${search}%,target_label.ilike.%${search}%`
      );
    }
    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z');

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build CSV
    const headers = ['Time', 'Category', 'Severity', 'Actor', 'Role', 'Action', 'Target Type', 'Target', 'Description', 'IP'];
    const csvRows = [headers.join(',')];

    for (const row of rows ?? []) {
      csvRows.push([
        row.created_at,
        row.category,
        row.severity,
        escapeCSV(row.actor_name ?? ''),
        escapeCSV(row.actor_role ?? ''),
        escapeCSV(row.action),
        escapeCSV(row.target_type ?? ''),
        escapeCSV(row.target_label ?? ''),
        escapeCSV(row.description ?? ''),
        row.ip_address ?? '',
      ].join(','));
    }

    const csv = csvRows.join('\n');
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-log-${date}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Export failed' },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
