# Quick Task: Maintenance UI Refactor

**Date:** 2026-04-01
**Status:** Complete

## Description

Consolidate 7 separate content boxes in the Maintenance settings tab into 4 grouped boxes.

## Solution

Refactored `MaintenanceTab.tsx` render layout:
- **Box 1 (Maintenance Mode):** Merged site maintenance + chatbot maintenance with shared save
- **Box 2 (Sandboxes):** Merged email/flows/credit hours sandboxes with combined status badge ("2 active" / "All inactive") and shared save
- **Box 3 (Theme Lock):** Unchanged
- **Box 4 (Page Visibility):** Unchanged

All state, save logic, audit logging, and toast messages preserved — pure layout change.
