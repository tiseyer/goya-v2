import 'server-only'
import fs from 'fs'
import path from 'path'

/**
 * Role-to-audience mapping for documentation access.
 * Each role can see docs from specific audience folders.
 */
const ROLE_AUDIENCE_MAP: Record<string, string[]> = {
  student: ['student'],
  teacher: ['teacher', 'student'],
  wellness_practitioner: ['teacher', 'student'],
  school: ['teacher', 'student'],
  moderator: ['moderator', 'teacher', 'student'],
  admin: ['admin', 'moderator', 'teacher', 'student', 'developer'],
}

/** Maximum characters of doc content to inject into chatbot context */
const MAX_CONTEXT_CHARS = 12000

interface DocFile {
  title: string
  section: string
  content: string
}

function parseFrontmatter(raw: string): { title: string; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { title: '', content: raw }

  let title = ''
  for (const line of match[1].split('\n')) {
    if (line.startsWith('title:')) {
      title = line.slice(6).trim().replace(/^["']|["']$/g, '')
      break
    }
  }

  return { title, content: match[2] }
}

/**
 * Returns role-scoped documentation content as a concatenated string
 * suitable for injection into the chatbot system prompt.
 *
 * @param userRole - The authenticated user's role from profiles table
 * @param query - Optional user query to prioritize relevant docs
 */
export function getRoleScopedDocs(userRole: string | null, query?: string): string {
  const audiences = ROLE_AUDIENCE_MAP[userRole ?? 'student'] ?? ROLE_AUDIENCE_MAP.student
  const docsDir = path.join(process.cwd(), 'docs')

  const allDocs: DocFile[] = []

  for (const audience of audiences) {
    const sectionDir = path.join(docsDir, audience)
    if (!fs.existsSync(sectionDir)) continue

    const files = fs.readdirSync(sectionDir).filter(f => f.endsWith('.md'))
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(sectionDir, file), 'utf-8')
        const { title, content } = parseFrontmatter(raw)
        allDocs.push({ title, section: audience, content })
      } catch {
        // Skip unreadable files
      }
    }
  }

  if (allDocs.length === 0) return ''

  // If a query is provided, sort docs by relevance (simple keyword matching)
  if (query) {
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)

    allDocs.sort((a, b) => {
      const scoreA = queryWords.reduce((s, w) =>
        s + (a.title.toLowerCase().includes(w) ? 3 : 0) + (a.content.toLowerCase().includes(w) ? 1 : 0), 0)
      const scoreB = queryWords.reduce((s, w) =>
        s + (b.title.toLowerCase().includes(w) ? 3 : 0) + (b.content.toLowerCase().includes(w) ? 1 : 0), 0)
      return scoreB - scoreA
    })
  }

  // Build context string, respecting token budget
  let totalChars = 0
  const items: string[] = []

  for (const doc of allDocs) {
    const entry = `<doc title="${doc.title}" section="${doc.section}">\n${doc.content}\n</doc>`

    if (totalChars + entry.length > MAX_CONTEXT_CHARS) {
      // Try truncating this doc to fit
      const remaining = MAX_CONTEXT_CHARS - totalChars
      if (remaining > 200) {
        const truncated = `<doc title="${doc.title}" section="${doc.section}">\n${doc.content.slice(0, remaining - 50)}...\n</doc>`
        items.push(truncated)
      }
      break
    }

    items.push(entry)
    totalChars += entry.length
  }

  return items.join('\n\n')
}

/**
 * Returns the audiences accessible to a given role.
 */
export function getAudiencesForRole(role: string | null): string[] {
  return ROLE_AUDIENCE_MAP[role ?? 'student'] ?? ROLE_AUDIENCE_MAP.student
}
