# Quick Task 260401-ovu: Fix chatbot maintenance indicators

**Status:** Complete
**Date:** 2026-04-01
**Commit:** 55657ff

## What was done

Replaced ugly "Maintenance" text badge with subtle visual indicators for chatbot maintenance mode.

### Changes

**app/components/chat/FloatingButton.tsx:**
- Added `maintenance` prop
- Chat icon color changes from white to `amber-300` when maintenance active

**app/components/chat/ChatWidget.tsx:**
- Removed the "Maintenance" text badge `<span>`
- Passes `maintenance={badge === 'maintenance'}` to FloatingButton

**app/settings/components/SettingsShell.tsx:**
- Fetches chatbot config for admin/moderator users
- Adds `ring-2 ring-amber-400` to Help sidebar item when chatbot maintenance is active

## Files changed

- `app/components/chat/FloatingButton.tsx`
- `app/components/chat/ChatWidget.tsx`
- `app/settings/components/SettingsShell.tsx`
