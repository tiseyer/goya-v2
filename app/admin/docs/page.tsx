import Link from 'next/link';
import { getNavTree } from '@/lib/docs';

const SECTION_META: Record<string, { description: string; color: string }> = {
  admin: {
    description: 'Panel configuration, user management, shop, analytics, and system settings.',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  moderator: {
    description: 'Content review workflows, inbox management, and verification guides.',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  teacher: {
    description: 'Teaching hours, credits, media library, events, and course management.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  student: {
    description: 'Getting started, finding teachers, events, and upgrading your account.',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  developer: {
    description: 'Architecture, API reference, database schema, deployment, and integrations.',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

export default function AdminDocsLandingPage() {
  const navTree = getNavTree();

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--goya-primary)]">Documentation</h1>
      <p className="mt-2 text-slate-600">
        Browse the GOYA platform documentation by section. Each section covers a specific audience
        and area of the platform.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {navTree.map((section) => {
          const meta = SECTION_META[section.section] || {
            description: `Documentation for ${section.section}.`,
            color: 'bg-slate-50 text-slate-700 border-slate-200',
          };
          const firstPage = section.pages[0];

          return (
            <Link
              key={section.section}
              href={`/admin/docs/${firstPage.slug}`}
              className="group block rounded-xl border border-slate-200 bg-white p-5 hover:border-[var(--goya-primary)] hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 capitalize group-hover:text-[var(--goya-primary)] transition-colors">
                  {section.section}
                </h2>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}
                >
                  {section.section}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{meta.description}</p>
              <p className="mt-4 text-xs font-medium text-slate-400">
                {section.pages.length} {section.pages.length === 1 ? 'page' : 'pages'}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
