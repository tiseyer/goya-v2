## Documentation

After completing ANY task (quick task, milestone phase, or bug fix), you MUST:

1. Identify which features were added, changed, or removed
2. Find the corresponding `docs/` files for those features using the audience mapping below
3. Update those files accurately — check the actual code, do not guess
4. Update the `last_updated` frontmatter date on any changed file
5. If a new feature has no docs file yet, create one in the correct audience folder
6. Regenerate the search index: `npm run docs:index`
7. Commit doc changes in the same commit as the feature, or immediately after
8. Never skip this step — documentation is part of done

**Audience mapping:**
- Admin backend changes → `docs/admin/`
- Moderator workflow changes → `docs/moderator/`
- User settings / member features → `docs/teacher/` and/or `docs/student/`
- API / DB / architecture changes → `docs/developer/`
- Changes affecting multiple roles → update all relevant files

Do NOT document internal implementation details in user-facing docs. Keep admin/moderator/teacher/student docs focused on **how to use** the feature, not how it is built.

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

## Git & Branching Rules for Milestones

1. Before starting any work on a milestone or large feature, create and checkout a new branch: `git checkout -b feature/[milestone-name]`

2. Only commit when `npx tsc --noEmit` passes with 0 errors.

3. When the milestone is complete and the build is green, merge directly to develop: `git checkout develop && git merge feature/[milestone-name] && git push origin develop && git branch -d feature/[milestone-name]`

4. Do not push intermediate states to develop. Never commit broken TypeScript.
