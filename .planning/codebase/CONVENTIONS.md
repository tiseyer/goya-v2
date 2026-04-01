# Coding Conventions

**Analysis Date:** 2026-03-23

## Code Style

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- Target: ES2017, module resolution: bundler
- `isolatedModules: true` — no const enums, no namespace imports that rely on type erasure
- `noEmit: true` — TypeScript is type-check-only; Next.js handles compilation

**Formatting:**
- No Prettier config detected — formatting is not enforced by tooling
- Observed style: single quotes for strings, semicolons at end of statements, 2-space indentation, trailing commas in multi-line arrays/objects

**Linting:**
- ESLint 9 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config: `eslint.config.mjs` (flat config format)
- Known intentional suppressions: `// eslint-disable-next-line @next/next/no-img-element` when `<img>` is preferred over `<Image>`
- No custom rule overrides beyond what `next` config provides

## Component Patterns

**Server vs Client split:**
- Default to Server Components; add `'use client'` only when needed (interactivity, hooks, context)
- `'use client'` appears as the very first line of the file, before imports
- `'use server'` appears as the very first line of server action files

**Props typing:**
```tsx
// Inline destructured props with type on the function signature
export default function AdminUsersTable({ users, adminRole }: { users: UserRow[]; adminRole?: string }) {
```

**Component file structure:**
- One default export per file, named after the component (`export default function ComponentName`)
- Local helper types at top of file with `export type` if needed externally
- Local helper functions (formatDate, getInitials) defined above the component, not inside it
- Constant lookup maps (badge colors, etc.) as module-level `const` above the component

**Context pattern:**
- Context created with `createContext<ValueType | null>(null)`
- Custom hook (`useX`) exported from same file as Provider; throws descriptively if used outside provider:
  ```ts
  export function useOnboarding() {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
    return ctx;
  }
  ```
- Provider wraps logic in a dedicated custom hook, keeping Provider component thin
- Example: `app/onboarding/components/OnboardingProvider.tsx`

**Shared providers:**
- `app/components/ClientProviders.tsx` stacks `ImpersonationProvider`, `CartProvider`, `ConnectionsProvider`
- Providers accept initial server-fetched state as props to avoid client-side fetches on mount

**Conditional rendering:**
- Short-circuit `{condition && <Component />}` and ternaries inline in JSX
- No separate render function pattern — everything inline

**SVG icons:**
- Inline SVG throughout — no icon library
- Standard icon style: `fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"`

## API Route Patterns

**Route handlers (`app/api/**/route.ts`):**
- Export named HTTP method functions: `export async function GET(req: Request)`
- Return `NextResponse.json(...)` for JSON, `NextResponse.redirect(...)` for redirects
- Cron routes check Authorization header:
  ```ts
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  ```
- Admin Supabase clients created inline in route files (not imported from shared factory)

## Server Action Patterns

**Server Actions (`actions.ts` files):**
- `'use server'` directive at top of file
- Accept `FormData` or typed plain objects as parameters
- Use `redirect()` from `next/navigation` for post-action navigation
- Error handling: redirect with error query param OR return `{ error: string | null }`
- Use `createSupabaseServerActionClient()` — not `createSupabaseServerClient()` — so cookies can be set
- Impersonation-aware actions use `getEffectiveUserId()` and `getEffectiveClient()` from `@/lib/supabase/getEffectiveUserId`

## Database Patterns

**Supabase client selection:**
- `createSupabaseServerClient()` from `@/lib/supabaseServer` — Server Components, read-only
- `createSupabaseServerActionClient()` from `@/lib/supabaseServer` — Server Actions (can set session cookies)
- `createClient(url, serviceKey)` from `@supabase/supabase-js` directly — API routes, email lib (bypasses RLS)
- `lib/supabase/service.ts` — service-role client for shared admin operations

**Query style:**
```ts
// Fluent method chaining
const { data, error } = await supabase
  .from('profiles')
  .select('onboarding_completed, role')
  .eq('id', user.id)
  .single()

// maybeSingle() when record may not exist
const { data: state } = await supabase
  .from('onboarding_state')
  .select('onboarding_complete')
  .eq('user_id', user.id)
  .maybeSingle()

// Count queries
const { count } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })
  .eq('verification_status', 'pending')

// Fire-and-forget writes (logging)
void supabaseAdmin.from('email_log').insert({ ... })
```

**Migrations:**
- Stored in `supabase/` directory
- Applied with `npx supabase db push`

## Error Handling

**Server Actions:**
- Return `{ error: string | null }` — callers check `result.error`
- Navigation errors via redirect query string: `redirect('/login?error=${encodeURIComponent(error.message)}')`

**API Routes:**
- Return `NextResponse.json({ error: 'message' }, { status: 4xx })` for client errors
- `try/catch` wraps risky operations; catch returns `{ success: false, error }`

**Email (`lib/email/send.ts`):**
- Returns `{ success: boolean, error?, reason? }` — never throws
- Inactive template: silent `{ success: false, reason: 'template_inactive' }`
- All sends logged to `email_log` table (fire-and-forget via `void`)

**Catch blocks:**
- Empty `catch {}` used in middleware and layout for non-critical failures (analytics fetch, maintenance check)
- `catch (err)` when the error value is logged or returned

## Import Conventions

**Path alias:**
- `@/*` maps to project root (`./`), configured in `tsconfig.json`
- All cross-directory imports use `@/` — e.g., `import { createSupabaseServerClient } from '@/lib/supabaseServer'`
- Relative imports (`./`, `../`) used only within the same feature directory

**Import ordering (observed):**
1. React (when needed explicitly — often omitted in RSC files)
2. Next.js imports (`next/link`, `next/navigation`, `next/headers`, etc.)
3. Third-party packages (`@supabase/ssr`, `date-fns`, etc.)
4. Internal `@/lib/...` utilities
5. Internal `@/app/...` components and context
6. Local relative imports (`./`, `../`)

**No barrel files** — each module imported directly by path. No `index.ts` re-export pattern.

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js App Router convention)
- Layouts: `layout.tsx`
- Route handlers: `route.ts`
- Server actions: `actions.ts`
- Client components: PascalCase matching export name — `AdminUsersTable.tsx`, `OnboardingProvider.tsx`
- Lib utilities: kebab-case or camelCase — `supabaseServer.ts`, `members-data.ts`, `getEffectiveUserId.ts`
- Onboarding step components: `Step_MemberType.tsx`, `Step_T_Bio.tsx` (role prefix: `T_` = Teacher, `S_` = Student, `W_` = Wellness)

**Functions and variables:**
- camelCase for functions and variables: `getInitials`, `formatDate`, `createSupabaseServerClient`
- PascalCase for React components and TypeScript types/interfaces: `AdminUsersTable`, `UserRole`, `Profile`
- SCREAMING_SNAKE_CASE for module-level constants: `ROLE_BADGE`, `PUBLIC_PATHS`, `FROM_ADDRESS`

**Types:**
- `type` keyword for union/primitive aliases: `UserRole`, `VerificationStatus`, `EventCategory`
- `interface` for object shapes: `Profile`, `Event`, `Course`, `Message`
- Domain types centralized in `lib/types.ts`
- Feature-local types defined at top of the file where used
- DB row types for components named with `Row` suffix: `UserRow`

## State Management

**Server state (primary pattern):**
- Data fetched in Server Components directly from Supabase — no client-side data fetching layer
- Next.js `fetch()` with `next: { revalidate: N }` for cached server-side fetches

**Client state:**
- React Context for cross-component client state
- Context providers in `app/context/` — `CartContext`, `ConnectionsContext`, `ImpersonationContext`
- Onboarding flow state in `app/onboarding/hooks/useOnboardingProgress.ts`
- No global state library (no Zustand, Redux, Jotai)

**Form state:**
- Server Actions for form submissions (`action={serverAction}`)
- Local `useState` for controlled inputs within Client Components

## Comments

**Section dividers:**
```ts
// ─── Section Name ─────────────────────────────────────────────────────────────
```
Used in `middleware.ts`, `app/layout.tsx`, and longer utility files.

**Inline comments:**
- Non-obvious logic commented inline: `// fire-and-forget`, `// In Next.js 16+, cookies() is async`
- `@deprecated` JSDoc tag used on `sendEmail()` in `lib/email/send.ts`

**ESLint suppressions:**
- Single-line only: `// eslint-disable-next-line @next/next/no-img-element`
- No block-level disables

---

*Convention analysis: 2026-03-23*
