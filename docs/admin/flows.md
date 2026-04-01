---
title: Flows
audience: ["admin"]
section: admin
order: 10
last_updated: "2026-03-31"
---

# Flows

The Flows builder lets you create multi-step interactive experiences for platform users — such as onboarding sequences, surveys, or guided content journeys. Navigate to **Settings > Flows** in the sidebar or go to `/admin/flows`.

## Table of Contents

- [Flow List](#flow-list)
- [Creating a Flow](#creating-a-flow)
- [Flow Editor](#flow-editor)
- [Analytics Tab](#analytics-tab)
- [Templates](#templates)

---

## Flow List

The Flows page organises your flows into five tabs:

| Tab | What it shows |
|---|---|
| **Active** | Published flows currently running for users |
| **Draft** | Flows in progress that have not been published |
| **Paused** | Flows temporarily suspended without being archived |
| **Archived** | Retired flows kept for reference |
| **Templates** | Reusable flow blueprints |

Each flow appears as a card showing the flow name, step count, and key stats (views, completions, drop-off rate). Active flows can be reordered by dragging the cards — the order controls how flows are prioritised if a user qualifies for multiple flows simultaneously.

---

## Creating a Flow

Click **Create Flow** to open the creation modal. Enter:

- **Name** — internal label for the flow
- **Type** — selects the flow's intended use case (e.g. onboarding, survey)
- **Status** — start as Draft or activate immediately

After saving, the flow opens directly in the editor.

---

## Flow Editor

The editor opens at `/admin/flows/[id]/edit` and has a three-panel layout:

### Left panel — Step list

The step list sidebar shows all steps in the flow in order. Click a step to select it and edit its content. Drag steps to reorder them. Click **+ Add Step** at the bottom to append a new step.

### Centre — Step canvas

The canvas shows the currently selected step and its elements. Elements are the building blocks of a step:

- **Text** — paragraphs and headings
- **Input** — text fields, dropdowns, radio buttons, and checkboxes
- **Image** — uploaded or URL-based images
- **Branch** — conditional logic that routes users differently based on their answers

Click an element to select it and edit its properties in the right panel.

### Right panel — Properties and settings

The right panel switches between two modes:

- **Element properties** — editing the content, label, placeholder, or conditions for the selected element
- **Flow settings** — global flow configuration (name, trigger conditions, visibility rules)

Click **Flow Settings** in the top toolbar to switch to the settings view.

### Saving

The editor autosaves when you make changes. The save status indicator in the top bar shows one of three states:

| State | Meaning |
|---|---|
| **Saved** (green) | All changes persisted |
| **Unsaved changes** (amber) | Changes pending save |
| **Saving...** (amber) | Save in progress |

If you attempt to navigate away with unsaved changes, the browser will prompt you to confirm.

### Preview

Click **Preview** in the top bar to open a live preview modal showing the flow exactly as a user would see it. Useful for testing logic branches before activating.

---

## Analytics Tab

Click **Analytics** in the top bar while inside a flow to switch from the editor to the analytics view. This shows:

- Step-by-step completion rates
- Drop-off points — where users abandon the flow
- Completion rate over time

Use the analytics filters to scope data to a date range.

---

## Templates

Templates are pre-built flow blueprints. Creating a flow from a template copies all steps and settings into a new draft. Templates themselves are read-only from the **Templates** tab; edit the copy instead.

To create a template from an existing flow, change its type to **Template** in the flow settings panel.

---

**See also:** [Settings](./settings.md) | [Chatbot](./chatbot.md) | [Analytics](./analytics.md)
