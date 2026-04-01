export type DocMeta = {
  slug: string;
  title: string;
  audience: string[];
  section: string;
  order: number;
  last_updated: string;
};

export type DocPage = {
  meta: DocMeta;
  content: string;
};

export type NavSection = {
  section: string;
  pages: DocMeta[];
};
