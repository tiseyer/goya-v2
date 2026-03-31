---
title: Media Library
audience: ["admin"]
section: admin
order: 6
last_updated: "2026-03-31"
---

# Media Library

The **Media Library** at `/admin/media` gives admins and moderators a central view of every file uploaded across the GOYA platform — avatars, event images, school logos, certificates, and general uploads.

## Accessing Media

1. Open the admin sidebar
2. Click **Media** (between Users and Events)

Admins can view, search, filter, edit metadata, and delete files. Moderators can view and filter but cannot delete.

## Layout

The library has three zones:

- **Left sidebar** — folder/bucket tree (collapse with the arrow button)
- **Main area** — toolbar + file grid or list
- **Right panel** — file detail panel (opens on item click)

On mobile, the left sidebar collapses to a **folder dropdown** above the toolbar, and the detail panel opens as a **bottom sheet** instead of a side panel.

## Browsing Files

### Folder Sidebar

The sidebar shows:

- **All Media** — every file across all buckets
- **Bucket sections** (Avatars, Event Images, School Logos, Upgrade Certificates, Uploads) — files for each storage bucket
- **Custom folders** — folders created by admins, nested under their bucket

Click any bucket or folder to filter the grid. Use the collapse button (chevron) to hide the sidebar and gain more grid space.

### Grid and List Views

Toggle between grid and list views using the icons in the toolbar. Your preference is saved in your browser.

- **Grid** — responsive thumbnail cards (2–6 columns depending on screen width)
- **List** — table with thumbnail, name, type, size, upload date, and uploaded by

## Searching and Filtering

All filters work simultaneously — you can combine search text with type, date, and uploader filters at the same time.

| Control | Options |
|---------|---------|
| **Search** | Searches file name and title. Results update 300ms after you stop typing. |
| **File type** | All files / Images / PDFs / Videos |
| **Date** | All time / Today / This week / This month |
| **Uploaded by** | All users / GOYA team / Members |
| **Sort** | Newest first / Oldest first / Name A-Z / File size |

## Loading States

While files load, the grid and list display animated skeleton placeholders. This applies to the initial page load and also when you switch folders or change filters.

## File Detail Panel

Click any file to open the detail panel. On desktop it slides in from the right. On mobile it slides up as a bottom sheet.

The panel shows:

- Large image preview (or a file-type icon for non-images)
- **Editable fields:** Title, Alt Text, Caption — click **Save** to persist changes
- **Read-only info:** File name, MIME type, file size, dimensions (images only), upload date, uploaded by (name + role)
- **URL row** with a copy button
- **Delete file** button (admin only — requires confirmation)

## Uploading Files

Click the **Upload** button in the toolbar or drag files anywhere onto the main area. Supported formats:

- **Images:** JPEG, PNG, WebP, GIF
- **Documents:** PDF
- **Video:** MP4

Maximum file size: 50 MB per file.

While uploading, progress cards appear at the top of the grid. Once complete, the new file is prepended to the grid automatically.

## Folder Management (Admin Only)

- **Create folder** — click the `+` icon next to any bucket label
- **Rename folder** — double-click a folder name to edit inline
- **Reorder folders** — drag the grip handle to reorder within a bucket
- **Delete folder** — click the trash icon on hover; files in the folder are not deleted, they become unfoldered

## URL Sharing

The active folder, search query, and all filters are reflected in the URL, so you can bookmark or share a specific filtered view.

---

**See also:** [Overview](./overview.md)
