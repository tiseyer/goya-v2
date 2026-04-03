// Search types and mock data for the Global Search Overlay
// No 'use client' directive — this is a pure types/data file.

export type SearchCategory = 'members' | 'events' | 'courses' | 'pages';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  href: string;
  avatarUrl?: string;
  has_full_address?: boolean;
  score?: number;
}

export const CATEGORY_ORDER = ['members', 'events', 'courses', 'pages'] as const;

export const CATEGORY_LABELS: Record<SearchCategory, string> = {
  members: 'Members',
  events: 'Events',
  courses: 'Courses',
  pages: 'Pages',
};

export const MOCK_RESULTS: SearchResult[] = [
  // Members
  {
    id: 'm1',
    category: 'members',
    title: 'Jane Smith',
    subtitle: 'Teacher · Berlin, DE',
    href: '/members/jane-smith',
    avatarUrl: undefined,
    has_full_address: true,
  },
  {
    id: 'm2',
    category: 'members',
    title: 'Alex Chen',
    subtitle: 'Student · Remote',
    href: '/members/alex-chen',
    has_full_address: false,
  },
  {
    id: 'm3',
    category: 'members',
    title: 'Maria Gonzalez',
    subtitle: 'Wellness Practitioner · Madrid, ES',
    href: '/members/maria-gonzalez',
    avatarUrl: 'https://i.pravatar.cc/150?u=maria',
    has_full_address: true,
  },
  // Events
  {
    id: 'e1',
    category: 'events',
    title: 'Spring Yoga Retreat',
    subtitle: 'Apr 15, 2026',
    href: '/events/spring-retreat',
  },
  {
    id: 'e2',
    category: 'events',
    title: 'Mindfulness & Meditation Workshop',
    subtitle: 'May 3, 2026',
    href: '/events/mindfulness-meditation-workshop',
  },
  // Courses
  {
    id: 'c1',
    category: 'courses',
    title: 'Yin Yoga Fundamentals',
    subtitle: '8 lessons',
    href: '/academy/yin-yoga',
  },
  {
    id: 'c2',
    category: 'courses',
    title: 'Pranayama for Beginners',
    subtitle: '5 lessons',
    href: '/academy/pranayama-beginners',
  },
  // Pages
  {
    id: 'p1',
    category: 'pages',
    title: 'Members Directory',
    subtitle: 'Browse all members',
    href: '/members',
  },
  {
    id: 'p2',
    category: 'pages',
    title: 'Events Calendar',
    subtitle: 'Upcoming events',
    href: '/events',
  },
  {
    id: 'p3',
    category: 'pages',
    title: 'Academy',
    subtitle: 'Courses and learning',
    href: '/academy',
  },
];

export function groupByCategory(results: SearchResult[]): Partial<Record<SearchCategory, SearchResult[]>> {
  return results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category]!.push(r);
    return acc;
  }, {} as Partial<Record<SearchCategory, SearchResult[]>>);
}
