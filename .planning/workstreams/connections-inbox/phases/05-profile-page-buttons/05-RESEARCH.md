# Phase 5: Profile Page Buttons — Research

**Researched:** 2026-03-23
**Domain:** React component prop extension, role-aware UI logic, Next.js server/client data flow
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROF-01 | Student viewing a teacher profile sees "Request Mentorship" instead of "Connect" | Role-pair lookup table in ConnectButton; pass `viewerRole` + `profileRole` from server component |
| PROF-02 | Teacher or wellness_practitioner viewing a school profile sees "Apply as Faculty" | Same role-pair lookup; `profileRole === 'school'` branch |
| PROF-03 | Teacher viewing a school they own sees "Manage School" instead of "Apply as Faculty" | Server component fetches `schools` table for `owner_id === currentUserId`; pass `isOwnSchool` or `profileOwnerId` to ConnectButton |
| PROF-04 | Teacher viewing another teacher profile sees the standard "Connect" button | Default peer path — no code change needed beyond new prop pass-through |
</phase_requirements>

---

## Summary

Phase 5 is a targeted extension of `ConnectButton` and its parent `MemberProfilePage`. The component currently receives four props and renders a hardcoded "Connect with {firstName}" CTA. This phase adds two new props — `viewerRole` and `profileRole` — and a third ownership signal so the component can select the right label, the right connection type sent to `sendRequest`, and the right variant for the "Manage School" navigation case.

All role data already exists in the `profiles` table (`member_type` column, constrained to `student | teacher | wellness_practitioner`; `role` column typed as the `user_role` enum). School ownership lives in the `schools` table (`owner_id uuid`). `MemberProfilePage` is a server component (`force-dynamic`) that already fetches the profile row and the current user ID — it only needs one additional query to check school ownership, and it already has both values needed to compute `viewerRole` (a second Supabase profile lookup for the viewer).

`ConnectionsContext.sendRequest` already accepts an optional `type` parameter (`peer | mentorship | faculty`, defaults to `peer`). No changes to the context are required.

The UI-SPEC specifies a migration: all inline `<button>` elements in `ConnectButton` must be replaced with the shared `Button` component from `app/components/ui/Button.tsx`. This is a style correctness requirement in the same PR, not a separate phase.

**Primary recommendation:** Add `viewerRole`, `profileRole`, and `profileOwnerId` props to `ConnectButton`. Derive label + connection type from a role-pair lookup object in the component. In `MemberProfilePage`, fetch the viewer's profile row and (conditionally) the schools table to compute `isOwnSchool`, then pass all three new props down.

---

## Standard Stack

### Core (no new dependencies — all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x (project) | Client component state + rendering | Already in project |
| Next.js App Router | 14/15 (project) | Server component data fetching | Already in project |
| Supabase JS | project version | Viewer profile + school ownership query | Already wired in `createSupabaseServerClient` |
| `app/components/ui/Button.tsx` | project | Shared button primitive | UI-SPEC migration requirement |

No new packages are required for this phase.

---

## Architecture Patterns

### Recommended Structure

No new files. Changes are confined to two existing files:

```
app/
├── components/
│   └── ConnectButton.tsx       — add 3 props, role-pair logic, Button migration
└── members/
    └── [id]/
        └── page.tsx            — fetch viewer profile + school ownership, pass new props
```

### Pattern 1: Role-Pair Lookup Table

**What:** A plain object keyed by `"viewerRole:profileRole"` returns `{ label, type }`. Default falls through to the peer case.

**When to use:** Whenever a small finite set of input combinations maps to distinct outputs. Avoids nested if/else chains.

**Example (from UI-SPEC contract):**
```typescript
type RolePair = `${string}:${string}`;

const ROLE_PAIR_MAP: Partial<Record<RolePair, { label: string; type: 'peer' | 'mentorship' | 'faculty' }>> = {
  'student:teacher':                 { label: 'Request Mentorship',  type: 'mentorship' },
  'teacher:school':                  { label: 'Apply as Faculty',    type: 'faculty'    },
  'wellness_practitioner:school':    { label: 'Apply as Faculty',    type: 'faculty'    },
};

const DEFAULT_CTA = { label: `Connect with ${firstName}`, type: 'peer' as const };
const cta = ROLE_PAIR_MAP[`${viewerRole}:${profileRole}`] ?? DEFAULT_CTA;
```

**Confidence:** HIGH — pattern derived directly from UI-SPEC Button State Matrix.

### Pattern 2: "Manage School" as Navigation, Not Connection

**What:** When `viewerRole === 'teacher'` and `profileOwnerId === currentUserId` (the viewer owns the school), render a secondary `Button` that calls `router.push('/settings')` instead of `sendRequest`.

**When to use:** The profile belongs to a school owned by the viewer. This is evaluated before the role-pair lookup.

**Example:**
```typescript
// Early return before role-pair CTA
if (isOwnSchool) {
  return (
    <Button variant="secondary" className="w-full" onClick={() => router.push('/settings')}>
      Manage School
    </Button>
  );
}
```

`useRouter` from `next/navigation` is already used in the codebase elsewhere. `ConnectButton` is already a `'use client'` component so `useRouter` is available.

**Confidence:** HIGH — matches UI-SPEC "Manage School navigation" section exactly.

### Pattern 3: Viewer Profile Fetch in Server Component

**What:** `MemberProfilePage` fetches the viewer's own profile row to get `member_type` (their role). This is a second Supabase query in the same server component, after the existing profile query.

**When to use:** Any time a server component needs authenticated user data beyond just the auth ID.

**Example:**
```typescript
// After existing: const { data: { user } } = await supabase.auth.getUser()
const { data: viewerProfile } = currentUserId
  ? await supabase
      .from('profiles')
      .select('member_type')
      .eq('id', currentUserId)
      .single()
  : { data: null };

const viewerRole = viewerProfile?.member_type ?? null;
```

**Confidence:** HIGH — `profiles.member_type` column confirmed in migration `20260325_add_onboarding.sql`.

### Pattern 4: School Ownership Check

**What:** When the profile being viewed has `role === 'school'`, check the `schools` table for a row with `owner_id === currentUserId`. This determines whether to show "Manage School" vs "Apply as Faculty".

**When to use:** Conditional — only run when `profile.member_type === 'school'`.

**Example:**
```typescript
let isOwnSchool = false;
if (profile.member_type === 'school' && currentUserId) {
  const { data: ownedSchool } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', currentUserId)
    .eq('id', profile.id)   // the profile ID matches the school's profile ID
    .maybeSingle();
  isOwnSchool = !!ownedSchool;
}
```

**Important caveat:** The `schools` table has `owner_id` referencing `auth.users(id)`, not `profiles(id)`. The relationship between a school's profile row and the `schools` table row needs verification. The profile page uses `profile.id` which is a `profiles.id` UUID. The `schools` table may have its own `id` separate from the profile `id`. Verify schema before writing the ownership check.

**Confidence:** MEDIUM — `schools` table structure confirmed but the exact link between `schools.id` and `profiles.id` for school profiles is not yet clear from the migrations read. The plan should include a task to verify/establish this link.

### Pattern 5: Pending-Sent Label Derives from Connection Type

**What:** The UI-SPEC copywriting contract differentiates the pending-sent label by what type was sent: "Request Sent" (peer), "Mentorship Requested" (mentorship), "Application Sent" (faculty). `ConnRecord` in `ConnectionsContext` does not currently store `type`. Either store it on the record or derive it from the connection's status in Supabase.

**When to use:** Whenever `status === 'pending_sent'`.

**Options:**
1. Add `type` field to `ConnRecord` and populate it in the `sendRequest` optimistic update and the initial load from Supabase.
2. Re-fetch the connection row on load to get its type.

Option 1 is simpler. The Supabase load already selects `*` from `connections` so `type` is available — it just is not mapped into `ConnRecord` today.

**Confidence:** HIGH — identified gap between current `ConnRecord` shape and UI-SPEC copywriting contract.

### Anti-Patterns to Avoid

- **Passing `member_type` as a string without a type alias:** Use `type MemberRole = 'student' | 'teacher' | 'wellness_practitioner' | 'school'` so TypeScript catches missing role-pair cases.
- **Running the school ownership query unconditionally:** Only query `schools` when `profile.member_type === 'school'` — avoids unnecessary DB round-trips on every profile page load.
- **Relying on `profile.role` vs `profile.member_type` inconsistently:** The page currently uses `const role = profile.member_type ?? profile.role ?? 'student'`. Viewer role should be sourced from `member_type` (the onboarding-set column), not the enum `role` column, for consistency. Confirm which column is canonical for the connect button logic — they may differ (e.g., `role` includes `admin`/`moderator` not in `member_type`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Button variants | Custom `<button>` with hardcoded hex colors | `Button` component (`app/components/ui/Button.tsx`) — UI-SPEC migration requirement |
| Loading spinner | Hand-rolled `<svg className="animate-spin">` | `Button loading={true}` prop — spinner built into the component |
| Navigation on click | `window.location.href = '/settings'` | `useRouter().push('/settings')` from `next/navigation` |

---

## Key Implementation Gap: `ConnRecord` Type Field

The `ConnRecord` interface in `ConnectionsContext` does not include `type`. The UI-SPEC copywriting contract requires type-aware pending-sent labels. This gap must be addressed in Phase 5:

1. Add `type: 'peer' | 'mentorship' | 'faculty'` to `ConnRecord`.
2. Populate it in the initial Supabase load (the `select('*')` query already returns `type`).
3. Populate it in the `sendRequest` optimistic update (the `type` param is already passed to `insert`).
4. Update `ConnectButton` to read `conn.type` when rendering the pending-sent state.

This is a `ConnectionsContext` change — small, but required.

---

## Common Pitfalls

### Pitfall 1: Viewer Role Is Null for Unauthenticated Visitors

**What goes wrong:** An unauthenticated visitor has no `currentUserId`, so `viewerProfile` is null, and `viewerRole` is null. The role-pair lookup returns undefined, falling back to the default peer CTA. If `ConnectButton` is also rendered for unauthenticated visitors, clicking it will fail silently (sendRequest guards on `supabaseUserId`).

**Why it happens:** The profile page is public. Not all visitors are logged in.

**How to avoid:** In `ConnectButton`, if `viewerRole` is null (unauthenticated), render the default "Connect" button but let the click behavior fall through to the existing guard in `sendRequest`. No new error state required per UI-SPEC (silent fail). OR hide the button entirely for unauthenticated users — clarify with product if needed.

**Warning signs:** TypeScript will force handling `null` for `viewerRole` if typed correctly.

### Pitfall 2: `profile.id` Is a Supabase Auth UUID, Not Always a School Row ID

**What goes wrong:** The `schools` table stores `owner_id` (who created the school), but the school's `profiles` row `id` may differ from `schools.id`. The ownership check `schools.eq('id', profile.id)` may return nothing if the schema uses a separate primary key for schools vs. profile UUIDs.

**Why it happens:** Schools have their own table with their own `id`. The profile page's `profile.id` is the user/school profile UUID in the `profiles` table. These may or may not be the same as `schools.id` depending on schema design.

**How to avoid:** Check `schools` migration (`20260335_add_schools.sql`) to understand the link between `profiles.id` and `schools.id` before writing the ownership query. The correct query is likely `eq('owner_id', currentUserId)` only (does the current user own *any* school, and is this profile page for their school). You may need to cross-reference `schools.profile_id` or similar.

**Warning signs:** `isOwnSchool` always false even when viewing own school.

### Pitfall 3: `member_type` vs `role` Column Inconsistency

**What goes wrong:** `profiles.role` is a `user_role` enum including `admin` and `moderator`. `profiles.member_type` is a text column constrained to `student | teacher | wellness_practitioner` (no `school`, no admin values). A school profile's `member_type` may be null or set differently.

**Why it happens:** The `member_type` column was added in onboarding migration for member classification. `role` was the original column and may be the authoritative field for school profiles.

**How to avoid:** In `MemberProfilePage`, `role` is already derived as `profile.member_type ?? profile.role ?? 'student'`. Use this same derived value as `profileRole` passed to `ConnectButton`. For `viewerRole`, use the same fallback chain for the viewer's profile.

**Warning signs:** TypeScript type mismatch between `user_role` enum values and `member_type` string literals.

### Pitfall 4: `ConnectButton` Hides for Own Profile but `isOwnProfile` Not Currently Passed

**What goes wrong:** The UI-SPEC says render `null` when viewer is viewing their own profile. Currently `ConnectButton` has no such guard — it renders for all non-null statuses. The `isOwnProfile` signal exists on `ConnectionsSection` (already passed from page) but not on `ConnectButton`.

**Why it happens:** Phase 4 added `isOwnProfile` to `ConnectionsSection`, not to `ConnectButton`.

**How to avoid:** Pass `isOwnProfile` (derived as `profile.id === currentUserId`) to `ConnectButton` as well, or derive it inside `ConnectButton` by comparing `memberId` to the auth user. Since `ConnectButton` is a client component, deriving it from context is safer — `ConnectionsContext` has `supabaseUserId` in state but does not expose it. Simplest: pass `isOwnProfile` as a prop from the server component (pattern already established).

---

## Code Examples

### Final ConnectButton prop interface (target state)
```typescript
// Source: UI-SPEC + current ConnectButton.tsx + gap analysis
interface ConnectButtonProps {
  memberId: string;           // UUID from profiles.id
  memberName: string;
  memberPhoto: string;
  firstName: string;
  viewerRole: string | null;  // viewer's member_type (null = unauthenticated)
  profileRole: string;        // profile owner's member_type / role
  isOwnProfile: boolean;      // hide button entirely when true
  isOwnSchool?: boolean;      // show "Manage School" when true
}
```

### Role-pair derived label + type
```typescript
// Source: UI-SPEC Button State Matrix
const ROLE_PAIR_MAP: Record<string, { label: string; type: 'peer' | 'mentorship' | 'faculty' }> = {
  'student:teacher':              { label: 'Request Mentorship', type: 'mentorship' },
  'teacher:school':               { label: 'Apply as Faculty',   type: 'faculty'    },
  'wellness_practitioner:school': { label: 'Apply as Faculty',   type: 'faculty'    },
};
```

### Pending-sent label by type
```typescript
// Source: UI-SPEC Copywriting Contract
const PENDING_SENT_LABEL: Record<'peer' | 'mentorship' | 'faculty', string> = {
  peer:       'Request Sent',
  mentorship: 'Mentorship Requested',
  faculty:    'Application Sent',
};
```

---

## Environment Availability

Step 2.6: SKIPPED — this phase makes no external tool calls. All changes are TypeScript/React/Supabase client queries within the existing project stack. No new CLI tools, runtimes, or services required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run __tests__/connect-button.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PROF-01 | student + teacher role pair renders "Request Mentorship" | unit | `npx vitest run __tests__/connect-button.test.tsx` | Partial — existing file covers structural checks only |
| PROF-02 | teacher/wellness_practitioner + school role pair renders "Apply as Faculty" | unit | `npx vitest run __tests__/connect-button.test.tsx` | Partial |
| PROF-03 | isOwnSchool=true renders "Manage School" secondary button | unit | `npx vitest run __tests__/connect-button.test.tsx` | Partial |
| PROF-04 | teacher + teacher renders "Connect with {firstName}" | unit | `npx vitest run __tests__/connect-button.test.tsx` | Partial |

### Sampling Rate

- **Per task commit:** `npx vitest run __tests__/connect-button.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/connect-button.test.tsx` — existing file only checks source-level strings (UUID doc comment). Needs new describe block: "role-aware CTA rendering" covering all four PROF requirements with `@testing-library/react` renders and mocked `ConnectionsContext`. This must be written before or during implementation.

---

## Sources

### Primary (HIGH confidence)

- Direct source read: `app/components/ConnectButton.tsx` — current props, render branches, inline button usage
- Direct source read: `app/context/ConnectionsContext.tsx` — `sendRequest` signature, `ConnRecord` shape, `supabaseUserId` internal state
- Direct source read: `app/members/[id]/page.tsx` — server component data fetching, current prop pass to ConnectButton
- Direct source read: `app/components/ui/Button.tsx` — variant/size API, `loading` prop
- Direct source read: `.planning/workstreams/connections-inbox/phases/05-profile-page-buttons/05-UI-SPEC.md` — authoritative Button State Matrix and Copywriting Contract
- Direct source read: `supabase/migrations/20260339_add_connections.sql` — connections table schema
- Direct source read: `supabase/migrations/20260319_add_roles_and_subscription.sql` — `user_role` enum, `role` column
- Direct source read: `supabase/migrations/20260325_add_onboarding.sql` — `member_type` column constraint
- Direct source read: `supabase/migrations/20260335_add_schools.sql` — `schools` table, `owner_id` column

### Secondary (MEDIUM confidence)

- `__tests__/connect-button.test.tsx` — existing test coverage pattern (source-read checks)
- `vitest.config.ts` — test environment and alias config confirmed

---

## Open Questions

1. **What is the relationship between `schools.id` and `profiles.id` for school accounts?**
   - What we know: `schools` table has `owner_id uuid REFERENCES auth.users(id)`. Profile page queries `profiles` table by `id`.
   - What's unclear: How to correctly query whether the *profile being viewed* is the *school owned by the current viewer*. Is `schools.owner_id === currentUserId` sufficient? Or does a school profile have a `profiles` row separate from the school's creator?
   - Recommendation: Plan task must include reading `20260335_add_schools.sql` in full and verifying the link. If `schools` has a `profile_id` column pointing back to `profiles`, use that. If not, `eq('owner_id', currentUserId)` alone (is viewer the owner of any school?) combined with `profile.member_type === 'school'` may be sufficient.

2. **Should `ConnectButton` render at all for unauthenticated visitors?**
   - What we know: `viewerRole` will be null when not logged in. Clicking would silently fail.
   - What's unclear: Whether to hide the button or show it with a redirect-to-login on click.
   - Recommendation: Default to showing the button (current behavior) with a silent fail — matches UI-SPEC error state ("Silent fail: if sendRequest errors, button returns to un-sent state; no toast in this phase"). Unauthenticated user just sees nothing happen — acceptable for v1.1.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, all existing code confirmed by direct reads
- Architecture (role-pair logic, prop extension): HIGH — sourced from UI-SPEC and current code
- School ownership check: MEDIUM — `schools` table structure read but link to profile page not fully traced
- `ConnRecord.type` gap: HIGH — gap confirmed by comparing `ConnectionsContext` interface to UI-SPEC copywriting contract
- Pitfalls: HIGH — derived from direct code inspection

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable codebase, no external API dependencies)
