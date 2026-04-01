export const MEDIA_BUCKETS = [
  { key: 'avatars',              label: 'Avatars' },
  { key: 'event-images',         label: 'Events' },
  { key: 'school-logos',         label: 'Courses' },
  { key: 'upgrade-certificates', label: 'Certificates' },
  { key: 'uploads',              label: 'Uploads' },
] as const;

export type BucketKey = typeof MEDIA_BUCKETS[number]['key'];

// ── Sidebar sections ──────────────────────────────────────────────────────────

export type SidebarSectionKey = 'media' | 'certificates' | 'avatars';

export const SIDEBAR_SECTIONS = [
  {
    key: 'media' as const,
    label: 'All Media',
    icon: 'Image',                          // lucide-react icon name
    storageBuckets: ['media', 'uploads'] as const,  // maps to these Supabase storage buckets
    hasFolders: true,                        // shows user-created folders (is_system=false)
    folderFilter: { bucket: 'media', is_system: false } as const,
  },
  {
    key: 'certificates' as const,
    label: 'Certificates',
    icon: 'Award',
    storageBuckets: ['upgrade-certificates'] as const,
    hasFolders: true,                        // shows system subfolders (is_system=true)
    folderFilter: { bucket: 'certificates', is_system: true } as const,
  },
  {
    key: 'avatars' as const,
    label: 'Avatars',
    icon: 'User',
    storageBuckets: ['avatars'] as const,
    hasFolders: false,                       // no subfolders
    folderFilter: null,
  },
] as const;

export function getSectionByKey(key: string): typeof SIDEBAR_SECTIONS[number] | undefined {
  return SIDEBAR_SECTIONS.find(s => s.key === key);
}
