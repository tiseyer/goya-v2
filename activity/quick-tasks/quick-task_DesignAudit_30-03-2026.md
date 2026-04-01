# Design System Audit — Admin & Settings Pages

**Date:** 2026-03-30
**Status:** Complete
**Scope:** All files in `app/admin/` and `app/settings/`

---

## 1. Tabs

| Page | File | Style | Tabs |
|------|------|-------|------|
| API Keys | admin/api-keys/page.tsx | Underline (teal) | Own Keys, Third Party Keys, Endpoints |
| Chatbot | admin/chatbot/page.tsx | Underline (teal) | Configuration, FAQ, Conversations, API Connections |
| Inbox | admin/inbox/page.tsx | Underline (teal) + count badges | School Registrations, Teacher Upgrades, Credits & Hours, Support Tickets |
| **Admin Settings** | **admin/settings/page.tsx** | **Pill/capsule** | General, Analytics, Email Templates, Health, Maintenance |
| Flows | admin/flows/components/FlowListTabs.tsx | Underline (teal) | Active, Draft, Paused, Archived, Templates |
| Settings Connections | settings/connections/page.tsx | Underline (primary) | My Connections, My Mentors, My Mentees, etc. |

**Finding:** Admin Settings is the only page using pill/capsule tabs. All others use underline style.

---

## 2. Primary Action Buttons (Top-Right CTAs)

| Page | File | Button Text | Color |
|------|------|-------------|-------|
| Events | admin/events/page.tsx | "Add New Event" | `bg-[#4E87A0]` (muted blue) |
| Courses | admin/courses/page.tsx | "Add New Course" | `bg-[#4E87A0]` (muted blue) |
| Products | admin/shop/products/page.tsx | "Create Product" | `bg-[#1B3A5C]` (dark navy) |
| Coupons | admin/shop/coupons/page.tsx | "Create Coupon" | `bg-[#1B3A5C]` (dark navy) |
| Flows | admin/flows/components/FlowListTabs.tsx | "Create Flow" | `bg-[#00B5A3]` (teal) |

**Missing CTA buttons:** Users, Orders, Audit Log, Verification, Credits, Impersonation Log, Analytics, Products & Add-Ons

**Finding:** 3 different button colors used across 5 pages.

---

## 3. Status/Category Badges

### Status Badges
| Status | Color | Used In |
|--------|-------|---------|
| Published/Active | `bg-emerald-50 text-emerald-700` | Events, Courses, Products |
| Draft | `bg-yellow-50 text-yellow-700` | Events, Courses |
| Cancelled | `bg-red-50 text-red-600` | Events |
| Deleted | `bg-slate-100 text-slate-400` | Events |
| Pending | `bg-amber-100 text-amber-700` | Inbox counts, Impersonation |
| Info | `bg-blue-50 text-blue-700` | Audit log |
| Warning | `bg-amber-50 text-amber-700` | Audit log |
| Error | `bg-red-50 text-red-700` | Audit log |

### Category Badges (Events & Courses)
| Category | Color |
|----------|-------|
| Workshop | `bg-teal-50 text-teal-700` |
| Teacher Training | `bg-purple-50 text-purple-700` |
| Dharma Talk | `bg-blue-50 text-blue-700` |
| Conference | `bg-amber-50 text-amber-700` |
| Yoga Sequence | `bg-green-50 text-green-700` |
| Music Playlist | `bg-pink-50 text-pink-700` |
| Research | `bg-slate-100 text-slate-600` |

### Role Badges
| Role | Color (settings) | Color (verification) |
|------|-------------------|----------------------|
| Student | `bg-blue-100 text-blue-700` | — |
| Teacher | `bg-teal-100 text-teal-700` | — |
| Wellness Practitioner | `bg-emerald-100 text-emerald-700` | `bg-teal-50 text-teal-700` |
| School | `bg-purple-100 text-purple-700` | — |
| Admin | `bg-red-100 text-red-700` | — |
| Moderator | `bg-orange-100 text-orange-700` | — |

### Audit Log Category Badges
| Category | Color |
|----------|-------|
| Admin | `bg-purple-50 text-purple-700` |
| User | `bg-emerald-50 text-emerald-700` |
| System | `bg-slate-100 text-slate-600` |

**Finding:** 12+ colors used for badges. No consistent semantic mapping.

---

## 4. Table/List Rows — Checkboxes & Bulk Select

| Page | File | Checkboxes | Bulk Select Bar | Style |
|------|------|------------|----------------|-------|
| Users | AdminUsersTable.tsx | Yes | Dark floating bar at bottom | `bg-[#1B3A5C]` |
| Products | ProductsTable.tsx | Yes + drag handles | Inline bar above table | `bg-[#1B3A5C]` |
| Orders | OrdersTable.tsx | Yes | Inline bar (light gray) | `bg-[#F8FAFC]` |
| Events | admin/events/page.tsx | No | — | — |
| Courses | admin/courses/page.tsx | No | — | — |
| Coupons | CouponsTable.tsx | No | — | — |
| API Keys | ApiKeysTable.tsx | No | — | — |

---

## 5. Delete/Destructive Actions

| File | Pattern | Style |
|------|---------|-------|
| AdminUsersTable.tsx | Red button in floating bar + modal confirmation | `bg-red-600` solid |
| ProductsTable.tsx | Icon-only trash (gray → red on hover) | `hover:text-red-500` |
| ProductsTable.tsx bulk | Red button in bulk bar | `bg-red-500` |
| ApiKeysTable.tsx | Red text "Revoke" button | `text-red-600 border border-red-200` |
| FaqRow.tsx | Red text "Delete" link | `text-red-600 hover:text-red-700` |
| AdminEventActions.tsx | Red text "Delete" button | `border border-red-200 text-red-600` |
| AdminCourseActions.tsx | Red text "Delete" button | `border border-red-200 text-red-600` |
| FlowCard.tsx | Red text in dropdown menu | `text-red-600 hover:bg-red-50` |
| settings/page.tsx | Red outline buttons | `border-2 border-red-200 text-red-600` |

**Finding:** 5+ different delete/destructive patterns.

---

## 6. Card Styles

| Context | Border | Radius | Shadow |
|---------|--------|--------|--------|
| Admin tables | `border-[#E5E7EB]` | `rounded-xl` | `shadow-sm` |
| Settings sections | `border-slate-100` | `rounded-2xl` | `shadow-sm` |
| Danger zones | `border-2 border-red-200` | `rounded-xl` | — |
| Flow cards | `border-slate-200` | `rounded-lg` | — |
| Alert banners | `border-amber-200` | `rounded-xl` | — |

**Finding:** 2 main card radii (xl vs 2xl) and 3 border color variants.

---

## 7. Empty States

All follow: centered icon (SVG, `text-slate-300`) + bold title + muted subtitle.
Container: `bg-white rounded-xl border border-[#E5E7EB] p-12 text-center`

Consistent across: Users, Products, Orders, Coupons, API Keys, Audit Log, Events, Courses.
