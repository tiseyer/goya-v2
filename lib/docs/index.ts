import 'server-only';
import fs from 'fs';
import path from 'path';
import type { DocMeta, DocPage, NavSection } from './types';

export type { DocMeta, DocPage, NavSection };

const DOCS_DIR = path.join(process.cwd(), 'docs');

/** Audience directories that contain markdown documentation files */
const DOC_DIRS = ['admin', 'moderator', 'teacher', 'student', 'developer'];

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const frontmatter = match[1];
  const content = match[2];
  const data: Record<string, unknown> = {};

  for (const line of frontmatter.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Parse arrays like ["admin"] or ["admin", "moderator"]
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s: string) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    // Strip quotes from string values
    else if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    // Parse numbers
    else if (typeof value === 'string' && /^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }

    data[key] = value;
  }

  return { data, content };
}

/** Read all markdown doc files and return their metadata */
export function getAllDocs(): DocMeta[] {
  const docs: DocMeta[] = [];

  for (const dir of DOC_DIRS) {
    const dirPath = path.join(DOCS_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      const { data } = parseFrontmatter(raw);
      const slug = `${dir}/${file.replace(/\.md$/, '')}`;

      docs.push({
        slug,
        title: (data.title as string) || file.replace(/\.md$/, ''),
        audience: Array.isArray(data.audience) ? (data.audience as string[]) : [dir],
        section: (data.section as string) || dir,
        order: typeof data.order === 'number' ? data.order : 99,
        last_updated: (data.last_updated as string) || '',
      });
    }
  }

  return docs.sort((a, b) => a.order - b.order);
}

/** Get a specific doc by slug (e.g., "admin/overview") */
export function getDocBySlug(slug: string): DocPage | null {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = parseFrontmatter(raw);

  const parts = slug.split('/');
  const dir = parts[0];

  return {
    meta: {
      slug,
      title: (data.title as string) || parts[parts.length - 1],
      audience: Array.isArray(data.audience) ? (data.audience as string[]) : [dir],
      section: (data.section as string) || dir,
      order: typeof data.order === 'number' ? data.order : 99,
      last_updated: (data.last_updated as string) || '',
    },
    content,
  };
}

/** Build navigation tree grouped by section, optionally filtered by audience */
export function getNavTree(audienceFilter?: string): NavSection[] {
  const allDocs = getAllDocs();

  const filtered = audienceFilter
    ? allDocs.filter((d) => d.audience.includes(audienceFilter))
    : allDocs;

  const sectionMap = new Map<string, DocMeta[]>();
  for (const doc of filtered) {
    const pages = sectionMap.get(doc.section) || [];
    pages.push(doc);
    sectionMap.set(doc.section, pages);
  }

  // Preserve a consistent section order
  const sectionOrder = DOC_DIRS;
  const sections: NavSection[] = [];

  for (const section of sectionOrder) {
    const pages = sectionMap.get(section);
    if (pages && pages.length > 0) {
      sections.push({
        section,
        pages: pages.sort((a, b) => a.order - b.order),
      });
    }
  }

  return sections;
}
