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
