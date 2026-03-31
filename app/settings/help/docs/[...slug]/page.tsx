import { notFound } from 'next/navigation'
import { getAllDocs, getDocBySlug, getNavTree } from '@/lib/docs'
import { getUserRole, getAudiencesForRole } from '../../actions'
import HelpDocViewer from './HelpDocViewer'

export default async function HelpDocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const slugStr = slug.join('/')

  // Get user role and filter docs server-side
  const userRole = await getUserRole()
  const audiences = getAudiencesForRole(userRole)

  // Get the requested doc
  const doc = getDocBySlug(slugStr)
  if (!doc) return notFound()

  // Verify user has access to this doc's audience
  const hasAccess = doc.meta.audience.some(a => audiences.includes(a))
  if (!hasAccess) return notFound()

  // Get all docs filtered by user's role
  const allDocs = getAllDocs().filter(d => d.audience.some(a => audiences.includes(a)))

  // Build nav tree with only accessible docs
  const navSections = getNavTree()
  const filteredNav = navSections
    .map(section => ({
      ...section,
      pages: section.pages.filter(p => p.audience.some(a => audiences.includes(a))),
    }))
    .filter(section => section.pages.length > 0)

  // Find prev/next within accessible docs
  const currentIndex = allDocs.findIndex(d => d.slug === slugStr)
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null

  return (
    <HelpDocViewer
      doc={doc}
      navTree={filteredNav}
      allDocs={allDocs}
      prevDoc={prevDoc}
      nextDoc={nextDoc}
    />
  )
}
