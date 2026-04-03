import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) ?? ['members', 'events', 'courses', 'pages', 'help'];

  if (q.length < 2) {
    return NextResponse.json({ results: { members: [], events: [], courses: [], pages: [], help: [] }, total: 0 });
  }

  const supabase = await createSupabaseServerClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile for role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'student';
  const isAdmin = role === 'admin' || role === 'moderator';
  const limit = 20;

  const results: Record<string, unknown[]> = {
    members: [],
    events: [],
    courses: [],
    pages: [],
    help: [],
  };

  // Members search
  if (categories.includes('members')) {
    let memberQuery = (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('profiles')
      .select('id, full_name, avatar_url, role, city, country, street_address')
      .ilike('full_name', `%${q}%`)
      .limit(limit);

    // Admin can also search by email and mrn
    if (isAdmin && (q.includes('@') || /^\d+$/.test(q))) {
      memberQuery = (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('profiles')
        .select('id, full_name, avatar_url, role, city, country, street_address, email, mrn')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,mrn.ilike.%${q}%`)
        .limit(limit);
    }

    const { data: members } = await memberQuery;
    if (members) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.members = members.map((m: any) => ({
        id: m.id,
        category: 'members',
        title: m.full_name || 'Unknown',
        subtitle: [m.role, m.city, m.country].filter(Boolean).join(' · '),
        href: `/members/${m.id}`,
        avatarUrl: m.avatar_url,
        has_full_address: Boolean(m.street_address && m.city && m.country),
      }));
    }
  }

  // Events search
  if (categories.includes('events')) {
    const { data: events } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('events')
      .select('id, title, start_date, format, category')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .eq('status', 'published')
      .limit(limit);

    if (events) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.events = events.map((e: any) => ({
        id: e.id,
        category: 'events',
        title: e.title,
        subtitle: e.start_date ? new Date(e.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        href: `/events/${e.id}`,
      }));
    }
  }

  // Courses search
  if (categories.includes('courses')) {
    const { data: courses } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('courses')
      .select('id, title, thumbnail_url')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .eq('status', 'published')
      .limit(limit);

    if (courses) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.courses = courses.map((c: any) => ({
        id: c.id,
        category: 'courses',
        title: c.title,
        subtitle: 'Course',
        href: `/academy/${c.id}`,
        avatarUrl: c.thumbnail_url,
      }));
    }
  }

  // Help articles (FAQ) search
  if (categories.includes('help')) {
    const { data: faqs } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('faq_items')
      .select('id, question, answer')
      .ilike('question', `%${q}%`)
      .eq('status', 'published')
      .limit(limit);

    if (faqs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.help = faqs.map((f: any) => ({
        id: f.id,
        category: 'help',
        title: f.question,
        subtitle: f.answer ? (f.answer.length > 100 ? f.answer.slice(0, 100) + '…' : f.answer) : '',
        href: '/settings/help',
      }));
    }
  }

  // Pages search (static registry, role-filtered)
  if (categories.includes('pages')) {
    const pages = getPageRegistry(role);
    const lowerQ = q.toLowerCase();
    results.pages = pages
      .filter(p => p.title.toLowerCase().includes(lowerQ) || (p.description?.toLowerCase().includes(lowerQ) ?? false))
      .slice(0, limit)
      .map(p => ({
        id: `page-${p.route}`,
        category: 'pages',
        title: p.title,
        subtitle: p.description,
        href: p.route,
      }));
  }

  const total = Object.values(results).reduce((sum, arr) => sum + (arr as unknown[]).length, 0);

  return NextResponse.json({ results, total });
}

// ─── Page Registry ───────────────────────────────────────────────────────────

interface PageEntry {
  title: string;
  route: string;
  description?: string;
  roles: string[] | 'all';
}

const PAGE_REGISTRY: PageEntry[] = [
  { title: 'Dashboard', route: '/dashboard', description: 'Your personal dashboard', roles: 'all' },
  { title: 'Members', route: '/members', description: 'Browse all members', roles: 'all' },
  { title: 'Events', route: '/events', description: 'Upcoming events', roles: 'all' },
  { title: 'Academy', route: '/academy', description: 'Courses and learning', roles: 'all' },
  { title: 'Add-Ons', route: '/add-ons', description: 'Products and add-ons', roles: 'all' },
  { title: 'Settings', route: '/settings', description: 'Your settings', roles: 'all' },
  { title: 'Settings: Help', route: '/settings/help', description: 'Help and FAQ', roles: 'all' },
  { title: 'Settings: Subscriptions', route: '/settings/subscriptions', description: 'Manage subscriptions', roles: 'all' },
  { title: 'Settings: Credits', route: '/settings/credits', description: 'CPD credits', roles: 'all' },
  { title: 'Settings: Connections', route: '/settings/connections', description: 'Your connections', roles: 'all' },
  { title: 'Admin: Dashboard', route: '/admin', description: 'Admin overview', roles: ['admin', 'moderator'] },
  { title: 'Admin: Users', route: '/admin/users', description: 'Manage users', roles: ['admin', 'moderator'] },
  { title: 'Admin: Events', route: '/admin/events', description: 'Manage events', roles: ['admin', 'moderator'] },
  { title: 'Admin: Courses', route: '/admin/courses', description: 'Manage courses', roles: ['admin', 'moderator'] },
  { title: 'Admin: Inbox', route: '/admin/inbox', description: 'Admin inbox', roles: ['admin', 'moderator'] },
  { title: 'Admin: Settings', route: '/admin/settings', description: 'Site settings', roles: ['admin'] },
  { title: 'Admin: Chatbot', route: '/admin/chatbot', description: 'Chatbot configuration', roles: ['admin'] },
  { title: 'Admin: Shop', route: '/admin/shop', description: 'Shop management', roles: ['admin'] },
  { title: 'Admin: API Keys', route: '/admin/api-keys', description: 'API key management', roles: ['admin'] },
];

function getPageRegistry(role: string): PageEntry[] {
  return PAGE_REGISTRY.filter(p => {
    if (p.roles === 'all') return true;
    return p.roles.includes(role);
  });
}
