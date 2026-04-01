---
phase: quick
plan: 260330-naz
status: complete
completed: 2026-03-30
tasks_completed: 2
tasks_total: 2
key-files:
  modified:
    - app/teaching-hours/page.tsx
    - app/credits/page.tsx
    - app/upgrade/page.tsx
    - app/members/[id]/page.tsx
    - app/api/avatar/route.ts
    - app/api/flows/active/route.ts
    - app/dashboard/page.tsx
    - app/profile/settings/page.tsx
    - app/settings/page.tsx
    - app/messages/page.tsx
  created:
    - app/api/me/route.ts
---

# Quick Task 260330-naz: Fix Impersonation Data Queries Summary

Updated ALL pages and API routes to use impersonation-aware data fetching so admin "Switch To" shows the target user's data instead of the admin's own data.

## Tasks Completed

### Task 1: Fix Server Components + API Routes

Updated server components to use `getEffectiveUserId()` + `getEffectiveClient()`:

| File | Change |
|------|--------|
| `app/teaching-hours/page.tsx` | Replaced `user.id` + `supabase` with `userId` + `client` for profile, credits, requirements |
| `app/credits/page.tsx` | Same pattern for credit status dashboard |
| `app/upgrade/page.tsx` | Uses effective userId/client for role-based redirect logic |
| `app/members/[id]/page.tsx` | Uses `getEffectiveClient` for viewer profile (bypasses RLS when impersonating) |
| `app/api/avatar/route.ts` | Avatar storage path + upload use effective userId/client |
| `app/api/flows/active/route.ts` | Flow engine query uses effective userId |

### Task 2: Fix Client Components via /api/me

Created `app/api/me/route.ts` — returns effective user's profile using server-side `getEffectiveUserId` (reads httpOnly cookie that client JS can't access).

Updated client components to use `useImpersonation()` context + `/api/me`:

| File | Change |
|------|--------|
| `app/dashboard/page.tsx` | Fetches via `/api/me` when impersonating, shows impersonated user's greeting + profile |
| `app/profile/settings/page.tsx` | Loads impersonated user's profile data for editing |
| `app/settings/page.tsx` | Loads impersonated user's settings |
| `app/messages/page.tsx` | Uses `targetUserId` from impersonation context for conversation loading |

## Architecture Notes

- Server Components: replaced `createSupabaseServerClient` + `user.id` with `getEffectiveUserId` + `getEffectiveClient` (service client when impersonating to bypass RLS)
- Client Components: can't read httpOnly cookie directly, so they use `useImpersonation()` context (injected from root layout) + fetch `/api/me` for profile data
- Admin pages (`/admin/*`): NOT modified — admin dashboard always shows admin's own data
- `schools/create`: auth-only check, no user-specific data — left unchanged

## Verification

- TypeScript compilation: 0 errors in modified files
- All 10 modified files + 1 new file verified
