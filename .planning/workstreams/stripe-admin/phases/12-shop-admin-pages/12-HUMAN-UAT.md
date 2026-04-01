---
status: partial
phase: 12-shop-admin-pages
source: [12-VERIFICATION.md]
started: 2026-03-24T11:20:00Z
updated: 2026-03-24T11:20:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Drag-and-drop product reorder
expected: Dragging a product row in the /admin/shop/products table reorders it visually and persists the new order to products.priority
result: [pending]

### 2. Status pill click toggle
expected: Clicking a product's status pill in the table optimistically updates the displayed status and calls toggleProductStatus server action
result: [pending]

### 3. Order detail: billing and shipping address rendering
expected: For an order with a customer who has a billing address in Stripe, the address renders correctly in the Customer card
result: [pending]

### 4. CouponForm role restrictions UI
expected: Selecting Whitelist mode in role restrictions shows checkboxes for Student/Teacher/Wellness Practitioner/School
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
