# Deferred Items — Phase 04 Database Foundation

## app/page.test.tsx — Pre-existing test failure

**Discovered during:** Plan 04-02, Task 2
**Scope:** Out of scope (pre-existing, unrelated to connections system)

**Issue:** `app/page.test.tsx` fails because the vi.mock for `@/lib/supabaseServer` is not working correctly — the mock is set up but the page renders the public landing page instead of the auth-gated view. This suggests the mock configuration was broken before this plan's changes.

**Root cause:** The page module likely isn't respecting the vi.mock hoisting, or the page has been significantly refactored since the test was written, making the test assertions stale.

**Fix needed:** Update `app/page.test.tsx` to match the current public landing page behavior, or remove the test if it's no longer testing the correct page structure.

**Note:** `vitest.config.ts` was updated in Plan 04-02 to add the `@` path alias (rule 1 fix for a blocking import error). This unmasked the pre-existing test failure.
