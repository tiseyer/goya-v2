// app/admin/media/page.tsx
// Server component — loads initial folder list, renders MediaPageClient.
// Admin layout.tsx handles AdminShell wrapping — do NOT add it here.

import { getFolders } from './actions';
import MediaPageClient from './MediaPageClient';

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; view?: string }>;
}) {
  const [initialFolders, sp] = await Promise.all([
    getFolders(),
    searchParams,
  ]);

  return (
    <MediaPageClient
      initialFolders={initialFolders}
      folder={sp.folder}
      view={sp.view}
    />
  );
}
