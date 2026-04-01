import { notFound } from 'next/navigation';
import { getAllDocs, getDocBySlug, getNavTree } from '@/lib/docs';
import type { DocMeta, NavSection } from '@/lib/docs';
import DocViewer from '../components/DocViewer';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = slug.join('/');
  const doc = getDocBySlug(slugPath);

  if (!doc) {
    notFound();
  }

  const allDocs = getAllDocs();
  const navTree = getNavTree();

  // Build flat ordered list for prev/next navigation
  const flatDocs: DocMeta[] = navTree.flatMap((s) => s.pages);
  const currentIdx = flatDocs.findIndex((d) => d.slug === slugPath);
  const prevDoc = currentIdx > 0 ? flatDocs[currentIdx - 1] : null;
  const nextDoc = currentIdx < flatDocs.length - 1 ? flatDocs[currentIdx + 1] : null;

  return (
    <DocViewer
      doc={doc}
      navTree={navTree}
      allDocs={allDocs}
      prevDoc={prevDoc}
      nextDoc={nextDoc}
    />
  );
}
