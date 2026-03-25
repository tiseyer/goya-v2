# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:**
- Vitest 2.x
- Config: `vitest.config.ts`

**Assertion Library:**
- `@testing-library/jest-dom` (matchers like `toBeInTheDocument`, `toHaveAttribute`)
- Vitest's built-in `expect`

**Rendering:**
- `@testing-library/react` 15.x

**Environment:**
- jsdom (configured in `vitest.config.ts` as `environment: 'jsdom'`)
- Globals enabled (`globals: true`) — `describe`, `it`, `expect`, `vi`, `beforeEach` available without import

**Setup File:**
- `test/setup.ts` — runs `import '@testing-library/jest-dom'` to register custom matchers

**Run Commands:**
```bash
# No test script in package.json — run via npx:
npx vitest              # Run all tests (watch mode)
npx vitest run          # Run all tests once (CI mode)
npx vitest run --coverage  # With coverage (if @vitest/coverage-v8 installed)
```

## Test File Organization

**Location:**
- Mixed: one test co-located with the source it tests (`app/page.test.tsx` alongside `app/page.tsx`)
- Setup file in dedicated `test/` directory (`test/setup.ts`)
- No separate `__tests__/` folder convention — tests sit next to source files

**Naming:**
- `[filename].test.tsx` for component tests
- `[filename].test.ts` for pure logic tests

**Current coverage:**
- Only `app/page.test.tsx` exists — test coverage is minimal; the framework is set up but largely unused

## Test Structure

**Suite organization:**
```typescript
describe('Home page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders dashboard link and logout form when user exists', async () => {
    // ... arrange, act, assert
  })

  it('renders login button and no dashboard link when no user', async () => {
    // ... arrange, act, assert
  })
})
```

**Patterns:**
- `describe` for grouping related tests around a component or feature
- `it` for individual test cases (not `test`)
- `beforeEach(() => { vi.resetAllMocks() })` — standard teardown to isolate tests

## Mocking

**Framework:**
- Vitest's built-in `vi` API

**Module mocking:**
```typescript
// Mock an entire module
vi.mock('@/lib/supabaseServer', () => ({
  createSupabaseServerClient: vi.fn(),
}))

// Mock Next.js router/Link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
```

**Typed mock references:**
```typescript
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { vi, type Mock } from 'vitest'

const mockCreateSupabaseServerClient = createSupabaseServerClient as Mock
```

**Configuring mock return values:**
```typescript
mockCreateSupabaseServerClient.mockResolvedValue({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { email: 'test@example.com' } },
    }),
  },
})
```

**What is mocked:**
- External Supabase client (`@/lib/supabaseServer`)
- Next.js primitives that don't work in jsdom (`next/link`, `next/navigation`, `next/headers`)
- Any async dependency that would hit the network

**What is NOT mocked:**
- React itself
- Pure utility functions — these are tested directly without mocking

## Testing Async Server Components

Next.js App Router Server Components are async functions. The pattern used:

```typescript
// Server component is an async function — await it, then render the result
const ui = await Home()
render(ui)

expect(screen.getByText('Logged in as')).toBeInTheDocument()
```

This pattern is required because `Home()` returns a Promise when it's an async Server Component.

## Assertions

**DOM state:**
```typescript
expect(screen.getByText('Go to Dashboard')).toHaveAttribute('href', '/dashboard')
expect(screen.getByText('Login')).toBeInTheDocument()
expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument()
```

**Form structure:**
```typescript
const logoutButton = screen.getByText('Logout')
const logoutForm = logoutButton.closest('form')
expect(logoutForm).toHaveAttribute('action', '/logout')
expect(logoutForm).toHaveAttribute('method', 'post')
```

- `getByText` — throws if not found (use for elements that must be present)
- `queryByText` — returns null if not found (use with `.not.toBeInTheDocument()`)

## Fixtures and Factories

**Test data:**
- Inline mock objects inside each test or `beforeEach` — no shared fixture files detected
- Mock data follows the shape of Supabase return values: `{ data: { user: { email: '...' } } }`

**No factory helpers** — test data constructed ad hoc per test.

## Coverage

**Requirements:** None enforced (no coverage threshold configured)

**Coverage tooling:** Not configured in `vitest.config.ts` — would require `@vitest/coverage-v8` to be installed

## Test Types

**Unit Tests:**
- Component rendering with mocked dependencies
- Verify correct DOM output for different prop/data states

**Integration Tests:** Not present

**E2E Tests:** Not present (no Playwright, Cypress, or similar)

## Gaps and Notes

- Only `app/page.test.tsx` exists — the vast majority of the codebase has no tests
- Server Actions (`actions.ts` files) are not tested
- API route handlers (`app/api/`) are not tested
- Lib utilities (`lib/`) are not tested
- The jsdom + vitest setup is correct and ready to use for additional tests
- When adding tests for components that use context (`useOnboarding`, `useCart`, etc.), wrap renders in the relevant Provider

---

*Testing analysis: 2026-03-23*
