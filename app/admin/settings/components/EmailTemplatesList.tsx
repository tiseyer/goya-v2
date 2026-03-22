'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toggleTemplateActive, initializeDefaultTemplates } from '@/app/actions/email-templates';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  subject: string;
  html_content: string;
  is_active: boolean;
  last_edited_by: string | null;
  updated_at: string;
}

export default function EmailTemplatesList() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .order('name');

    if (fetchError) {
      setError('Failed to load templates.');
    } else {
      setTemplates(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleToggleActive = async (templateKey: string, newValue: boolean) => {
    // Optimistic update
    setTemplates((prev) =>
      prev.map((t) =>
        t.template_key === templateKey ? { ...t, is_active: newValue } : t,
      ),
    );
    try {
      await toggleTemplateActive(templateKey, newValue);
    } catch {
      // Revert on error
      setTemplates((prev) =>
        prev.map((t) =>
          t.template_key === templateKey ? { ...t, is_active: !newValue } : t,
        ),
      );
    }
  };

  const handleInitialize = async () => {
    setInitializing(true);
    setStatusMessage(null);
    try {
      await initializeDefaultTemplates();
      await fetchTemplates();
      setStatusMessage('All templates initialized');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setInitializing(false);
    }
  };

  const hasEmptyContent = templates.some(
    (t) => !t.html_content || t.html_content.trim() === '',
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 h-[72px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <p className="text-sm text-red-600">{error}</p>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (templates.length === 0) {
    return (
      <p className="text-sm text-center text-slate-400 py-8">No templates found.</p>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-end gap-3 min-h-[28px]">
        {statusMessage && (
          <span className="text-xs text-emerald-600">{statusMessage}</span>
        )}
        {hasEmptyContent && (
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initializing ? 'Initializing…' : 'Initialize Default Content'}
          </button>
        )}
      </div>

      {/* Template rows */}
      {templates.map((template) => {
        const editedLabel = template.last_edited_by
          ? `Last edited ${new Date(template.updated_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`
          : 'Never edited';

        return (
          <div
            key={template.id}
            className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm px-5 py-4 flex items-center gap-4"
          >
            {/* Left: info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{template.name}</p>
              {template.description && (
                <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
              )}
              <p className="text-xs text-slate-400 italic truncate mt-0.5">{template.subject}</p>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-400 whitespace-nowrap">{editedLabel}</span>

              {/* Active toggle pill */}
              <button
                onClick={() => handleToggleActive(template.template_key, !template.is_active)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  template.is_active
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {template.is_active ? 'Active' : 'Paused'}
              </button>

              {/* Edit button */}
              <button
                onClick={() => router.push('/admin/email-templates/' + template.template_key)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#00B5A3] text-[#00B5A3] bg-white hover:bg-[#00B5A3]/5 transition-colors font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
