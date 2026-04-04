# Quick Task 260404-mww: Quick switch redesign — icon-only buttons matching mode switcher

## Task 1 — Merge Quick Switch into theme switcher section

**Files:** `app/components/Header.tsx`
**Action:**
- Remove "QUICK SWITCH" label
- Remove separate `border-t` divider for Quick Switch section
- Move user icon buttons into the same container as ThemeInline (using `space-y-1.5`)
- Remove `<span>` with name text — icon-only buttons now
- Keep `title={slot.firstName}` for hover tooltip
- Maintain same hover/active styles as theme buttons

**Done:** Commit `ed05dda`
