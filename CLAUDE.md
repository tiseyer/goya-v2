## Logging & Activity Tracking

### On errors or unexpected behavior
Append to `LOG.md` under "Open Issues":
`[YYYY-MM-DD] [ERROR|WARN|INFO] [component] — Description | OPEN`
When resolved, move to "Resolved" and mark RESOLVED.

### On milestone completion or new milestone start
- Create a new file in `activity/` named `vX-X-X_MilestoneName_DD-MM-YYYY.md`
- Use the date the milestone starts or completes
- Add the file to the table in `activity/README.md`
- Mark completed milestones ✅ Done in the README table
- The file lists all deliverables with checkboxes, check them off as work completes

These files are the source of truth for project health (LOG.md) and billing/planning (activity/).

### After every /gsd:quick task
- Create `activity/quick-tasks/quick-task_TaskName_DD-MM-YYYY.md`
- TaskName: short-kebab-case summary of what was done
- File contains: task description, status, solution

## Layout Width Standard

All page content sections must use the `PageContainer` component (`app/components/ui/PageContainer.tsx`) to ensure consistent width alignment with the header and footer.

- **Standard width:** `max-w-7xl` (1280px) with `px-4 sm:px-6 lg:px-8`
- **Never** hardcode max-width or horizontal padding directly on pages
- **Full-bleed backgrounds** are fine — just wrap the content inside with `<PageContainer>`
- **Prose pages** (legal, blog) may use an inner `max-w-3xl` for readability, but the outer container must still be `max-w-7xl`
