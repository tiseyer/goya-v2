'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-[var(--goya-primary)] mb-4">{children}</h1>
  ),
  h2: ({ children }) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h2 id={id} className="text-xl font-semibold text-[var(--goya-primary)] mt-8 mb-4 scroll-mt-20">
        <a href={`#${id}`} className="hover:underline">
          {children}
        </a>
      </h2>
    );
  },
  h3: ({ children }) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h3 id={id} className="text-lg font-medium text-slate-900 mt-6 mb-3 scroll-mt-20">
        <a href={`#${id}`} className="hover:underline">
          {children}
        </a>
      </h3>
    );
  },
  h4: ({ children }) => (
    <h4 className="text-base font-medium text-slate-800 mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }) => <p className="mb-4 text-slate-700 leading-relaxed">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[var(--goya-primary)] hover:underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-1 text-slate-700">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1 text-slate-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[var(--goya-primary)] pl-4 italic text-slate-600 my-4">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className={`${className || ''} text-sm`}>{children}</code>
      );
    }
    return (
      <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto mb-4 text-sm">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-slate-200 text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 px-3 py-2 text-slate-600">{children}</td>
  ),
  tr: ({ children }) => <tr className="even:bg-slate-50">{children}</tr>,
  hr: () => <hr className="my-6 border-slate-200" />,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt || ''} className="max-w-full rounded-lg my-4" />
  ),
};

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose-goya">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
