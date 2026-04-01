/**
 * PageContainer — single source of truth for content width across GOYA v2.
 *
 * Every page section (hero, body, footer content) must use this component
 * to ensure pixel-perfect alignment with the global header and footer.
 *
 * Standard: max-w-7xl (1280px) with responsive horizontal padding.
 *
 * Usage:
 *   <PageContainer>content</PageContainer>
 *   <PageContainer className="py-10">content with vertical padding</PageContainer>
 *   <PageContainer as="section">semantic section</PageContainer>
 */
export default function PageContainer({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'main'
}) {
  return (
    <Tag className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`.trim()}>
      {children}
    </Tag>
  )
}
