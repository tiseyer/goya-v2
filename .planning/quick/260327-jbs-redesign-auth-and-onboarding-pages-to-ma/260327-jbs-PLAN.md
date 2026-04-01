---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/sign-in/page.tsx
  - app/register/page.tsx
  - app/forgot-password/page.tsx
  - app/layout.tsx
  - app/auth/callback/route.ts
  - middleware.ts
autonomous: false
requirements: [REDESIGN-AUTH, SOCIAL-LOGIN]
must_haves:
  truths:
    - "All auth pages (sign-in, register, forgot-password) use light background with GOYA brand tokens"
    - "No dark navy (#1a2744, #1e2e56, #243560) colors remain on any auth page"
    - "GOYA Logo Blue.png displayed above each form"
    - "Google and Apple social login buttons appear on sign-in and register pages"
    - "Social login triggers Supabase OAuth and redirects back via /auth/callback"
    - "Privacy Policy and Terms of Use links appear below each form"
    - "Auth pages are 100vh with centered form, no scrolling, no site header/footer"
    - "Onboarding flow still works exactly as before"
    - "Existing email/password login still works"
  artifacts:
    - path: "app/sign-in/page.tsx"
      provides: "Redesigned sign-in page with social login"
    - path: "app/register/page.tsx"
      provides: "Redesigned register page with social login"
    - path: "app/forgot-password/page.tsx"
      provides: "Redesigned forgot-password page"
    - path: "app/auth/callback/route.ts"
      provides: "OAuth callback handler for social login"
  key_links:
    - from: "app/sign-in/page.tsx"
      to: "supabase.auth.signInWithOAuth"
      via: "Google/Apple button click"
      pattern: "signInWithOAuth.*provider"
    - from: "app/auth/callback/route.ts"
      to: "supabase.auth.exchangeCodeForSession"
      via: "OAuth redirect"
      pattern: "exchangeCodeForSession"
---

<objective>
Redesign all auth pages (sign-in, register, forgot-password) to match GOYA's light brand identity and add Google/Apple social login.

Purpose: Auth pages currently use a dark navy theme that clashes with the rest of the site's light, professional branding. Social login reduces friction for new users.
Output: Redesigned auth pages with brand-consistent styling and working social OAuth flow.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/sign-in/page.tsx
@app/register/page.tsx
@app/forgot-password/page.tsx
@app/layout.tsx
@app/auth/actions.ts
@app/onboarding/layout.tsx
@middleware.ts
@app/globals.css (first 80 lines — brand tokens)

<interfaces>
<!-- Brand tokens from globals.css :root -->
--goya-primary:       #345c83
--goya-primary-light: #4e87a0
--goya-primary-dark:  #1e3a52
--goya-primary-50:    #eef4f9
--goya-primary-100:   #d6e7f1
--goya-surface:       #ffffff
--goya-surface-muted: #f8f9fa
--goya-surface-warm:  #f5f4f2
--goya-border:        #e2e8f0

<!-- Root layout hideNav logic (line 68) -->
const hideNav = pathname.startsWith("/onboarding") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/maintenance");
<!-- NOTE: /sign-in and /forgot-password are MISSING from hideNav — must be added -->

<!-- Supabase browser client -->
import { supabase } from '@/lib/supabase';
<!-- supabase.auth.signInWithPassword, supabase.auth.signUp, supabase.auth.signInWithOAuth -->

<!-- Middleware public paths (line 6-9) -->
const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/register', '/login', '/forgot-password', '/reset-password', '/events', '/academy']
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Redesign auth pages to GOYA brand theme and fix root layout</name>
  <files>app/sign-in/page.tsx, app/register/page.tsx, app/forgot-password/page.tsx, app/layout.tsx</files>
  <action>
**1. Fix root layout (app/layout.tsx line 68):**
Add `/sign-in` and `/forgot-password` to the `hideNav` condition so header/footer are hidden on these pages:
```
const hideNav = pathname.startsWith("/onboarding") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/sign-in") || pathname.startsWith("/forgot-password") || pathname.startsWith("/maintenance");
```
Also add these same paths to `hideFooter` so neither SlimFooter nor Footer renders on auth pages.

**2. Create shared auth page layout pattern for all 3 pages:**

Replace the dark navy theme on each page with this consistent structure:
- Outer wrapper: `h-screen overflow-hidden flex items-center justify-center` with `bg-[var(--goya-surface-muted)]` (or the equivalent `bg-[#f8f9fa]`)
- No `min-h-screen` — use `h-screen` + `overflow-hidden` for exact 100vh, no scroll
- Logo: `<img src="/images/GOYA Logo Blue.png" alt="GOYA" className="h-10 mx-auto mb-6" />` (replace White logo)
- Form card: `bg-white rounded-2xl p-8 border border-[var(--goya-border)] shadow-sm w-full max-w-md` (use brand shadow, not shadow-2xl)
- Below the card, add subtle links: `<p className="text-center text-xs text-slate-400 mt-6">` containing links to `/privacy` and `/terms` styled as `text-slate-400 hover:text-slate-600 hover:underline`

**3. Restyle sign-in page (app/sign-in/page.tsx):**

Replace the dark-themed constants:
```
const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#345c83]/20 focus:border-[#345c83] transition-colors';
const LABEL = 'block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide';
```

Update all text colors:
- Headings: `text-slate-900` (not text-white)
- Subtext: `text-slate-500` (not text-slate-400)
- Error text: `text-red-600` (not text-red-400)
- Links (forgot password, register): `text-[#345c83] hover:underline` (not text-[#2dd4bf])
- Submit button: `bg-[#345c83] text-white hover:bg-[#1e3a52]` (not bg-[#2dd4bf])
- "Don't have an account?" link: `text-[#345c83]` (not text-[#2dd4bf])

**4. Restyle register page (app/register/page.tsx):**

Apply same INPUT/LABEL constants as sign-in. Update all colors:
- Step indicator: Active/done nodes use `bg-[#345c83]` with `text-white` (not bg-[#2dd4bf] text-[#1a2744])
- Step indicator ring: `ring-[#345c83]/20`
- Step label active: `text-[#345c83]` (not text-[#2dd4bf])
- Connector bar fill: `bg-[#345c83]`
- Card background: `bg-white` with `border border-slate-200` (not bg-[#1e2e56] border-white/8)
- Role selection cards: selected state uses `border-[#345c83] bg-[#eef4f9]` (not border-[#2dd4bf] bg-[#2dd4bf]/8)
- Role icon selected color: `text-[#345c83]`
- Role checkmark: `bg-[#345c83] border-[#345c83]` with white check
- Unselected role cards: `border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50`
- Buttons: `bg-[#345c83] text-white hover:bg-[#1e3a52]`
- Back button: `border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300`
- Terms/Privacy links in checkbox: `text-[#345c83]`
- "Joining as" role badge: `text-[#345c83]`
- Success step checkmark: `bg-[#345c83]` with white icon, shadow `shadow-[#345c83]/30`
- Select dropdown option bg: remove `className="bg-[#1a2744]"` — use default
- For the success step (step 3), update the CTA links to use brand colors

**5. Restyle forgot-password page (app/forgot-password/page.tsx):**

Apply same INPUT/LABEL constants. Update:
- Same pattern as sign-in for colors
- "Email sent" icon: `bg-[#345c83]` with white icon (not bg-[#2dd4bf])
- "Send to different email" link: `text-[#345c83]`
- "Back to sign in" link: `text-[#345c83]`

**IMPORTANT:** Do NOT change any auth logic, form validation, state management, redirects, or Supabase calls. Only change visual styling and the logo image path.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx next build 2>&1 | tail -20</automated>
  </verify>
  <done>All three auth pages use light GOYA brand theme. No dark navy colors (#1a2744, #1e2e56, #243560, #2dd4bf) remain in any auth page. Blue GOYA logo displayed. Header/footer hidden on all auth paths. Each page is 100vh with overflow hidden.</done>
</task>

<task type="auto">
  <name>Task 2: Add Google and Apple social login with OAuth callback</name>
  <files>app/sign-in/page.tsx, app/register/page.tsx, app/auth/callback/route.ts, middleware.ts</files>
  <action>
**1. Create OAuth callback route (app/auth/callback/route.ts):**

Create a new route handler that processes the OAuth redirect from Supabase:
```typescript
import { NextResponse } from 'next/server'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createSupabaseServerActionClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check onboarding state
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: state } = await supabase
          .from('onboarding_state')
          .select('onboarding_complete')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!state) {
          await supabase.from('onboarding_state').insert({ user_id: user.id })
        }

        if (!state?.onboarding_complete) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // OAuth error — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`)
}
```

This mirrors the onboarding check logic from `app/auth/actions.ts` to ensure social login users also get routed through onboarding.

**2. Add `/auth/callback` to middleware public paths:**

In `middleware.ts`, add `/auth/callback` to `PUBLIC_PATHS` array so the OAuth redirect is not blocked by auth middleware. Also add it to `MAINTENANCE_BYPASS_PATHS`.

**3. Add social login buttons to sign-in page (app/sign-in/page.tsx):**

Add a `handleOAuthLogin` function:
```typescript
async function handleOAuthLogin(provider: 'google' | 'apple') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) setError(error.message)
}
```

Add social login buttons ABOVE the existing email/password form, inside the card:

```tsx
{/* Social login */}
<div className="space-y-3 mb-6">
  <button
    type="button"
    onClick={() => handleOAuthLogin('google')}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
  >
    {/* Google SVG icon (standard 20x20 colored G logo) */}
    Continue with Google
  </button>
  <button
    type="button"
    onClick={() => handleOAuthLogin('apple')}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
  >
    {/* Apple SVG icon (standard 20x20 Apple logo) */}
    Continue with Apple
  </button>
</div>

{/* Divider */}
<div className="flex items-center gap-4 mb-6">
  <div className="flex-1 h-px bg-slate-200" />
  <span className="text-xs text-slate-400 font-medium uppercase">or</span>
  <div className="flex-1 h-px bg-slate-200" />
</div>
```

For the Google icon, use the standard multi-color Google "G" SVG (4 colored arcs). For the Apple icon, use a simple black Apple logo SVG path. Both should be 20x20.

**4. Add social login buttons to register page (app/register/page.tsx):**

Add the same `handleOAuthLogin` function. Place social login buttons on Step 2 (the form step) ABOVE the name/email fields, with the same "or" divider below. Do NOT add social login to Step 1 (role selection) or Step 3 (success).

Note: For social signup, the role selection from Step 1 should still be captured. Add the selected `role` to the OAuth redirectTo as a query param: `redirectTo: \`${window.location.origin}/auth/callback?role=${role}\``. In the callback route, if `role` query param exists AND the user has no profile yet, store it in the user's metadata via `supabase.auth.updateUser({ data: { role } })`.

**5. Use standard, well-known SVG paths for social icons:**

Google "G" icon — use the official 4-color Google logo SVG with viewBox="0 0 24 24":
- Blue arc: #4285F4
- Red arc: #EA4335
- Yellow arc: #FBBC05
- Green arc: #34A853

Apple icon — use standard Apple logo SVG path, fill="currentColor" (renders in text color).

**IMPORTANT:** Do not install any new npm packages. Supabase OAuth is built into @supabase/supabase-js. Do not change any existing email/password auth logic.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx next build 2>&1 | tail -20</automated>
  </verify>
  <done>Google and Apple social login buttons appear on sign-in and register pages. OAuth callback route exists at /auth/callback. Clicking social buttons triggers Supabase OAuth flow. Existing email/password login unchanged. Middleware allows /auth/callback path.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Redesigned auth pages (sign-in, register, forgot-password) with GOYA brand theme and Google/Apple social login buttons</what-built>
  <how-to-verify>
    1. Start dev server: `npm run dev`
    2. Visit http://localhost:3000/sign-in — verify:
       - Light background (#f8f9fa), no dark navy
       - Blue GOYA logo above form
       - Google and Apple social login buttons with "or" divider
       - Brand blue (#345c83) submit button and links
       - No site header or footer visible
       - Page is exactly viewport height, no scrolling
       - Privacy Policy and Terms of Use links below card
    3. Visit http://localhost:3000/register — verify:
       - Same light theme, blue logo
       - Step indicator uses brand blue, not cyan
       - Role cards use blue selected state
       - Step 2 has social login buttons above form fields
       - Step 3 success uses brand blue checkmark
    4. Visit http://localhost:3000/forgot-password — verify:
       - Same light theme, blue logo
       - Brand blue button and links
    5. Visit http://localhost:3000/onboarding — verify nothing changed (still has its own light layout)
    6. Test email/password login still works (enter credentials, verify redirect)
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues with the redesign</resume-signal>
</task>

</tasks>

<verification>
- `npx next build` completes without errors
- No instances of #1a2744, #1e2e56, #243560, or #2dd4bf in sign-in, register, or forgot-password pages
- /auth/callback route exists and handles OAuth code exchange
- Middleware PUBLIC_PATHS includes /auth/callback
- Root layout hideNav covers /sign-in and /forgot-password
</verification>

<success_criteria>
- All auth pages use GOYA brand tokens (primary blue #345c83, light surfaces, white cards)
- Social login buttons (Google, Apple) visible on sign-in and register pages
- OAuth callback route processes Supabase auth code and routes to onboarding/dashboard
- No dark theme remnants on any auth page
- Existing email/password auth flow unchanged
- Onboarding flow unaffected
</success_criteria>

<output>
After completion, create `activity/quick-tasks/quick-task_redesign-auth-pages-brand-social-login_27-03-2026.md`
</output>
