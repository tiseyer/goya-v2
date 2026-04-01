# Roadmap: v1.16 Media Library Restructure

**Created:** 2026-04-01
**Phases:** 2
**Requirements:** 15 (100% mapped)

---

## Phase 1: Database Schema

**Goal:** Add bucket and is_system columns to media_folders, apply migration, regenerate types.

**Requirements:** SCHEMA-01, SCHEMA-02, SCHEMA-03

**Plans:** 1 plan

Plans:
- [ ] 01-01-PLAN.md — Add is_system column, set bucket default, regen types

**Success Criteria:**
1. Migration file creates `bucket` default ('media') and `is_system` (boolean, default false) columns on media_folders
2. Migration applied to remote Supabase
3. TypeScript types regenerated and committed
4. Existing folders default to bucket='media', is_system=false

---

## Phase 2: Sidebar UI + Query Logic

**Goal:** Replace flat folder sidebar with 3 bucket sections (All Media, Certificates, Avatars) with collapsible subfolder trees and bucket-aware query filtering.

**Requirements:** SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05, SIDE-06, SIDE-07, QUERY-01, QUERY-02, QUERY-03, QUERY-04, QUERY-05

**Success Criteria:**
1. Sidebar renders 3 bucket sections with correct lucide-react icons (Image, Award, User)
2. All Media click toggles user-created folders; Certificates click toggles system subfolders; Avatars click selects without subfolders
3. Add folder button only visible under All Media when expanded
4. Active/selected state highlighting works on both bucket and subfolder levels
5. Media grid shows correct items per selected bucket/folder combination

---

**Coverage:**
- SCHEMA: 3/3 → Phase 1
- SIDE: 7/7 → Phase 2
- QUERY: 5/5 → Phase 2
- Total: 15/15 (100%) ✓
