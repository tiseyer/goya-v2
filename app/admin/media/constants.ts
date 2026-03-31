export const MEDIA_BUCKETS = [
  { key: 'avatars',              label: 'Avatars' },
  { key: 'event-images',         label: 'Events' },
  { key: 'school-logos',         label: 'Courses' },
  { key: 'upgrade-certificates', label: 'Certificates' },
  { key: 'uploads',              label: 'Uploads' },
] as const;

export type BucketKey = typeof MEDIA_BUCKETS[number]['key'];
