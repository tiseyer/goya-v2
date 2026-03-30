## Quick Task: add-faq-category-and-seed-33-faqs

**Date:** 2026-03-30
**ID:** 260330-gu2
**Status:** Done

## Description

Added a `category` text column to the `faq_items` Supabase table, wired it through all code layers (types, server actions, admin UI), and seeded 33 published FAQs across 8 categories for the Mattea chatbot.

## Solution

1. **Migration** — `ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS category text` applied via `supabase db query --linked`
2. **Types** — `FaqItem` interface updated with `category: string | null`
3. **Server actions** — `createFaqItem`, `updateFaqItem`, and `listFaqItems` all updated to handle category
4. **Admin UI** — FaqModal gets a Category text input; FaqRow shows a colored hash-based badge in the table and an editable input in expanded edit; FaqTab adds the column header and includes category in search
5. **Seed** — `scripts/seed-faqs.ts` inserts 33 FAQs: Membership(6), Teacher(6), Payment(5), School(4), Community(3), Credit Hours(3), General(3), Technical(3)
6. **Types regen** — `npx supabase gen types typescript` updated `types/supabase.ts` with the new column

## Commits

- `5aa8a0b` — feat: add category column + UI updates
- `ca59dc7` — feat: seed 33 FAQ entries
- `39b1916` — chore: regenerate Supabase types
