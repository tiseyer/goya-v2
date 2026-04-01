---
phase: quick
plan: 260330-mlx
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/admin/deployments/route.ts
  - app/admin/dashboard/DeploymentsSection.tsx
  - app/admin/dashboard/page.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Admin can see current deployment info (branch, commit SHA, environment)"
    - "Admin can see list of recent deployments with branch, commit message, URL, and time"
    - "Current deployment is visually highlighted in the list"
    - "Section shows loading skeleton while fetching"
    - "Section shows not-configured message when Vercel env vars are missing"
  artifacts:
    - path: "app/api/admin/deployments/route.ts"
      provides: "Vercel deployments API proxy"
      exports: ["GET"]
    - path: "app/admin/dashboard/DeploymentsSection.tsx"
      provides: "Client component rendering deployment list"
    - path: "app/admin/dashboard/page.tsx"
      provides: "Dashboard page with DeploymentsSection integrated"
  key_links:
    - from: "app/admin/dashboard/DeploymentsSection.tsx"
      to: "/api/admin/deployments"
      via: "fetch in useEffect"
      pattern: "fetch.*api/admin/deployments"
    - from: "app/admin/dashboard/page.tsx"
      to: "app/admin/dashboard/DeploymentsSection.tsx"
      via: "import and render"
      pattern: "import DeploymentsSection"
---

<objective>
Add a live Deployments section to the admin dashboard showing current deployment info and a list of recent Vercel deployments with branch names, commit messages, and clickable URLs.

Purpose: Give admins visibility into which branch/commit is deployed and recent deployment history without leaving the dashboard.
Output: API route + client component + dashboard integration.
</objective>

<context>
@app/api/admin/analytics/route.ts (auth pattern, Vercel API pattern, buildVercelHeaders)
@app/admin/dashboard/AnalyticsSection.tsx (client component pattern: loading/error/not-configured states, auto-refresh, SkeletonCard)
@app/admin/dashboard/page.tsx (integration point, StatCard, section layout)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create deployments API route and DeploymentsSection client component</name>
  <files>app/api/admin/deployments/route.ts, app/admin/dashboard/DeploymentsSection.tsx</files>
  <action>
**API Route — `app/api/admin/deployments/route.ts`:**
- Copy auth pattern exactly from `app/api/admin/analytics/route.ts`: `createSupabaseServerClient`, getUser, profile role check (admin/moderator), 401/403 responses.
- Add `export const dynamic = 'force-dynamic'`
- Check `VERCEL_ACCESS_TOKEN` and `VERCEL_PROJECT_ID` env vars — return 503 with `{ error: 'Deployments not configured' }` if missing.
- Build headers: `Authorization: Bearer ${VERCEL_ACCESS_TOKEN}`, `Content-Type: application/json`.
- Fetch `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10&state=READY` with those headers.
- Map response `deployments` array to simplified shape:
  ```ts
  interface Deployment {
    url: string        // deployment.url (prefix with https:// if missing)
    branch: string     // deployment.meta.githubCommitRef ?? 'unknown'
    commitMessage: string  // deployment.meta.githubCommitMessage ?? ''
    commitSha: string  // deployment.meta.githubCommitSha ?? ''
    createdAt: string  // deployment.created (ISO timestamp from epoch ms)
    isCurrent: boolean // commitSha === process.env.VERCEL_GIT_COMMIT_SHA
  }
  ```
- Return JSON `{ deployments: Deployment[], current: { branch, commitSha, environment } }` where current uses `VERCEL_GIT_COMMIT_REF`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV` env vars.
- Wrap fetch in try/catch, return 500 on failure.
- Set `Cache-Control: no-store` header on response.

**Client Component — `app/admin/dashboard/DeploymentsSection.tsx`:**
- `'use client'` directive.
- Follow AnalyticsSection patterns exactly for: loading/error/not-configured states, auto-refresh (60s interval), fetching indicator dot, lastUpdated timestamp.
- Use same SkeletonCard style (copy the component locally like AnalyticsSection does).
- **Current deployment card** at top: show branch name as a pill/badge (teal `bg-[#00B5A3]/10 text-[#00B5A3]`), short commit SHA (first 7 chars), environment badge. Use a white card with the same `rounded-xl border border-[#E5E7EB] p-5 shadow-sm` styling.
- **Deployments list** below: white card with same styling. Each deployment row shows:
  - Branch name as small pill/badge (use `bg-slate-100 text-slate-700` for non-current, `bg-[#00B5A3]/10 text-[#00B5A3]` for current)
  - Commit message truncated to 60 chars with ellipsis
  - Relative time (use a simple `timeAgo` helper: "Xm ago", "Xh ago", "Xd ago")
  - Clickable — entire row links to `https://${deployment.url}` in new tab
  - Current deployment row gets a left border accent: `border-l-2 border-[#00B5A3]`
- Section title: "Deployments" using same `text-xs font-semibold text-[#6B7280] uppercase tracking-widest` heading style.
- Not-configured state: same message pattern as AnalyticsSection, mention `VERCEL_ACCESS_TOKEN` and `VERCEL_PROJECT_ID`.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit app/api/admin/deployments/route.ts app/admin/dashboard/DeploymentsSection.tsx 2>&1 | head -30</automated>
  </verify>
  <done>API route returns deployment data from Vercel API with auth. Client component renders deployments with loading/error/not-configured states, auto-refresh, current deployment highlighting.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate DeploymentsSection into dashboard page</name>
  <files>app/admin/dashboard/page.tsx</files>
  <action>
In `app/admin/dashboard/page.tsx`:
1. Add import: `import DeploymentsSection from './DeploymentsSection'`
2. Add a new section AFTER the System section (after line ~154, before closing `</div>`):
```tsx
{/* Row 5 — Deployments */}
<div className="mt-8">
  <DeploymentsSection />
</div>
```
No other changes to page.tsx.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit app/admin/dashboard/page.tsx 2>&1 | head -20</automated>
  </verify>
  <done>DeploymentsSection renders on admin dashboard below the System section. Page compiles without errors.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes for all three files
2. Dev server loads `/admin/dashboard` without crash
3. If VERCEL_ACCESS_TOKEN is set: deployments list appears with branch names, commit messages, relative times
4. If VERCEL_ACCESS_TOKEN is NOT set: "not configured" message appears
5. Current deployment is highlighted with teal accent
</verification>

<success_criteria>
- Admin dashboard shows Deployments section with current deployment info and recent deployment list
- Deployments auto-refresh every 60 seconds
- Current deployment visually highlighted
- Loading skeleton shown while fetching
- Not-configured state shown when env vars missing
- All deployment rows link to their URLs in new tabs
</success_criteria>
