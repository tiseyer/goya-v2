---
phase: quick
plan: 260402-jts
type: execute
wave: 1
depends_on: []
files_modified:
  - app/dashboard/components/TeacherCard.tsx
  - app/dashboard/components/DashboardStudent.tsx
autonomous: true
must_haves:
  truths:
    - "Student dashboard shows DashboardGreeting with role=student"
    - "Student dashboard shows Teachers carousel with teacher connections"
    - "Student dashboard shows Courses carousel with CourseCard components"
    - "Student dashboard shows Events carousel with EventCard components"
    - "Empty carousels show contextual empty states with CTA links"
  artifacts:
    - path: "app/dashboard/components/TeacherCard.tsx"
      provides: "Teacher card for carousel display"
      exports: ["TeacherCard", "TeacherCardProps"]
    - path: "app/dashboard/components/DashboardStudent.tsx"
      provides: "Full student dashboard with 3 carousels"
      min_lines: 90
  key_links:
    - from: "app/dashboard/components/DashboardStudent.tsx"
      to: "app/dashboard/components/TeacherCard.tsx"
      via: "import { TeacherCard }"
      pattern: "TeacherCard"
    - from: "app/dashboard/components/DashboardStudent.tsx"
      to: "app/dashboard/components/HorizontalCarousel.tsx"
      via: "import { HorizontalCarousel }"
      pattern: "HorizontalCarousel"
---

<objective>
Restore the full v1.17 student dashboard layout that was built in Phase 45 but never merged from the worktree branch to develop.

Purpose: The student dashboard currently shows a stub with basic greeting and stat cards (StubSection components) instead of the redesigned carousel layout with TeacherCard, CourseCard, and EventCard components.

Root cause: Commits `769bfd6` (TeacherCard/CourseCard/EventCard) and `6356e16` (DashboardStudent full layout) exist on branch `worktree-agent-ae558d4d` but were never merged to `develop`. CourseCard and EventCard were later recreated on develop by other phases (50-01 and 45-02), but TeacherCard is still missing, and DashboardStudent was never updated.

Output: Working student dashboard with 3 horizontal carousels matching the Phase 45 spec.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/dashboard/components/DashboardStudent.tsx (current stub — to be replaced)
@app/dashboard/components/types.ts (DashboardProps interface)
@app/dashboard/components/HorizontalCarousel.tsx (existing carousel component)
@app/dashboard/components/DashboardGreeting.tsx (existing greeting component)
@app/dashboard/components/CourseCard.tsx (existing — use as-is)
@app/dashboard/components/EventCard.tsx (existing — use as-is)
@app/dashboard/components/DashboardWellness.tsx (reference for layout pattern)
@lib/dashboard/queries.ts (ConnectionProfile has role, username fields)

<interfaces>
<!-- Key types the executor needs -->

From app/dashboard/components/types.ts:
```typescript
export interface DashboardProps {
  profile: DashboardProfile
  events: EventRow[]
  courses: CourseRow[]
  connections: AcceptedConnection[]
  creditTotals: CreditTotals
  completion: ProfileCompletionResult
  inProgressCourses: InProgressCourseRow[]
}
```

From lib/dashboard/queries.ts:
```typescript
export interface ConnectionProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  username: string | null
}

export interface AcceptedConnection {
  connectionId: string
  profile: ConnectionProfile
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create TeacherCard component</name>
  <files>app/dashboard/components/TeacherCard.tsx</files>
  <action>
Create TeacherCard.tsx — the only card component missing from develop. Use the exact implementation from worktree commit 769bfd6 (verified working). The component must:

- Accept a `teacher` prop with fields: `id`, `full_name`, `avatar_url`, `teaching_styles`, `location`, `username`
- Render a 64px avatar with initials fallback (first char of full_name, uppercase)
- Show teaching style pills (max 3, with "+N more" overflow)
- Show location (fallback "Online")
- Link to `/directory/${username ?? id}`
- Use `w-[280px] shrink-0 snap-start` for carousel compatibility (matches CourseCard/EventCard sizing)
- Import `Card` from `@/app/components/ui/Card` with `variant="default" padding="none"`
- Import `Image` from `next/image` for avatar
- Export both `TeacherCard` component and `TeacherCardProps` interface

Reference implementation (from git show 769bfd6:app/dashboard/components/TeacherCard.tsx):

```tsx
import Image from 'next/image'
import Link from 'next/link'
import Card from '@/app/components/ui/Card'

export interface TeacherCardProps {
  teacher: {
    id: string
    full_name: string | null
    avatar_url: string | null
    teaching_styles: string[] | null
    location: string | null
    username: string | null
  }
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const initials = teacher.full_name
    ? teacher.full_name.charAt(0).toUpperCase()
    : '?'

  const styles = teacher.teaching_styles ?? []
  const visibleStyles = styles.slice(0, 3)
  const extraCount = styles.length - 3

  return (
    <Link href={`/directory/${teacher.username ?? teacher.id}`} className="block shrink-0 snap-start w-[280px]">
      <Card variant="default" padding="none" className="hover:shadow-md transition-shadow h-full">
        <div className="p-4">
          {teacher.avatar_url ? (
            <Image
              src={teacher.avatar_url}
              alt={teacher.full_name ?? 'Teacher'}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover bg-slate-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-400">{initials}</span>
            </div>
          )}

          <p className="text-sm font-semibold text-slate-900 mt-3 truncate">
            {teacher.full_name ?? 'Unknown Teacher'}
          </p>

          {visibleStyles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {visibleStyles.map((style) => (
                <span
                  key={style}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {style}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  +{extraCount} more
                </span>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-2">
            {teacher.location ?? 'Online'}
          </p>
        </div>
      </Card>
    </Link>
  )
}
```
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && test -f app/dashboard/components/TeacherCard.tsx && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>TeacherCard.tsx exists, exports TeacherCard and TeacherCardProps, TypeScript compiles with 0 errors</done>
</task>

<task type="auto">
  <name>Task 2: Replace DashboardStudent stub with full carousel layout</name>
  <files>app/dashboard/components/DashboardStudent.tsx</files>
  <action>
Replace the entire DashboardStudent stub with the full v1.17 carousel layout. The component must:

1. Import: `Link` (next/link), `PageContainer`, `Card`, `HorizontalCarousel`, `DashboardGreeting`, `TeacherCard`, `CourseCard`, `EventCard`, and `DashboardProps` type
2. Remove imports of `getTimeOfDay` and `StubSection` from `./utils` — these are no longer needed
3. Destructure `profile`, `events`, `courses`, `connections` from DashboardProps (completion/creditTotals/inProgressCourses not used in student layout)
4. Extract firstName from profile.full_name
5. Filter `connections` to `teacherConnections` where `c.profile.role === 'teacher'`

Layout (top to bottom, all inside PageContainer with py-8 space-y-8):

A. **DashboardGreeting** — firstName={firstName}, role="student", subtitle="Ready to practice today?"

B. **Teachers carousel** — HorizontalCarousel with:
   - title="Teachers that might suit you"
   - showAllHref="/members?role=teacher"
   - showAllLabel="Show all teachers"
   - emptyState: Card with text "Discover yoga teachers in the GOYA community." and Link to /members?role=teacher "Browse teachers"
   - Children: map teacherConnections to TeacherCard, passing teacher={{ id, full_name, avatar_url, teaching_styles: null, location: null, username }} from connection.profile

C. **Courses carousel** — HorizontalCarousel with:
   - title="Courses you might enjoy"
   - showAllHref="/academy"
   - showAllLabel="Show all courses"
   - emptyState: Card with text "Browse courses from GOYA teachers." and Link to /academy
   - Children: map courses to CourseCard

D. **Events carousel** — HorizontalCarousel with:
   - title="Upcoming events"
   - showAllHref="/events"
   - showAllLabel="Show all events"
   - emptyState: Card with text "No upcoming events yet — check back soon." and Link to /events
   - Children: map events to EventCard

Use DashboardWellness.tsx as the pattern reference — the structure is nearly identical. Key difference: Student has a teachers carousel (DashboardWellness has connections carousel), and Student uses TeacherCard while Wellness uses ConnectionCard.

For children of HorizontalCarousel: pass `null` when the array is empty (the emptyState prop handles that case). Pattern: `{arr.length > 0 ? arr.map(...) : null}`
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | tail -5 && grep -c "HorizontalCarousel" app/dashboard/components/DashboardStudent.tsx && grep -c "StubSection" app/dashboard/components/DashboardStudent.tsx</automated>
  </verify>
  <done>DashboardStudent renders 3 HorizontalCarousel sections (teachers, courses, events) with DashboardGreeting. Zero references to StubSection. TypeScript compiles with 0 errors.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with 0 errors
- `app/dashboard/components/TeacherCard.tsx` exists and exports TeacherCard
- `app/dashboard/components/DashboardStudent.tsx` contains 3 HorizontalCarousel instances
- `app/dashboard/components/DashboardStudent.tsx` does NOT import StubSection or getTimeOfDay
- `grep -c "HorizontalCarousel" app/dashboard/components/DashboardStudent.tsx` returns 3
</verification>

<success_criteria>
- Student dashboard shows DashboardGreeting with "Ready to practice today?"
- Student dashboard shows 3 horizontal carousels: teachers, courses, events
- Each carousel has proper empty states with CTA links
- TeacherCard renders avatar, name, teaching styles, location
- No StubSection references remain in DashboardStudent
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260402-jts-fix-dashboard-to-show-full-v1-17-redesig/260402-jts-SUMMARY.md`
</output>
