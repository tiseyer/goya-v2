# Deferred Items — Phase 12 Shop Admin Pages

## Pre-existing Build Failures (Out of Scope)

**Discovered during:** Plan 12-04 Task 2 verification

**Files with errors (NOT from 12-04):**
- `app/onboarding/components/CompletionStep.tsx` — Property 'full_name' does not exist on type 'OnboardingAnswers'
- `app/onboarding/components/Step1MemberType.tsx` — Module has no exported member 'MemberType'
- `app/onboarding/components/Step2Profile.tsx` — Multiple type errors
- `app/onboarding/components/Step3Documents.tsx` — Multiple type errors
- `app/onboarding/components/WelcomeStep.tsx` — Type mismatch
- `__tests__/connect-button.test.tsx` — Type argument count mismatch
- `app/page.test.tsx` — Missing test runner types

These files were introduced by another parallel agent (visible as untracked files in gitStatus) and predate plan 12-04. They are not related to order detail functionality.

**Action:** Deferred to post-parallel-execution merge phase. The orchestrator validates hooks once after all agents complete.
