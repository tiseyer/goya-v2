# School Context Switch — Implementation Plan

**Date:** 2026-04-02
**Branch:** feature/school-context-switch

## Architecture Decision

**Option B: Cookie-based context switching** via `goya_active_context` cookie.

- Cookie: `goya_active_context` = `personal` | `school:<school_id>`
- Middleware reads cookie → forwards as `x-active-context` header
- Server utility `getActiveContext()` parses header
- Client hook `useActiveContext()` reads context
- All write actions check context for attribution

## Phase 1: Research ✓
Completed — see `school-context-switch-research.md`

## Phase 2: Plan ✓
This document.

## Phase 3: Database Foundation

### 3a: Add `can_manage` to school_faculty
```sql
ALTER TABLE public.school_faculty
  ADD COLUMN IF NOT EXISTS can_manage boolean DEFAULT false;
```
Owner (owner_id on schools) always has implicit full access. `can_manage = true` on faculty allows context switching.

### 3b: Add author context columns
```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS author_type text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS school_author_id uuid REFERENCES public.schools(id);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS author_type text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS school_author_id uuid REFERENCES public.schools(id);

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS participant_1_type text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS participant_1_school_id uuid REFERENCES public.schools(id),
  ADD COLUMN IF NOT EXISTS participant_2_type text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS participant_2_school_id uuid REFERENCES public.schools(id);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS sender_school_id uuid REFERENCES public.schools(id);
```

### 3c: Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_events_school_author ON public.events(school_author_id) WHERE school_author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_school_author ON public.courses(school_author_id) WHERE school_author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender_school ON public.messages(sender_school_id) WHERE sender_school_id IS NOT NULL;
```

### 3d: Regenerate types
`npx supabase gen types typescript --project-id snddprncgilpctgvjukr --schema public > types/supabase.ts`

## Phase 4: Seed Data
Create `scripts/seed-school-context-test.ts`:
- Test teacher: teacher-test@goya-test.com / GOYAtest2026!
- School: Berlin Yoga Studio (owned by test teacher)
- 2-3 faculty profiles linked to school

## Phase 5: Context Infrastructure

### 5a: Server utility — `lib/active-context.ts`
```typescript
export type ActiveContext =
  | { type: 'personal'; profileId: string }
  | { type: 'school'; schoolId: string; profileId: string }

export function parseActiveContext(headerValue: string | null, profileId: string): ActiveContext
export async function getUserSchools(profileId: string): Promise<School[]>
```

### 5b: Server action — `app/actions/context.ts`
```typescript
export async function switchContext(target: 'personal' | `school:${string}`): Promise<void>
// Sets goya_active_context cookie, revalidates layout
```

### 5c: Client hook — `hooks/useActiveContext.ts`
```typescript
export function useActiveContext(): {
  context: ActiveContext
  isSchoolContext: boolean
  switchToPersonal: () => void
  switchToSchool: (schoolId: string) => void
  availableSchools: School[]
}
```

### 5d: Middleware update — `middleware.ts`
- Read `goya_active_context` cookie
- Forward as `x-active-context` header on response
- Validate: if `school:<id>`, verify user has access (owner or can_manage=true faculty)
- Invalid → reset to `personal`

## Phase 6: Profile Dropdown UI
Redesign UserMenu in `app/components/Header.tsx`:

**Personal context (teacher with school):**
```
[Avatar] Sarah Mitchell
         MRN: 52537514
--- Switch to ---
[School Logo] Berlin Yoga Studio →
---
My Profile | Credits & Hours | Messages | Settings
Logout
```

**School context:**
```
[School Logo] Berlin Yoga Studio
              School Account
--- Switch to ---
[Avatar] Sarah Mitchell →
---
School Profile | Messages | School Settings | Back to personal
Logout
```

Rules:
- Top shows active identity (avatar/logo + name)
- Switch section shows available alternatives
- Menu items change based on context
- Navbar avatar changes to school logo
- Hidden entirely if user has no school access

## Phase 7: Dashboard Context Awareness
- Replace `?view=school` URL param with cookie-based context
- Read `x-active-context` header in page.tsx
- School context → school dashboard (existing DashboardSchool)
- Personal context → personal dashboard (existing role-based)
- Remove toggle pills from DashboardTeacher/DashboardSchool

## Phase 8: Messages Context Awareness
- School context → show school conversations
- Personal context → show personal conversations
- New messages in school context: `sender_type='school'`, `sender_school_id=activeSchoolId`
- Display: show school name + logo for school-type senders

## Phase 9: Events & Courses Context Awareness
- `my-events/actions.ts`: if school context, set `author_type='school'`, `school_author_id=schoolId`
- `my-courses/actions.ts`: same pattern
- Display: show school name + logo on cards for school-authored content
- School profile page: filter events/courses by `school_author_id`

## Phase 10: School Settings Page
- Already exists at `app/schools/[slug]/settings/`
- Add faculty `can_manage` toggle to faculty management page
- Ensure accessible to owner and can_manage faculty

## Phase 11: QA & Cleanup
- `npx tsc --noEmit` — fix all errors
- Update LOG.md, activity file
- Update types in `lib/types.ts`

## Phase 12: Pull Request
- Push branch, create PR to develop

## Risk Areas

1. **Middleware performance**: Context validation requires DB query. Use TTL cache like maintenance mode.
2. **Message routing**: Conversations table uses participant_1/participant_2 as UUIDs — school is a school_id, not a profile_id. Need careful handling.
3. **Existing school settings**: Already exists at `/schools/[slug]/settings/` with 8 sections — don't duplicate, just make context-aware.
4. **RLS implications**: Author context columns need RLS policy updates for events/courses.
5. **Feed/posts**: Community feed may need author_type too, but feed is deleted (v1.17) — confirm.
