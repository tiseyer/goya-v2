---
title: Contributing
audience: ["developer"]
section: developer
order: 10
last_updated: "2026-03-31"
---

# Contributing

This guide covers the conventions, workflows, and patterns you need to contribute to GOYA v2.

## Table of Contents

- [Code Style Conventions](#code-style-conventions)
- [CLAUDE.md Rules](#claudemd-rules)
- [Adding a New Page](#adding-a-new-page)
- [Adding a New Admin Page](#adding-a-new-admin-page)
- [Adding a Database Migration](#adding-a-database-migration)
- [Testing](#testing)
- [Activity and Logging](#activity-and-logging)
- [PR Process](#pr-process)

---

## Code Style Conventions

**TypeScript**
- Strict mode is enabled. No `any` without a comment explaining why.
- Use the generated `types/supabase.ts` for database types. Regenerate with `npx supabase gen types typescript --linked > types/supabase.ts` after schema changes.
- Prefer explicit return types on exported functions.

**React / Next.js**
- Server Components by default — only add `'use client'` when you need interactivity or browser APIs.
- No `useEffect` for data fetching. Fetch in Server Components using `await supabase.from(...)`.
- Server Actions (`'use server'`) for all mutations (create, update, delete).
- Co-locate `actions.ts` files next to the page that uses them.

**Imports**
- Use the `@/` path alias for all imports from the project root.
- Import order: external packages, then `@/lib/...`, then `@/app/...`, then relative.

**Styling**
- Tailwind CSS only. No inline `style` props except for dynamic values that cannot be expressed as classes.
- Never hardcode `max-width`, `mx-auto`, or horizontal padding on page-level elements — use `PageContainer`.

**Naming**
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions and variables: `camelCase`
- Database columns: `snake_case` (Supabase convention)
- Environment variables: `SCREAMING_SNAKE_CASE`

---

## CLAUDE.md Rules

`CLAUDE.md` at the project root defines hard constraints that apply to all contributions:

1. **`PageContainer` is mandatory** for all page content sections. Width must be `max-w-7xl` via `PageContainer`. No exceptions.
2. **Log errors to `LOG.md`** under "Open Issues" when you encounter unexpected behaviour.
3. **Activity files**: After completing a quick task, create `activity/quick-tasks/quick-task_TaskName_DD-MM-YYYY.md`.
4. **Milestone activity files**: On milestone start or completion, create `activity/vX-X-X_MilestoneName_DD-MM-YYYY.md` and update `activity/README.md`.
5. **Always run `npx supabase db push`** after creating a migration file.

These are not suggestions. Reviewers will reject PRs that violate them.

---

## Adding a New Page

1. Create `app/your-section/page.tsx`. It is a Server Component by default.

```tsx
// app/schools/page.tsx
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import PageContainer from '@/app/components/ui/PageContainer'

export default async function SchoolsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: schools } = await supabase.from('schools').select('*')

  return (
    <PageContainer className="py-12">
      <h1 className="text-3xl font-bold">Schools</h1>
      {/* render schools */}
    </PageContainer>
  )
}
```

2. If the page needs to be protected, add the path to `PROTECTED_PATHS` in `middleware.ts`.
3. If the page has mutations, add `app/your-section/actions.ts` with `'use server'` functions.
4. If the page has interactive UI, create Client Components in `app/your-section/components/`.

---

## Adding a New Admin Page

1. Create `app/admin/your-section/page.tsx`. The `app/admin/layout.tsx` already handles role verification.
2. Add a nav link to `app/admin/components/AdminShell.tsx` in the appropriate nav group.
3. Follow the same Server Component + `PageContainer` pattern.

```tsx
// app/admin/your-section/page.tsx
import PageContainer from '@/app/components/ui/PageContainer'

export default async function AdminYourSectionPage() {
  return (
    <PageContainer className="py-8">
      <h1 className="text-2xl font-bold">Your Section</h1>
    </PageContainer>
  )
}
```

4. If the page needs API routes (e.g. for complex async operations), add `app/api/admin/your-section/route.ts`. For simple mutations, use Server Actions.

---

## Adding a Database Migration

1. Create a new file in `supabase/migrations/` with the naming pattern `YYYYMMDD_description.sql`. Use today's date and increment if multiple migrations exist for the same date (e.g. `20260401_add_newsletter_table.sql`).

2. Write the SQL. Always include:
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` for new tables
   - RLS policies for each relevant role
   - An `updated_at` trigger if the table has an `updated_at` column

3. Apply to your local/dev database:
   ```bash
   npx supabase db push
   ```

4. Update `types/supabase.ts`:
   ```bash
   npx supabase gen types typescript --linked > types/supabase.ts
   ```

5. Commit both the migration file and the updated types.

**Never alter the database directly** (Supabase Studio SQL editor or otherwise). All schema changes must be in migration files so they can be reproduced on any environment.

---

## Testing

GOYA v2 uses Vitest with Testing Library.

**Run tests:**
```bash
npx vitest
npx vitest run          # single pass (CI mode)
npx vitest --coverage   # with coverage report
```

**Test file locations:**
- `__tests__/` — unit tests for `lib/` utilities
- `lib/stripe/handlers/*.test.ts` — co-located handler tests
- `app/*.test.tsx` — co-located component tests

**What to test:**
- All `lib/` utility functions, especially email, credits, and Stripe handlers
- Server Actions that contain non-trivial business logic
- API route handlers (use `fetch` mocking)

**What not to test:**
- Simple Server Components that only render data — rely on type safety and integration tests
- Next.js routing behaviour — that's framework responsibility

**Mocking Supabase:**
Use `vi.mock('@/lib/supabaseServer')` and return a typed mock client. See existing tests in `lib/stripe/handlers/` for patterns.

---

## Activity and Logging

### Error Log

When you encounter an error or unexpected behaviour during development, append to `LOG.md`:

```
[2026-03-31] [ERROR] [admin/users] — Bulk delete fails when user has orphaned stripe_orders rows | OPEN
```

When resolved, move to the "Resolved" section and mark `RESOLVED`.

### Quick Task Activity

After completing any `/gsd:quick` task or standalone piece of work, create:

```
activity/quick-tasks/quick-task_short-kebab-description_DD-MM-YYYY.md
```

Contents: task description, status, solution. One file per task.

### Milestone Activity

On milestone start or completion, create:

```
activity/vX-X-X_MilestoneName_DD-MM-YYYY.md
```

And update the table in `activity/README.md`.

---

## PR Process

1. Branch from `develop` (or `main` for hotfixes).
2. Follow the naming convention: `feat/short-description`, `fix/short-description`, `chore/short-description`.
3. Ensure `npm run lint` passes with no errors.
4. Ensure `npx vitest run` passes.
5. If the PR adds a new migration, confirm `npx supabase db push` succeeds on a clean environment.
6. PRs that violate `CLAUDE.md` rules (missing `PageContainer`, hardcoded widths) will be rejected at review.
7. Squash commits on merge to `main`.

---

## See Also

- [architecture.md](./architecture.md) — Folder structure and key patterns
- [overview.md](./overview.md) — Initial setup instructions
- [database-schema.md](./database-schema.md) — Table reference for writing migrations
