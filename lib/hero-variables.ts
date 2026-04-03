export interface HeroContext {
  firstName?: string;
  fullName?: string;
  role?: string;
  greeting?: string;
  memberCount?: number;
  eventCount?: number;
}

export const HERO_VARIABLES = [
  { key: '[first_name]', label: 'First Name', description: 'User first name' },
  { key: '[full_name]', label: 'Full Name', description: 'User full name' },
  { key: '[role]', label: 'Role', description: 'User role (Student, Teacher, etc.)' },
  { key: '[greeting]', label: 'Greeting', description: 'Good morning/afternoon/evening' },
  { key: '[member_count]', label: 'Members', description: 'Total member count' },
  { key: '[event_count]', label: 'Events', description: 'Total event count' },
] as const;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function resolveHeroVariables(text: string, ctx: HeroContext): string {
  return text
    .replace(/\[first_name\]/g, ctx.firstName ?? '')
    .replace(/\[full_name\]/g, ctx.fullName ?? '')
    .replace(/\[role\]/g, ctx.role ?? '')
    .replace(/\[greeting\]/g, ctx.greeting ?? getGreeting())
    .replace(/\[member_count\]/g, String(ctx.memberCount ?? 0))
    .replace(/\[event_count\]/g, String(ctx.eventCount ?? 0));
}
