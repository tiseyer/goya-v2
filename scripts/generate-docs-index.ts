import fs from 'fs'
import path from 'path'

interface DocEntry {
  slug: string
  title: string
  audience: string[]
  section: string
  content: string
}

const DOCS_DIR = path.join(process.cwd(), 'docs')
const OUTPUT_FILE = path.join(DOCS_DIR, 'search-index.json')
const SECTIONS = ['admin', 'moderator', 'teacher', 'student', 'developer']

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }

  const meta: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value: unknown = line.slice(idx + 1).trim()
    // Parse arrays like ["admin", "moderator"]
    if (typeof value === 'string' && value.startsWith('[')) {
      try {
        value = JSON.parse(value)
      } catch {
        // keep as string
      }
    }
    // Strip quotes
    if (typeof value === 'string') {
      value = value.replace(/^["']|["']$/g, '')
    }
    meta[key] = value
  }

  return { meta, content: match[2] }
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^\s*[-*+]\s+/gm, '') // list markers
    .replace(/^\s*\d+\.\s+/gm, '') // numbered lists
    .replace(/\|[^|]*\|/g, '') // table rows
    .replace(/[-|]+/g, '') // table separators
    .replace(/\n{2,}/g, '\n') // multiple newlines
    .trim()
}

function buildIndex(): DocEntry[] {
  const entries: DocEntry[] = []

  for (const section of SECTIONS) {
    const sectionDir = path.join(DOCS_DIR, section)
    if (!fs.existsSync(sectionDir)) continue

    const files = fs.readdirSync(sectionDir).filter(f => f.endsWith('.md'))

    for (const file of files) {
      const raw = fs.readFileSync(path.join(sectionDir, file), 'utf-8')
      const { meta, content } = parseFrontmatter(raw)

      entries.push({
        slug: `${section}/${file.replace('.md', '')}`,
        title: (meta.title as string) || file.replace('.md', ''),
        audience: Array.isArray(meta.audience) ? meta.audience : [meta.audience as string].filter(Boolean),
        section,
        content: stripMarkdown(content),
      })
    }
  }

  return entries
}

const index = buildIndex()
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2))
console.log(`Generated search index: ${index.length} entries → ${OUTPUT_FILE}`)
