---
phase: quick
plan: 260330-hva
type: execute
wave: 1
depends_on: []
files_modified:
  - app/admin/chatbot/FaqTab.tsx
autonomous: true
requirements: [QUICK-FAQ-CATEGORY-FILTER]
must_haves:
  truths:
    - "Admin sees category tabs (All + one per unique category) between toolbar and table"
    - "Clicking a tab filters FAQs to that category"
    - "Category counts are visible on each tab"
    - "Search and category filter combine (both apply simultaneously)"
    - "Adding/deleting an FAQ updates category counts dynamically"
  artifacts:
    - path: "app/admin/chatbot/FaqTab.tsx"
      provides: "Category filter tabs with dynamic counts"
      contains: "categoryFilter"
  key_links:
    - from: "categoryFilter state"
      to: "filteredItems"
      via: "filter chain combining search + category"
      pattern: "categoryFilter.*filteredItems|filteredItems.*categoryFilter"
---

<objective>
Add category filter tabs to the FAQ admin UI so admins can filter FAQs by category.

Purpose: With 33 FAQs across 8 categories, a flat list is hard to navigate. Tabs let admins focus on one category at a time.
Output: Updated FaqTab.tsx with category filter tab bar.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/admin/chatbot/FaqTab.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add category filter tabs to FaqTab</name>
  <files>app/admin/chatbot/FaqTab.tsx</files>
  <action>
Modify FaqTab.tsx with these changes:

1. Add state: `const [categoryFilter, setCategoryFilter] = useState('All')`

2. Derive categories from `items` (not filteredItems — use full list so tabs stay stable):
```ts
const categories = useMemo(() => {
  const cats = Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort()
  return ['All', ...cats]
}, [items])
```
Import `useMemo` from react.

3. Compute category counts from `items`:
```ts
const categoryCounts = useMemo(() => {
  const counts: Record<string, number> = { All: items.length }
  for (const item of items) {
    if (item.category) {
      counts[item.category] = (counts[item.category] || 0) + 1
    }
  }
  return counts
}, [items])
```

4. Update `filteredItems` to apply BOTH search and category filter:
```ts
const filteredItems = useMemo(() => {
  return items.filter((i) => {
    const matchesCategory = categoryFilter === 'All' || i.category === categoryFilter
    const matchesSearch = search.trim().length === 0 ||
      i.question.toLowerCase().includes(search.toLowerCase()) ||
      i.answer.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })
}, [items, search, categoryFilter])
```
Remove the existing `const filteredItems = ...` expression and replace with the useMemo version above.

5. Render tab bar between the toolbar div and the empty state / table section. Use this markup:
```tsx
{/* Category filter tabs */}
{items.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-4">
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => setCategoryFilter(cat)}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          categoryFilter === cat
            ? 'bg-[#4e87a0] text-white'
            : 'bg-slate-100 text-[#374151] hover:bg-slate-200'
        }`}
      >
        {cat}
        <span className={`ml-1.5 text-xs ${
          categoryFilter === cat ? 'text-white/70' : 'text-[#9CA3AF]'
        }`}>
          {categoryCounts[cat] || 0}
        </span>
      </button>
    ))}
  </div>
)}
```

6. Reset categoryFilter to 'All' when search changes (optional UX improvement — skip this, let both filters coexist independently).

Style notes:
- Active tab uses the existing brand blue (#4e87a0) matching the "Add FAQ" button
- Inactive tabs use slate-100 background matching the table header style
- Counts use subdued text color
- flex-wrap handles overflow if many categories
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx next lint --file app/admin/chatbot/FaqTab.tsx 2>&1 | head -20</automated>
  </verify>
  <done>
- Category tabs render between toolbar and table showing All + 8 categories with counts
- Clicking a tab filters the table to that category
- Search and category filter combine (both must match)
- Tabs derive dynamically from items state
- Active tab is visually highlighted with brand blue
  </done>
</task>

</tasks>

<verification>
1. Lint passes on FaqTab.tsx
2. Visit /admin/chatbot, FAQ tab shows category tabs
3. Click "Membership" tab — shows 6 items
4. Click "All" tab — shows all 33 items
5. Type search term while on a category tab — both filters apply
</verification>

<success_criteria>
Admin can filter FAQ list by category using tabs. Tabs show dynamic counts. Search and category filter work together.
</success_criteria>

<output>
After completion, create `.planning/quick/260330-hva-add-category-filter-tabs-to-faq-admin-ui/260330-hva-SUMMARY.md`
</output>
