
## Deferred: Pre-existing vimeo_url column references in app code

**Discovered during:** Plan 36-01, Task 2 (courses column drop)
**Files:**
- app/academy/[id]/lesson/page.tsx:83 — reads course.vimeo_url
- app/admin/courses/components/CourseForm.tsx:35,59 — uses vimeo_url in form state and submit
- app/settings/my-courses/MyCoursesClient.tsx:114,381,409,424 — uses vimeo_url in form
- app/settings/my-courses/actions.ts:37,57,106 — passes vimeo_url to DB insert/update
- app/api/v1/courses/route.ts:141 — API allows setting vimeo_url

**Risk:** Runtime errors if these code paths are hit (DB column no longer exists). TypeScript doesn't catch these due to `as any` assertions.
**Resolution:** Phase 38 (Admin Course Form Redesign) replaces course vimeo_url with per-lesson video_url on the lessons table.
