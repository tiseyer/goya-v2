---
phase: quick
plan: 260331-ihy
type: execute
wave: 1
depends_on: []
files_modified:
  - app/admin/components/AdminShell.tsx
  - app/admin/inbox/page.tsx
  - app/admin/settings/page.tsx
autonomous: true
requirements: [QUICK-260331-ihy]

must_haves:
  truths:
    - "Sidebar shows Analytics dropdown with Shop and Visitors sub-items"
    - "Sidebar shows two visual dividers separating content into three sections"
    - "Settings is a dropdown group in sidebar with System, Email Templates, Flows, Chatbot, Credits, API Keys, Audit Log sub-items"
    - "Inbox page has 5 tabs: Credits & Hours, Verifications, Support Tickets, Teacher Upgrades, School Registrations"
    - "Verification tab in Inbox fetches pending profiles and renders VerificationActions"
    - "Settings page has only 3 tabs: General, Health, Maintenance (Analytics tab removed)"
    - "Verification standalone nav item is removed from sidebar"
    - "Credits, Audit Log, Chatbot, Flows, API Keys, Migration standalone nav items removed from sidebar (moved under Settings)"
  artifacts:
    - path: "app/admin/components/AdminShell.tsx"
      provides: "Restructured sidebar with dividers, Analytics group, Settings group"
    - path: "app/admin/inbox/page.tsx"
      provides: "Inbox page with 5 tabs including Verifications"
    - path: "app/admin/settings/page.tsx"
      provides: "Settings page with Analytics tab removed (3 tabs: General, Health, Maintenance)"
  key_links:
    - from: "app/admin/components/AdminShell.tsx"
      to: "all admin pages"
      via: "href paths in NAV_ITEMS"
    - from: "app/admin/inbox/page.tsx"
      to: "app/admin/verification/VerificationActions.tsx"
      via: "import in Verifications tab"
---

<objective>
Restructure admin sidebar navigation with new Analytics section, reorganized Inbox tabs (add Verifications), Settings as a dropdown with sub-items, visual dividers, and remove the standalone Analytics tab from Settings page.

Purpose: The current flat sidebar has too many items. Grouping related items under Analytics and Settings dropdowns with dividers creates a cleaner, more organized admin navigation. Moving Verification into Inbox consolidates review workflows.

Output: Updated AdminShell.tsx with new nav structure, updated Inbox page with Verifications tab, cleaned-up Settings page.
</objective>

<execution_context>
@.claude/skills/
</execution_context>

<context>
@app/admin/components/AdminShell.tsx
@app/admin/inbox/page.tsx
@app/admin/settings/page.tsx
@app/admin/verification/page.tsx
@app/admin/verification/VerificationActions.tsx

<interfaces>
From app/admin/components/AdminShell.tsx:
```typescript
type NavLink = {
  type: 'link';
  href: string;
  label: string;
  badge?: boolean;
  paths: string[];  // SVG path data strings
};

type NavGroup = {
  type: 'group';
  label: string;
  paths: string[];
  children: Omit<NavLink, 'type'>[];
};

type NavItem = NavLink | NavGroup;
```
Currently only 'link' and 'group' types exist. Need to add 'divider' type.

From app/admin/inbox/page.tsx:
```typescript
// Server component, tabs via searchParams: schools, upgrades, credits, tickets
// Uses: SchoolRegistrationsTab, TeacherUpgradesTab, CreditsTab, SupportTicketsTab
```

From app/admin/verification/VerificationActions.tsx:
```typescript
interface Props {
  userId: string;
  certificateUrl?: string | null;
}
export default function VerificationActions({ userId, certificateUrl }: Props)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restructure AdminShell sidebar nav with dividers, Analytics group, and Settings group</name>
  <files>app/admin/components/AdminShell.tsx</files>
  <action>
1. Add a 'divider' type to NavItem union:
   ```typescript
   type NavDivider = { type: 'divider' };
   type NavItem = NavLink | NavGroup | NavDivider;
   ```

2. Replace the single `shopOpen` state with a generic `openGroups` state using a `Set<string>` (keyed by label) to support multiple collapsible groups (Analytics, Shop, Settings). Initialize from pathname:
   - If pathname starts with `/admin/shop/analytics` or `/admin/shop` -> open both Analytics and Shop
   - If pathname matches any Settings child -> open Settings
   - Auto-open the group whose child matches current pathname

3. Restructure NAV_ITEMS array to match the target structure:
   ```
   Dashboard (link)
   Analytics (group) -> children: Shop (/admin/shop/analytics), Visitors (placeholder link to /admin/analytics/visitors)
   Inbox (link, badge: true)
   --- divider ---
   Users (link)
   Events (link)
   Courses (link)
   Shop (group) -> children: Orders, Products, Coupons (remove Analytics from here)
   --- divider ---
   Settings (group) -> children:
     System (/admin/settings)
     Email Templates (/admin/email-templates)
     Flows (/admin/flows)
     Chatbot (/admin/chatbot)
     Credits (/admin/credits)
     API Keys (/admin/api-keys)
     Audit Log (/admin/audit-log)
     Migration (/admin/migration)
   ```

4. Remove standalone nav items: Verification, Credits, Audit Log, Chatbot, Flows, API Keys, Migration (all moved under Settings group).

5. For divider rendering in the nav map, render a horizontal rule: `<div className="my-2 mx-2 border-t border-slate-200" />` when `item.type === 'divider'`.

6. Generalize the group rendering logic: replace the hardcoded `shopOpen`/`setShopOpen` with `openGroups.has(item.label)` and toggle via a function that adds/removes from the Set. The useEffect that auto-opens Shop on pathname should be generalized to auto-open any group whose child href matches the current pathname.

7. For the Analytics group icon, use a chart/bar-chart SVG path. For the Settings group, reuse the existing gear icon paths. For Visitors placeholder, use an eye icon path.

8. SVG paths for new nav items:
   - Analytics group: `'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'` (reuse existing analytics icon)
   - Visitors: `'M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'` (eye icon)
   - System: `'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'` (gear icon, same as current Settings)
   - Email Templates: use mail icon `'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'`
   - Migration: keep existing upload icon path

9. Keep the badge on Inbox (pendingSchools count). The Inbox link stays at `/admin/inbox`.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit app/admin/components/AdminShell.tsx 2>&1 | head -20</automated>
  </verify>
  <done>Sidebar renders: Dashboard, Analytics (dropdown: Shop, Visitors), Inbox, divider, Users, Events, Courses, Shop (dropdown: Orders, Products, Coupons), divider, Settings (dropdown: System, Email Templates, Flows, Chatbot, Credits, API Keys, Audit Log, Migration). All groups expand/collapse independently. Dividers render as subtle horizontal lines. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Add Verifications tab to Inbox and reorder tabs</name>
  <files>app/admin/inbox/page.tsx</files>
  <action>
1. Import VerificationActions from `@/app/admin/verification/VerificationActions` at the top of the file.

2. Add a new `verifications` tab value. Update the activeTab derivation to handle `tab === 'verifications'`. Set the NEW default tab to `'credits'` (Credits & Hours is the first tab in the new order).

3. Fetch verification-pending profiles (same query as verification/page.tsx):
   ```typescript
   const { data: pendingVerifications } = await supabase
     .from('profiles')
     .select('id, full_name, email, member_type, avatar_url, created_at, certificate_url')
     .eq('verification_status', 'pending')
     .order('created_at', { ascending: true });
   const verificationUsers = pendingVerifications ?? [];
   const pendingVerificationCount = verificationUsers.length;
   ```

4. Reorder the tab links in this order (matching the target structure):
   - Credits & Hours (tab=credits) — with pendingCreditCount badge
   - Verifications (tab=verifications) — with pendingVerificationCount badge
   - Support Tickets (tab=tickets) — with openTicketCount badge
   - Teacher Upgrades (tab=upgrades) — with pendingUpgradeCount badge
   - School Registrations (tab=schools) — with pendingSchoolCount badge

5. Add tab content for verifications. Render the verification queue inline (adapted from verification/page.tsx render):
   ```tsx
   {activeTab === 'verifications' && (
     verificationUsers.length === 0 ? (
       <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
         <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
           <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
           </svg>
         </div>
         <p className="font-semibold text-slate-700 mb-1">All caught up!</p>
         <p className="text-sm text-slate-400">No pending verifications.</p>
       </div>
     ) : (
       <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
         <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
           <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
             {verificationUsers.length} pending
           </span>
         </div>
         <div className="divide-y divide-slate-100">
           {verificationUsers.map(user => (
             /* Same row layout as verification/page.tsx: avatar, info (name, email, member_type badge), date, VerificationActions */
           ))}
         </div>
       </div>
     )
   )}
   ```
   Copy the exact row markup from verification/page.tsx lines 46-76 for each user row.

6. Update the page header description to: "Review credits, verifications, support tickets, teacher upgrades, and school registrations"
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit app/admin/inbox/page.tsx 2>&1 | head -20</automated>
  </verify>
  <done>Inbox page shows 5 tabs in order: Credits & Hours, Verifications, Support Tickets, Teacher Upgrades, School Registrations. Verifications tab displays pending users with approve/reject actions identical to the standalone verification page. Badge counts show on each tab.</done>
</task>

<task type="auto">
  <name>Task 3: Remove Analytics tab from Settings page</name>
  <files>app/admin/settings/page.tsx</files>
  <action>
1. Remove the AnalyticsTab function component entirely (lines ~282-483: state, effects, save logic, StatusDot, Toast, InputField are all used only by AnalyticsTab — but check if shared UI components like Section, Toggle, InputField, StatusDot, Toast are used by other tabs too before removing).

   Actually: GeneralTab uses Section and ReadOnlyField. MaintenanceTab and HealthTab are separate component files. The shared components (Section, ReadOnlyField, Toggle, InputField, StatusDot, Toast) are defined in this file. Check which are still needed:
   - Section: used by GeneralTab -> KEEP
   - ReadOnlyField: used by GeneralTab -> KEEP
   - Toggle: used only by AnalyticsTab -> REMOVE
   - InputField: used only by AnalyticsTab -> REMOVE
   - StatusDot: used only by AnalyticsTab -> REMOVE
   - Toast: check if used by GeneralTab -> not used by GeneralTab -> REMOVE
   - DeployEnvironmentCard: used by GeneralTab -> KEEP
   - utcToDatetimeLocal/datetimeLocalToUtc: check if used -> likely used by MaintenanceTab (but MaintenanceTab is a separate file, so not used here) -> REMOVE

2. Update the TABS array to remove the analytics entry:
   ```typescript
   type Tab = 'general' | 'email-templates' | 'health' | 'maintenance';
   const TABS: { key: Tab; label: string }[] = [
     { key: 'general',         label: 'General'         },
     { key: 'email-templates', label: 'Email Templates' },
     { key: 'health',          label: 'Health'           },
     { key: 'maintenance',     label: 'Maintenance'      },
   ];
   ```

3. Remove the `{tab === 'analytics' && <AnalyticsTab />}` render line.

4. Remove unused imports: the `useCallback` import is only used by AnalyticsTab -> remove it from the import.

5. Keep the remaining page structure intact.

NOTE: The analytics configuration (GA4 ID, Clarity ID) is ALREADY accessible via the API Keys > Third Party Keys (SecretsTab) which has seeded Analytics category entries for GA4 and Clarity. Removing it from Settings eliminates the duplication.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit app/admin/settings/page.tsx 2>&1 | head -20</automated>
  </verify>
  <done>Settings page has 4 tabs: General, Email Templates, Health, Maintenance. Analytics tab is completely removed. No unused components remain. All shared components still used by GeneralTab are preserved.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes for all three modified files
2. `npm run build` completes without errors
3. Visual: Sidebar shows correct grouping with dividers
4. Visual: Inbox shows 5 tabs with Verifications working
5. Visual: Settings no longer shows Analytics tab
</verification>

<success_criteria>
- AdminShell sidebar has Analytics group (Shop, Visitors), two dividers, Settings group with 8 sub-items
- Inbox page has 5 tabs with Verifications integrated
- Settings page has 4 tabs (Analytics removed)
- All existing navigation paths still work (no broken links)
- TypeScript compilation succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/260331-ihy-restructure-admin-sidebar-navigation-wit/260331-ihy-SUMMARY.md`
Also create `activity/quick-tasks/quick-task_restructure-admin-sidebar-navigation_31-03-2026.md`
</output>
